// ownvoice.mjs: die eigene Stimme ohne Abo. Kyutai Pocket TTS läuft direkt auf dem Server, auf dem Prozessor,
// ohne Grafikkarte. Das Programm steckt im Docker-Image (worker/Dockerfile), das Sprachmodell (ca. 400 MB) lädt es beim
// ersten Mal von HuggingFace und legt es im Daten-Ordner ab (HF_HOME).
//
// Ablauf: Aufnahme aus dem CRM → bereinigt (24 kHz mono, Ränder ohne Stille, gleichmäßige Lautstärke, max. 20 s)
//         → einmalig in einen Stimmabdruck umgewandelt (.safetensors) → damit jeden Satz sprechen → MP3.
// Rechte: Code MIT, Modell CC BY 4.0 (Namensnennung „Kyutai Pocket TTS“). Klonen nur der eigenen Stimme (Kyutai-Regeln).
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { readFile, readdir, rename, rm } from "node:fs/promises";
import { join } from "node:path";
import { sprechtext } from "../lib/sprechtext.mjs";

const BIN = process.env.POCKET_TTS_BIN || "/opt/pocket-tts/pocket-tts";
export const ENGINE = "pocket-tts-4.0.1-german";   // Teil der Video-Signatur: neue Version = Stimme neu aufnehmen
export const CREDIT = "Stimme: KI-Stimme von Adrian Seitz, erzeugt mit Kyutai Pocket TTS (CC BY 4.0).";
const LANGUAGE = "german";
const MAX_SAMPLE_SEC = 20;

/** Fehler mit einer Erklärung, die im CRM-Protokoll steht */
export class VoiceError extends Error {
  constructor(text, code = "fehler") { super(text); this.code = code; }
}

function run(cmd, args, { env = {}, timeout = 10 * 60_000 } = {}) {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, { env: { ...process.env, ...env }, timeout, maxBuffer: 8 << 20 }, (err, stdout, stderr) => {
      if (err) { err.stderr = String(stderr || ""); reject(err); } else resolve({ stdout: String(stdout), stderr: String(stderr) });
    });
  });
}

/** Fehler des Sprachprogramms in eine verständliche Meldung übersetzen */
function explain(err) {
  const out = `${err.stderr || ""} ${err.message || ""}`;
  if (err.code === "ENOENT") return new VoiceError("Das Sprachprogramm fehlt auf dem Server. Es kommt mit dem nächsten automatischen Update (spätestens in 15 Minuten).", "programm");
  if (err.signal === "SIGILL" || /illegal instruction/i.test(out)) return new VoiceError("Der Prozessor des Servers kann das Sprachprogramm nicht ausführen (AVX2 fehlt).", "programm");
  if (err.killed || err.signal === "SIGTERM") return new VoiceError("Das Sprechen hat zu lange gedauert und wurde abgebrochen.", "zeit");
  if (/voice cloning|accept the terms|gated|401|403|unauthori[sz]ed|forbidden/i.test(out))
    return new VoiceError("Kein Zugang zum Stimm-Modell: Bei huggingface.co/kyutai/pocket-tts den Bedingungen zustimmen und im CRM einen gültigen HuggingFace-Token eintragen.", "zugang");
  if (/dns|resolve|connect|timed out|network/i.test(out)) return new VoiceError("Das Stimm-Modell konnte nicht von HuggingFace geladen werden (keine Verbindung). Nächster Versuch beim nächsten Video.", "netz");
  const line = out.split("\n").map((l) => l.trim()).filter(Boolean).pop() || "unbekannter Fehler";
  return new VoiceError(`Sprachprogramm: ${line.slice(0, 220)}`);
}

const envFor = (token) => ({
  HF_TOKEN: token,
  HF_HUB_DISABLE_TELEMETRY: "1",
  RAYON_NUM_THREADS: process.env.SHORTS_TTS_THREADS || "1",   // der Worker hat eine CPU (docker-compose: cpus 1.0)
});

