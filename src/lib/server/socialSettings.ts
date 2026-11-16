import "server-only";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
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
  voiceId: string;
  voiceName: string;
  speed: number;           // Sprechtempo 0,9–1,2
  aiLabel: boolean;        // als KI-erstellt kennzeichnen
  promo: boolean;          // TikTok: Werbung für das eigene Unternehmen kennzeichnen
  repeat: boolean;         // wenn alle Videos gepostet sind: von vorn beginnen (im anderen Stil)
  disabled: string[];      // Videos, die nicht gepostet werden
};
type Stored = SocialSettings & { keys?: { elevenlabs?: string; uploadpost?: string }; updatedAt?: string };

export const SOCIAL_DEFAULTS: SocialSettings = {
  enabled: false, days: [1, 3, 5], times: ["18:30"], platforms: ["tiktok", "instagram", "youtube"],
  uploadUser: "", voiceId: "", voiceName: "", speed: 1.1, aiLabel: true, promo: true, repeat: true, disabled: [],
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
  return { ...rest, hasElevenlabs: Boolean(keys?.elevenlabs), hasUploadpost: Boolean(keys?.uploadpost) };
}

/** Speichern. Schlüssel: leer/undefined = behalten, null = löschen, Text = neu (verschlüsselt). */
export async function saveSocialSettings(input: Partial<SocialSettings>, keys: { elevenlabs?: string | null; uploadpost?: string | null } = {}) {
  const prev = await readStored();
  const next: Stored = { ...prev, ...input, keys: { ...prev.keys }, updatedAt: new Date().toISOString() };
  for (const k of ["elevenlabs", "uploadpost"] as const) {
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

export const JOB_TYPES = ["render", "post", "reset", "usage"] as const;
export async function addSocialJob(type: (typeof JOB_TYPES)[number], id = "") {
  const dir = file("jobs");
  await mkdir(dir, { recursive: true, mode: 0o750 });
  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.json`;
  await writeFile(path.join(dir, name), JSON.stringify({ type, id, at: new Date().toISOString() }), { mode: 0o640 });
}

/** Pfad zu einem fertigen Video/Vorschaubild – nur einfache Dateinamen */
export function socialMediaPath(name: string): string | null {
  if (!/^[a-z0-9][a-z0-9-]{0,80}\.(mp4|jpg)$/.test(name)) return null;
  return path.join(socialDir(), "videos", name);
}
