// store.mjs: Ablage im gemeinsamen Daten-Ordner (dasselbe Volume wie das CRM).
//   settings.json  – schreibt das CRM (Zeitplan, Plattformen, verschlüsselte Schlüssel, ausgeschaltete Videos)
//   state.json     – schreibt nur dieser Worker (Status je Video, nächster Termin, Herzschlag)
//   jobs/*.json    – Aufträge aus dem CRM (jetzt rendern, jetzt posten, …), werden nach Erledigung gelöscht
//   videos/, voice/ – fertige Videos + Vorschaubilder, zwischengespeicherte Sprachaufnahmen
//   voice-sample/  – die eigene Sprachaufnahme aus dem CRM, ownvoice/ – daraus berechneter Stimmabdruck
//   hf/            – Sprachmodell-Cache (HF_HOME, wird nicht gesichert)
import { createDecipheriv } from "node:crypto";
import { appendFile, chown, mkdir, readFile, readdir, rename, stat, unlink, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

export const DIR = process.env.SOCIAL_DIR || "/data/social";
export const P = {
  settings: join(DIR, "settings.json"),
  state: join(DIR, "state.json"),
  jobs: join(DIR, "jobs"),
  videos: join(DIR, "videos"),
  voice: join(DIR, "voice"),
  sample: join(DIR, "voice-sample"),
  own: join(DIR, "ownvoice"),
  figur: join(DIR, "figur"),
  log: join(DIR, "log.ndjson"),
};

// Dateien gehören demselben Benutzer wie der Daten-Ordner, damit das CRM sie lesen kann
let owner = null;
async function own(path) {
  if (process.getuid?.() !== 0) return;
  if (!owner) { const s = await stat(dirname(DIR)).catch(() => null); owner = s ? { uid: s.uid, gid: s.gid } : { uid: 0, gid: 0 }; }
  await chown(path, owner.uid, owner.gid).catch(() => {});
}

export async function ensureDirs() {
  for (const d of [DIR, P.jobs, P.videos, P.voice, P.own, P.figur]) { await mkdir(d, { recursive: true, mode: 0o750 }); await own(d); }
}
export async function ownFile(path) { await own(path); }

export async function readJson(file, fallback) {
  try { return JSON.parse(await readFile(file, "utf8")); } catch { return fallback; }
}

export async function writeJson(file, data) {
  const tmp = `${file}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify(data, null, 1), { mode: 0o640 });
  await own(tmp);
  await rename(tmp, file);
}

/** AES-256-GCM wie im CRM: "enc:v1:<iv>:<tag>:<ciphertext>" mit LEAD_ENCRYPTION_KEY */
export function decrypt(value) {
  if (!value) return "";
  if (!value.startsWith("enc:v1:")) return value;
  const k = Buffer.from(process.env.LEAD_ENCRYPTION_KEY || "", "base64");
  if (k.length !== 32) throw new Error("LEAD_ENCRYPTION_KEY fehlt oder ist ungültig");
  const [, , iv, tag, ct] = value.split(":");
  const d = createDecipheriv("aes-256-gcm", k, Buffer.from(iv, "base64"));
  d.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([d.update(Buffer.from(ct, "base64")), d.final()]).toString("utf8");
}

/** Ereignis ins Protokoll (für die Anzeige im CRM; keine Kundendaten) */
export async function log(kind, text, extra = {}) {
  const line = JSON.stringify({ at: new Date().toISOString(), kind, text, ...extra });
  console.log(`[${kind}] ${text}`);
  await appendFile(P.log, line + "\n").catch(() => {});
  await own(P.log);
}

/** Protokoll auf die letzten 300 Einträge kürzen */
export async function trimLog() {
  try {
    const lines = (await readFile(P.log, "utf8")).trim().split("\n");
    if (lines.length > 400) await writeFile(P.log, lines.slice(-300).join("\n") + "\n");
  } catch { /* noch kein Protokoll */ }
}

export async function takeJobs() {
  const files = (await readdir(P.jobs).catch(() => [])).filter((f) => f.endsWith(".json")).sort();
  const jobs = [];
  for (const f of files) {
    const j = await readJson(join(P.jobs, f), null);
    await unlink(join(P.jobs, f)).catch(() => {});
    if (j && typeof j.type === "string") jobs.push(j);
  }
  return jobs;
}
