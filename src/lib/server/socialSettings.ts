import "server-only";
import { randomBytes } from "node:crypto";
import { mkdir, readFile, readdir, rename, rm, stat, writeFile } from "node:fs/promises";
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
  cfAccount: string;        // Cloudflare-Account-ID für die Figur (kein Geheimnis)
  figurFoto?: FigurFoto;
  speed: number;           // Sprechtempo 0,9–1,2
  aiLabel: boolean;        // als KI-erstellt kennzeichnen
  promo: boolean;          // TikTok: Werbung für das eigene Unternehmen kennzeichnen
  repeat: boolean;         // wenn alle Videos gepostet sind: von vorn beginnen (im anderen Stil)
  disabled: string[];      // Videos, die nicht gepostet werden
  postVia: PostVia;        // direkt über die offiziellen Schnittstellen (kostenlos) oder über Upload-Post
  onlyUploads: boolean;    // nur selbst hochgeladene Videos posten (automatisch erstellte bleiben aus)
  karussell: boolean;      // Bilder-Posts (Instagram-Karussell aus tools/shorts/karussell/posts) mit posten
  karussellTiktok: boolean; // Bilder-Posts zusätzlich als TikTok-Foto-Post (Domain muss bei TikTok bestätigt sein)
  tiktokClientKey: string; // Client Key der eigenen TikTok-App (kein Geheimnis)
  tiktokMode: TiktokMode;  // als Entwurf ins TikTok-Postfach oder direkt veröffentlichen
};
export type PostVia = "direkt" | "uploadpost";
export type TiktokMode = "entwurf" | "direkt";
export type TiktokTokens = { access_token: string; refresh_token: string; open_id: string; scope: string; expires_at: number; refresh_expires_at: number };
export type TiktokUser = { name: string; scope: string; at: string };
export type VoiceEngine = "own" | "elevenlabs";
export type VoiceSample = { file: string; at: string; seconds: number; bytes: number };
export type FigurFoto = { file: string; at: string; bytes: number };
type KeyName = "elevenlabs" | "uploadpost" | "huggingface" | "cloudflare" | "instagram" | "tiktokSecret" | "tiktok";
type Stored = SocialSettings & { keys?: Partial<Record<KeyName, string>>; updatedAt?: string; tiktokUser?: TiktokUser };

export const SOCIAL_DEFAULTS: SocialSettings = {
  enabled: false, days: [1, 3, 5], times: ["18:30"], platforms: ["tiktok", "instagram", "youtube"],
  uploadUser: "", voiceEngine: "own", voiceId: "", voiceName: "", cfAccount: "", speed: 1.1, aiLabel: true, promo: true, repeat: true, disabled: [],
  postVia: "direkt", onlyUploads: true, karussell: true, karussellTiktok: false, tiktokClientKey: "", tiktokMode: "entwurf",
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
  return { ...rest, hasElevenlabs: Boolean(keys?.elevenlabs), hasUploadpost: Boolean(keys?.uploadpost), hasHuggingface: Boolean(keys?.huggingface), hasCloudflare: Boolean(keys?.cloudflare), hasInstagram: Boolean(keys?.instagram), hasTiktokSecret: Boolean(keys?.tiktokSecret), hasTiktok: Boolean(keys?.tiktok) };
}