async function seconds(file) {
  const { stdout } = await run("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file], { timeout: 60_000 });
  return parseFloat(stdout) || 0;
}

/**
 * Stimmabdruck aus der Aufnahme (wird nur einmal pro Aufnahme berechnet).
 * @returns {Promise<{ emb: string, hash: string, seconds: number }>}
 */
export async function prepareVoice({ sample, dir, token }) {
  if (!existsSync(sample)) throw new VoiceError("Die Sprachaufnahme fehlt. Bitte im CRM neu aufnehmen.", "aufnahme");
  const hash = createHash("sha1").update(await readFile(sample)).update(ENGINE).digest("hex").slice(0, 12);
  const ref = join(dir, `ref-${hash}.wav`), emb = join(dir, `ref-${hash}.safetensors`);
  if (existsSync(emb) && existsSync(ref)) return { emb, hash, seconds: await seconds(ref) };

  // bereinigen: Brummen raus, Stille an Anfang und Ende weg, Lautstärke angleichen, auf 20 s begrenzen
  const trim = "silenceremove=start_periods=1:start_duration=0.05:start_threshold=-42dB";
  const tmp = `${ref}.tmp.wav`;
  try {
    await run("ffmpeg", ["-y", "-v", "error", "-i", sample, "-vn", "-ac", "1", "-ar", "24000",
      "-af", `highpass=f=70,${trim},areverse,${trim},areverse,loudnorm=I=-19:TP=-2:LRA=9`, "-t", String(MAX_SAMPLE_SEC), "-c:a", "pcm_s16le", tmp], { timeout: 120_000 });
  } catch {
    throw new VoiceError("Die Sprachaufnahme lässt sich nicht lesen. Bitte im CRM neu aufnehmen.", "aufnahme");
  }
  const sec = await seconds(tmp);
  if (sec < 6) { await rm(tmp, { force: true }); throw new VoiceError(`Die Sprachaufnahme ist zu kurz (${sec.toFixed(0)} s Sprache). Bitte mindestens 15 Sekunden am Stück sprechen.`, "aufnahme"); }
  await rename(tmp, ref);

  try { await run(BIN, ["export-voice", ref, emb, "--language", LANGUAGE, "--quiet"], { env: envFor(token), timeout: 20 * 60_000 }); }
  catch (err) { await rm(emb, { force: true }); throw explain(err); }
  if (!existsSync(emb)) throw new VoiceError("Der Stimmabdruck wurde nicht erstellt.");

  // ältere Abdrücke aufräumen
  for (const f of await readdir(dir).catch(() => [])) if (f.startsWith("ref-") && !f.startsWith(`ref-${hash}`)) await rm(join(dir, f), { force: true });
  return { emb, hash, seconds: sec };
}

/** Einen Text mit der eigenen Stimme sprechen und als MP3 speichern (Tempo wie im CRM eingestellt). */
export async function speak({ text, emb, out, speed = 1.0, token }) {
  const said = sprechtext(text);
  if (!said) throw new VoiceError("Leerer Sprechertext.");
  const wav = `${out}.tmp.wav`;
  try {
    try { await run(BIN, ["generate", "--language", LANGUAGE, "--voice", emb, "--text", said, "--output-path", wav, "--quiet"], { env: envFor(token), timeout: 20 * 60_000 }); }
    catch (err) { throw explain(err); }
    if (!existsSync(wav)) throw new VoiceError("Das Sprachprogramm hat keine Aufnahme erzeugt.");
    const tempo = Math.min(1.25, Math.max(0.85, Number(speed) || 1));
    const trim = "silenceremove=start_periods=1:start_duration=0.02:start_threshold=-45dB";
    await run("ffmpeg", ["-y", "-v", "error", "-i", wav, "-af", `${trim},areverse,${trim},areverse${tempo !== 1 ? `,atempo=${tempo.toFixed(3)}` : ""}`,
      "-ar", "44100", "-ac", "1", "-c:a", "libmp3lame", "-b:a", "160k", `${out}.tmp.mp3`], { timeout: 120_000 });
    await rename(`${out}.tmp.mp3`, out);
  } finally {
    await rm(wav, { force: true }); await rm(`${out}.tmp.mp3`, { force: true });
  }
  return { chars: said.length };
}
