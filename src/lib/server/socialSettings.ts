import "server-only";
import { mkdir, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { serverConfig } from "./config";
import { decrypt, encrypt, encryptionEnabled } from "./crypto";

/**
 * Video-Automatik (TikTok, Instagram, YouTube Shorts): Einstellungen aus dem CRM.
 * Das CRM schreibt data/social/settings.json, der Worker (Docker-Service „shorts“) schreibt data/social/state.json.
 * API-Schlüssel werden mit LEAD_ENCRYPTION_KEY verschlüsselt gespeichert und nie an den Browser gegeben.
 */
export const PLATFORMS = ["tiktok", "instagram", "youtube"] as const;
export type Platform = (typeof PLATFORMS)[number];

export type SocialSettings = {
  enabled: boolean;
  days: number[];          // 0 = Sonntag … 6 = Samstag
  times: string[];         // "18:30"
  platforms: Platform[];
  uploadUser: string;      // Profilname bei Upload-Post
  voiceEngine: VoiceEngine; // eigene Stimme (kostenlos, auf dem Server) oder ElevenLabs
  voiceSample?: VoiceSample;
  voiceId: string;
  voiceName: string;
  speed: number;           // Sprechtempo 0,9–1,2
  aiLabel: boolean;        // als KI-erstellt kennzeichnen
  promo: boolean;          // TikTok: Werbung für das eigene Unternehmen kennzeichnen
  repeat: boolean;         // wenn alle Videos gepostet sind: von vorn beginnen (im anderen Stil)
  disabled: string[];      // Videos, die nicht gepostet werden
};
export type VoiceEngine = "own" | "elevenlabs";
export type VoiceSample = { file: string; at: string; seconds: number; bytes: number };
type KeyName = "elevenlabs" | "uploadpost" | "huggingface";
type Stored = SocialSettings & { keys?: Partial<Record<KeyName, string>>; updatedAt?: string };

export const SOCIAL_DEFAULTS: SocialSettings = {
  enabled: false, days: [1, 3, 5], times: ["18:30"], platforms: ["tiktok", "instagram", "youtube"],
  uploadUser: "", voiceEngine: "own", voiceId: "", voiceName: "", speed: 1.1, aiLabel: true, promo: true, repeat: true, disabled: [],
};

export const socialDir = () => path.join(serverConfig.storageDir, "social");
const file = (n: string) => path.join(socialDir(), n);

async function readStored(): Promise<Stored> {
  try {
    return { ...SOCIAL_DEFAULTS, ...JSON.parse(await readFile(file("settings.json"), "utf8")) };
  } catch {
    return { ...SOCIAL_DEFAULTS };
  }
}

async function writeStored(data: Stored) {
  await mkdir(socialDir(), { recursive: true, mode: 0o750 });
  const tmp = `${file("settings.json")}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify(data), { encoding: "utf8", mode: 0o640 });
  await rename(tmp, file("settings.json"));
}

/** Für die Oberfläche – ohne Schlüssel */
export async function publicSocialSettings() {
  const { keys, ...rest } = await readStored();
  return { ...rest, hasElevenlabs: Boolean(keys?.elevenlabs), hasUploadpost: Boolean(keys?.uploadpost), hasHuggingface: Boolean(keys?.huggingface) };
}

/** Speichern. Schlüssel: leer/undefined = behalten, null = löschen, Text = neu (verschlüsselt). */
export async function saveSocialSettings(input: Partial<SocialSettings>, keys: Partial<Record<KeyName, string | null>> = {}) {
  const prev = await readStored();
  const next: Stored = { ...prev, ...input, keys: { ...prev.keys }, updatedAt: new Date().toISOString() };
  for (const k of ["elevenlabs", "uploadpost", "huggingface"] as const) {
    const v = keys[k];
    if (v === null) delete next.keys![k];
    else if (v) {
      if (!encryptionEnabled()) throw new Error("Auf dem Server fehlt LEAD_ENCRYPTION_KEY – Schlüssel kann nicht sicher gespeichert werden.");
      next.keys![k] = encrypt(v);
    }
  }
  await writeStored(next);
  return publicSocialSettings();
}

/** Eigene Sprachaufnahme speichern (ersetzt die vorige). Der Worker macht daraus den Stimmabdruck. */
export const SAMPLE_TYPES: Record<string, string> = {
  "audio/webm": "webm", "video/webm": "webm", "audio/ogg": "ogg", "audio/mp4": "m4a", "audio/x-m4a": "m4a", "audio/m4a": "m4a",
  "video/mp4": "mp4", "audio/mpeg": "mp3", "audio/mp3": "mp3", "audio/wav": "wav", "audio/x-wav": "wav", "audio/wave": "wav", "audio/aac": "aac",
};
const sampleDir = () => path.join(socialDir(), "voice-sample");
export async function saveVoiceSample(data: Buffer, ext: string, seconds: number) {
  await mkdir(sampleDir(), { recursive: true, mode: 0o750 });
  const file = `sample-${Date.now().toString(36)}.${ext}`;
  await writeFile(path.join(sampleDir(), file), data, { mode: 0o640 });
  for (const f of await readdir(sampleDir()).catch(() => [] as string[])) if (f !== file) await rm(path.join(sampleDir(), f), { force: true });
  const s = await readStored();
  await writeStored({ ...s, voiceSample: { file, at: new Date().toISOString(), seconds: Math.round(seconds), bytes: data.length } });
  return publicSocialSettings();
}
export async function deleteVoiceSample() {
  await rm(sampleDir(), { recursive: true, force: true });
  const { voiceSample, ...s } = await readStored(); void voiceSample;
  await writeStored(s);
  return publicSocialSettings();
}

export async function toggleEpisode(id: string, on: boolean) {
  const s = await readStored();
  const set = new Set(s.disabled);
  if (on) set.delete(id); else set.add(id);
  await writeStored({ ...s, disabled: [...set] });
}

export async function elevenlabsKey(): Promise<string> {
  const s = await readStored();
  return s.keys?.elevenlabs ? decrypt(s.keys.elevenlabs) : "";
}

/** Zustand, den der Worker schreibt (Status je Video, nächster Termin, Herzschlag) */
export async function readSocialState(): Promise<Record<string, unknown>> {
  try {
    return JSON.parse(await readFile(file("state.json"), "utf8"));
  } catch {
    return {};
  }
}

export async function readSocialLog(limit = 40): Promise<{ at: string; kind: string; text: string }[]> {
  try {
    const lines = (await readFile(file("log.ndjson"), "utf8")).trim().split("\n").slice(-limit).reverse();
    return lines.flatMap((l) => { try { const j = JSON.parse(l); return [{ at: String(j.at), kind: String(j.kind), text: String(j.text) }]; } catch { return []; } });
  } catch {
    return [];
  }
}

export const JOB_TYPES = ["render", "post", "reset", "usage", "voicetest"] as const;
export async function addSocialJob(type: (typeof JOB_TYPES)[number], id = "") {
  const dir = file("jobs");
  await mkdir(dir, { recursive: true, mode: 0o750 });
  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.json`;
  await writeFile(path.join(dir, name), JSON.stringify({ type, id, at: new Date().toISOString() }), { mode: 0o640 });
}

/** Pfad zu einem fertigen Video/Vorschaubild/der Hörprobe – nur einfache Dateinamen */
export function socialMediaPath(name: string): string | null {
  if (!/^[a-z0-9][a-z0-9-]{0,80}\.(mp4|jpg)$/.test(name) && name !== "voice-test.mp3") return null;
  return path.join(socialDir(), "videos", name);
}