/** Speichern. Schlüssel: leer/undefined = behalten, null = löschen, Text = neu (verschlüsselt). */
export async function saveSocialSettings(input: Partial<SocialSettings>, keys: Partial<Record<KeyName, string | null>> = {}) {
  const prev = await readStored();
  const next: Stored = { ...prev, ...input, keys: { ...prev.keys }, updatedAt: new Date().toISOString() };
  for (const k of ["elevenlabs", "uploadpost", "huggingface", "cloudflare", "instagram", "tiktokSecret"] as const) {
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

/** Foto für die Figur speichern (ersetzt das vorige). Der Worker erzeugt daraus mit Cloudflare die Figur. */
export const FOTO_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
export async function saveFigurFoto(data: Buffer, ext: string) {
  const dir = path.join(socialDir(), "figur");
  await mkdir(dir, { recursive: true, mode: 0o750 });
  const file = `foto-${Date.now().toString(36)}.${ext}`;
  await writeFile(path.join(dir, file), data, { mode: 0o640 });
  for (const f of await readdir(dir).catch(() => [] as string[])) if (f.startsWith("foto-") && f !== file) await rm(path.join(dir, f), { force: true });
  const s = await readStored();
  await writeStored({ ...s, figurFoto: { file, at: new Date().toISOString(), bytes: data.length } });
  return publicSocialSettings();
}

export async function toggleEpisode(id: string, on: boolean) {
  const s = await readStored();
  const set = new Set(s.disabled);
  if (on) set.delete(id); else set.add(id);
  await writeStored({ ...s, disabled: [...set] });
}

export async function tiktokCreds(): Promise<{ clientKey: string; secret: string; tokens: TiktokTokens | null }> {
  const s = await readStored();
  let tokens: TiktokTokens | null = null;
  try { tokens = s.keys?.tiktok ? JSON.parse(decrypt(s.keys.tiktok)) : null; } catch { tokens = null; }
  return { clientKey: s.tiktokClientKey || "", secret: s.keys?.tiktokSecret ? decrypt(s.keys.tiktokSecret) : "", tokens };
}
/** Neue TikTok-Zugänge speichern (verschlüsselt); user nur beim Verbinden */
export async function saveTiktokConnection(tokens: TiktokTokens, user?: TiktokUser) {
  if (!encryptionEnabled()) throw new Error("Auf dem Server fehlt LEAD_ENCRYPTION_KEY – Zugang kann nicht sicher gespeichert werden.");
  const s = await readStored();
  await writeStored({ ...s, ...(user ? { tiktokUser: user } : {}), keys: { ...s.keys, tiktok: encrypt(JSON.stringify(tokens)) }, updatedAt: new Date().toISOString() });
}
export async function deleteTiktokConnection() {
  const s = await readStored();
  const keys = { ...s.keys }; delete keys.tiktok;
  const { tiktokUser, ...rest } = s; void tiktokUser;
  await writeStored({ ...rest, keys, updatedAt: new Date().toISOString() });
}

export async function instagramToken(): Promise<string> {
  const s = await readStored();
  return s.keys?.instagram ? decrypt(s.keys.instagram) : "";
}

/* ---------- Eigene Videos: im CRM hochgeladen, der Worker postet sie zum Termin ---------- */
export type TiktokPostOptions = { privacy: string; comments: boolean; duet: boolean; stitch: boolean; aigc: boolean; ownBrand: boolean };
export type Upload = { id: string; title: string; caption: string; at: string; bytes: number; tiktok?: TiktokPostOptions };
export const UPLOAD_ID = /^eigen-[a-z0-9]{6,30}$/;
const uploadDir = () => path.join(socialDir(), "uploads");
const videoFile = (id: string) => path.join(socialDir(), "videos", `${id}.mp4`);

export async function listUploads(): Promise<Upload[]> {
  const out: Upload[] = [];
  for (const f of await readdir(uploadDir()).catch(() => [] as string[])) {
    if (!f.endsWith(".json") || !UPLOAD_ID.test(f.slice(0, -5))) continue;
    try { out.push(JSON.parse(await readFile(path.join(uploadDir(), f), "utf8"))); } catch { /* defekt – überspringen */ }
  }
  return out.sort((a, b) => a.at.localeCompare(b.at));
}

export async function saveUpload(data: Buffer, meta: { title: string; caption: string; tiktok?: TiktokPostOptions }): Promise<Upload> {
  await mkdir(uploadDir(), { recursive: true, mode: 0o750 });
  await mkdir(path.dirname(videoFile("x")), { recursive: true, mode: 0o750 });
  const id = `eigen-${Date.now().toString(36)}${randomBytes(3).toString("hex")}`;
  const u: Upload = { id, title: meta.title, caption: meta.caption, at: new Date().toISOString(), bytes: data.length, ...(meta.tiktok ? { tiktok: meta.tiktok } : {}) };
  await writeFile(`${videoFile(id)}.tmp`, data, { mode: 0o640 });
  await rename(`${videoFile(id)}.tmp`, videoFile(id));
  await writeFile(path.join(uploadDir(), `${id}.json`), JSON.stringify(u), { mode: 0o640 });   // erst danach sieht der Worker das Video
  return u;
}

export async function updateUpload(id: string, meta: { title: string; caption: string; tiktok?: TiktokPostOptions }): Promise<Upload | null> {
  if (!UPLOAD_ID.test(id)) return null;
  const f = path.join(uploadDir(), `${id}.json`);
  try {
    const u: Upload = { ...JSON.parse(await readFile(f, "utf8")), title: meta.title, caption: meta.caption, ...(meta.tiktok ? { tiktok: meta.tiktok } : {}) };
    await writeFile(`${f}.tmp`, JSON.stringify(u), { mode: 0o640 });
    await rename(`${f}.tmp`, f);
    return u;
  } catch { return null; }
}

export async function deleteUpload(id: string) {
  if (!UPLOAD_ID.test(id)) return;
  await rm(path.join(uploadDir(), `${id}.json`), { force: true });
  await rm(videoFile(id), { force: true });
  await rm(path.join(socialDir(), "videos", `${id}.jpg`), { force: true });
}

/** Kurzzeit-Kopie für Instagram – Video oder Bild eines Bilder-Posts (Zufallsname, höchstens 6 Stunden alt) */
export async function publicClip(name: string): Promise<string | null> {
  if (!/^[a-f0-9]{32}\.(mp4|jpg)$/.test(name)) return null;
  const p = path.join(socialDir(), "public", name);
  const s = await stat(p).catch(() => null);
  return s?.isFile() && Date.now() - s.mtimeMs < 6 * 3600_000 ? p : null;
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

export const JOB_TYPES = ["render", "post", "done", "reset", "usage", "voicetest", "figur", "probe", "reelstimmen"] as const;
export async function addSocialJob(type: (typeof JOB_TYPES)[number], id = "") {
  const dir = file("jobs");
  await mkdir(dir, { recursive: true, mode: 0o750 });
  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.json`;
  await writeFile(path.join(dir, name), JSON.stringify({ type, id, at: new Date().toISOString() }), { mode: 0o640 });
}

/** Pfad zu einem fertigen Video/Vorschaubild/der Hörprobe – nur einfache Dateinamen */
export function socialMediaPath(name: string): string | null {
  if (!/^[a-z0-9][a-z0-9-]{0,80}\.(mp4|jpg)$/.test(name) && name !== "voice-test.mp3" && name !== "reel-stimmen.zip") return null;
  return path.join(socialDir(), "videos", name);
}
