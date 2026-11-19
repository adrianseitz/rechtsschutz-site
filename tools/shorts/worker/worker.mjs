// worker.mjs: läuft dauerhaft neben der Website (Docker-Service „shorts“).
// Jede Minute: Aufträge aus dem CRM erledigen → laufende Uploads prüfen → die nächsten Videos vorab erstellen
// (mit der eigenen Stimme über Pocket TTS auf dem Server, oder mit ElevenLabs) → zum Termin posten (Upload-Post).
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderEpisode } from "../render.mjs";
import { P, decrypt, ensureDirs, log, ownFile, readJson, takeJobs, trimLog, writeJson } from "./store.mjs";
import { elevenlabsUsage, tts, uploadStatus, uploadVideo } from "./services.mjs";
import { CREDIT, ENGINE, VoiceError, prepareVoice, speak } from "./ownvoice.mjs";
import { figurSchritt, kitDir } from "./figur.mjs";
import { berlin, dueSlot, nextSlotLabel, normTimes } from "./schedule.mjs";
import { validateEpisode } from "../lib/validate.mjs";
import { zipStore } from "./zip.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const EPISODES = join(ROOT, "episodes");
const REELS = join(ROOT, "reels");   // Texte der neuen Reels (Design von Claude), siehe reelVoices()
const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.seitz-rechtsschutz.de").replace(/\/$/, "");
const TICK = +(process.env.SHORTS_TICK_MS || 60_000);
const AHEAD = 3;   // so viele Videos liegen mindestens fertig bereit (bei mehreren Terminen pro Tag: zwei Tage Vorrat)
const SLUG = { vermieter: "/vermieterrechtsschutz", firma: "/firmenrechtsschutz", arbeit: "/arbeitsrechtsschutz", privat: "/privatrechtsschutz" };
const PLATFORMS = ["tiktok", "instagram", "youtube"];
const sha = (s) => createHash("sha1").update(s).digest("hex");
const now = () => new Date().toISOString();
const msg = (e) => (e instanceof Error ? e.message : String(e)).slice(0, 300);

// ---------- Bibliothek ----------
const reported = new Set();   // jede fehlerhafte Datei nur einmal ins Protokoll
async function loadLibrary(cycle = 0) {
  const files = (await readdir(EPISODES).catch(() => [])).filter((f) => f.endsWith(".json"));
  const eps = [];
  for (const f of files) {
    let problem = null;
    try {
      const ep = JSON.parse(await readFile(join(EPISODES, f), "utf8"));
      const errors = validateEpisode(ep, f.replace(/\.json$/, ""));
      if (errors.length) problem = errors.join("; ");
      // in jeder zweiten Runde im anderen Stil – so ist die Wiederholung ein neues Video (Stimme bleibt, kostet nichts)
      else eps.push(cycle % 2 ? { ...ep, style: ep.style === "cartoon" ? "whiteboard" : "cartoon" } : ep);
    } catch (e) { problem = `unlesbar (${msg(e)})`; }
    if (problem && !reported.has(f + problem)) { reported.add(f + problem); await log("fehler", `Thema ${f} wird übersprungen: ${problem}`); }
  }
  return eps.sort((a, b) => (a.order ?? 999) - (b.order ?? 999) || a.id.localeCompare(b.id));
}
// nur was im Video zu sehen/hören ist – eine geänderte Bildunterschrift erzeugt kein neues Video
// 3D-Videos zeigen die Figur: ist eine neue Figur fertig, werden sie neu erstellt
let FIG_V = 0;
const epHash = (ep) => sha(JSON.stringify({ style: ep.style, beats: ep.beats, fine: ep.fine, ...(ep.style === "studio3d" ? { figur: FIG_V } : {}) })).slice(0, 12);
const sayHash = (ep) => sha(JSON.stringify(ep.beats.map((b) => b.say))).slice(0, 10);
// Welche Stimme: die eigene (kostenlos, läuft auf dem Server) oder ElevenLabs
const engineOf = (s) => (s.voiceEngine === "elevenlabs" ? "elevenlabs" : "own");
const sampleFile = (s) => (typeof s.voiceSample?.file === "string" && /^sample-[a-z0-9-]{1,40}\.(webm|ogg|m4a|mp4|mp3|wav|aac)$/.test(s.voiceSample.file) ? join(P.sample, s.voiceSample.file) : null);
function voiceReady(s, keys) {
  if (engineOf(s) === "elevenlabs") return Boolean(keys.el && s.voiceId);
  const f = sampleFile(s);
  return Boolean(keys.hf && f && existsSync(f));
}
// Nach einem Stimm-Fehler 30 Minuten nicht erneut versuchen (sonst würde jedes Video denselben Fehler wiederholen)
const BLOCK_MS = 30 * 60_000;
function voiceUsable(s, keys, state) {
  const b = state.voiceBlocked;
  const blocked = b && b.sig === voiceSig(s) && Date.now() < Date.parse(b.at) + BLOCK_MS && !(s.updatedAt && s.updatedAt > b.at);   // neu gespeichert (z. B. Token) = sofort neu versuchen
  return voiceReady(s, keys) && !blocked;
}
const voiceSig = (s) => engineOf(s) === "own"
  ? sha(["own", s.voiceSample?.file || "", s.speed ?? 1.1, ENGINE].join("|")).slice(0, 10)
  : s.voiceId ? sha([s.voiceId, s.speed ?? 1.1, s.model || "eleven_multilingual_v2"].join("|")).slice(0, 10) : "none";

function keysOf(settings) {
  const k = settings.keys || {};
  const get = (v) => { try { return decrypt(v || ""); } catch { return ""; } };
  return { el: get(k.elevenlabs), up: get(k.uploadpost), hf: get(k.huggingface), cf: get(k.cloudflare) };
}

// ---------- Stimme ----------
async function makeVoice(ep, settings, keys) {
  const dir = join(P.voice, `${ep.id}-${voiceSig(settings)}-${sayHash(ep)}`);   // neue Aufnahme nur bei geändertem Sprechertext
  await mkdir(dir, { recursive: true }); await ownFile(dir);
  const own = engineOf(settings) === "own";
  const voice = own ? await prepareVoice({ sample: sampleFile(settings), dir: P.own, token: keys.hf }) : null;
  let chars = 0;
  for (const [i, b] of ep.beats.entries()) {
    const f = join(dir, `beat-${i}.mp3`);
    if (existsSync(f)) continue;
    if (own) await speak({ text: b.say, emb: voice.emb, out: f, speed: settings.speed ?? 1.1, token: keys.hf });
    else await writeFile(f, await tts({ key: keys.el, voiceId: settings.voiceId, text: b.say, speed: settings.speed ?? 1.1, model: settings.model || "eleven_multilingual_v2", previous: ep.beats[i - 1]?.say, next: ep.beats[i + 1]?.say }));
    await ownFile(f); chars += b.say.length;
  }
  return { dir, chars };
}

/** Figur aus dem Foto erstellen lassen (Cloudflare FLUX.2), siehe figur.mjs */
const fotoFile = (s) => (typeof s.figurFoto?.file === "string" && /^foto-[a-z0-9]{1,20}\.(jpg|png|webp)$/.test(s.figurFoto.file) ? join(P.figur, s.figurFoto.file) : null);
async function figur(phase, settings, keys, state) {
  state.busy = phase === "neu" ? "Erstellt das Grundbild deiner Figur" : "Erstellt die Varianten deiner Figur";
  await writeJson(P.state, state);
  await figurSchritt(phase, {
    dir: P.figur, videos: P.videos, account: String(settings.cfAccount || ""), token: keys.cf, foto: fotoFile(settings),
    state, save: () => writeJson(P.state, state), log, own: ownFile,
  });
  state.busy = null;
}

/** Probevideo im 3D-Stil mit Figur und (falls eingerichtet) eigener Stimme → videos/probe-3d.mp4 */
async function probe(lib, settings, keys, state) {
  const base = lib.find((e) => e.id === "01-vermieter-mietausfall") || lib[0];
  state.probe = { status: "läuft", at: now() };
  state.busy = "Erstellt ein Probevideo mit deiner Figur";
  await writeJson(P.state, state);
  try {
    const ep = { ...base, style: "studio3d" };
    let voiceDir = null;
    if (voiceUsable(settings, keys, state)) {
      try { voiceDir = (await makeVoice(ep, settings, keys)).dir; } catch (err) { await log("fehler", `Probevideo ohne Stimme: ${msg(err)}`); }
    }
    const tmp = join(P.videos, "probe-3d.tmp.mp4"), out = join(P.videos, "probe-3d.mp4");
    const t0 = Date.now();
    const r = await renderEpisode({ episode: ep, out: tmp, voiceDir, figur: kitDir(P.figur), workers: +process.env.SHORTS_WORKERS || 1, log: () => {} });
    await rename(tmp, out); await ownFile(out);
    state.probe = { status: "fertig", at: now(), file: "probe-3d.mp4", voiced: Boolean(voiceDir), figur: Boolean(kitDir(P.figur)), duration: Math.round(r.duration), took: Math.round((Date.now() - t0) / 1000) };
    await log("video", `Probevideo im 3D-Stil fertig (${state.probe.duration} s, ${voiceDir ? "mit" : "ohne"} Stimme).`);
  } catch (err) {
    state.probe = { status: "fehler", at: now(), error: msg(err) };
    await log("fehler", `Probevideo: ${msg(err)}`);
  } finally {
    state.busy = null;
  }
}

/** Hörprobe mit der eigenen Stimme für das CRM (videos/voice-test.mp3) */
const TEST_TEXT = "Dein Mieter zahlt plötzlich keine Miete mehr? Dann wird es schnell teuer. Mach den kostenlosen Check, der Link ist in meiner Bio.";
async function voiceTest(settings, keys, state) {
  const sig = voiceSig(settings);
  state.voiceTest = { status: "läuft", at: now(), sig };
  state.busy = "Erstellt eine Hörprobe mit deiner Stimme";
  await writeJson(P.state, state);
  try {
    if (engineOf(settings) !== "own") throw new VoiceError("Die Hörprobe hier ist für die eigene Stimme. ElevenLabs-Stimmen hörst du direkt bei der Stimmauswahl.");
    if (!keys.hf) throw new VoiceError("Erst den HuggingFace-Token im CRM speichern.", "zugang");
    if (!sampleFile(settings)) throw new VoiceError("Erst eine Sprachaufnahme im CRM speichern.", "aufnahme");
    const t0 = Date.now();
    const voice = await prepareVoice({ sample: sampleFile(settings), dir: P.own, token: keys.hf });
    const out = join(P.videos, "voice-test.mp3");
    await speak({ text: TEST_TEXT, emb: voice.emb, out, speed: settings.speed ?? 1.1, token: keys.hf });
    await ownFile(out);
    delete state.voiceBlocked;
    state.voiceTest = { status: "fertig", at: now(), sig, file: "voice-test.mp3", took: Math.round((Date.now() - t0) / 1000), sampleSeconds: Math.round(voice.seconds) };
    await log("stimme", `Hörprobe mit deiner Stimme fertig (${state.voiceTest.took} s Rechenzeit).`);
  } catch (err) {
    state.voiceTest = { status: "fehler", at: now(), sig, error: msg(err) };
    await log("fehler", `Hörprobe: ${msg(err)}`);
  } finally {
    state.busy = null;
  }
}

// ---------- Reel-Stimmen: die Texte der neuen Reels mit der eingestellten Stimme → videos/reel-stimmen.zip ----------
// Im Sprechtext steht | für eine kurze Pause, || für eine lange, *Wort* für Betonung; „ich“ ist der Abschluss in der Ich-Form.
function reelText(b, engine) {
  const t = String(b.ich || b.voice || b.say || "").replace(/\*/g, "").trim();
  if (engine === "elevenlabs") return t.replace(/\s*\|\|\s*/g, ' <break time="0.6s" /> ').replace(/\s*\|\s*/g, ' <break time="0.3s" /> ').replace(/\s+/g, " ").trim();
  return t.replace(/([^\s.,:;!?|])\s*\|\|?\s*/g, "$1, ").replace(/\s*\|\|?\s*/g, " ").replace(/\s+/g, " ").trim();
}
async function reelVoices(settings, keys, state) {
  const t0 = Date.now();
  state.reelStimmen = { status: "läuft", at: now() };
  state.busy = "Spricht die Reel-Texte mit deiner Stimme ein";
  await writeJson(P.state, state);
  try {
    const engine = engineOf(settings);
    if (!voiceReady(settings, keys)) throw new VoiceError(engine === "own" ? "Erst HuggingFace-Token und Sprachaufnahme im CRM speichern." : "Erst den ElevenLabs-Schlüssel speichern und eine Stimme wählen.");
    const files = (await readdir(REELS).catch(() => [])).filter((f) => /^[a-z0-9-]+\.json$/.test(f)).sort();
    if (!files.length) throw new VoiceError("Keine Reel-Texte gefunden.");
    const voice = engine === "own" ? await prepareVoice({ sample: sampleFile(settings), dir: P.own, token: keys.hf }) : null;
    const base = join(P.voice, "reels", voiceSig(settings));
    const entries = [];
    let beats = 0, reels = 0;
    for (const f of files) {
      const ep = JSON.parse(await readFile(join(REELS, f), "utf8"));
      if (!/^[a-z0-9-]{1,60}$/.test(ep.id || "") || !Array.isArray(ep.beats)) continue;
      const dir = join(base, ep.id);
      await mkdir(dir, { recursive: true });
      const texts = ep.beats.map((b) => reelText(b, engine));
      for (const [i, text] of texts.entries()) {
        const file = join(dir, `beat-${i}-${sha(text).slice(0, 10)}.mp3`);   // schon gesprochen = nicht noch einmal bezahlen
        if (!existsSync(file)) {
          state.busy = `Spricht „${ep.title || ep.id}“ ein (${i + 1}/${texts.length})`;
          await writeJson(P.state, state);
          if (engine === "own") await speak({ text, emb: voice.emb, out: file, speed: settings.speed ?? 1.1, token: keys.hf });
          else await writeFile(file, await tts({ key: keys.el, voiceId: settings.voiceId, text, speed: settings.speed ?? 1.1, model: settings.model || "eleven_multilingual_v2", previous: texts[i - 1], next: texts[i + 1], expressive: true }));
          await ownFile(file);
        }
        entries.push({ name: `${ep.id}/beat-${i}.mp3`, data: await readFile(file) });
        beats++;
      }
      const stimme = engine === "own" ? "eigene Stimme (Kyutai Pocket TTS)" : `ElevenLabs: ${settings.voiceName || settings.voiceId}`;
      entries.push({ name: `${ep.id}/skript.json`, data: Buffer.from(JSON.stringify({ ...ep, gesprochen: texts, stimme }, null, 1)) });
      reels++;
    }
    const out = join(P.videos, "reel-stimmen.zip");
    await writeFile(`${out}.tmp`, zipStore(entries));
    await rename(`${out}.tmp`, out);
    await ownFile(out);
    delete state.voiceBlocked;
    state.reelStimmen = { status: "fertig", at: now(), file: "reel-stimmen.zip", reels, beats, took: Math.round((Date.now() - t0) / 1000) };
    await log("stimme", `Reel-Stimmen fertig: ${reels} Reels, ${beats} Abschnitte.`);
  } catch (err) {
    state.reelStimmen = { status: "fehler", at: now(), error: msg(err) };
    await log("fehler", `Reel-Stimmen: ${msg(err)}`);
  } finally {
    state.busy = null;
  }
}

// ---------- Video erstellen ----------
async function render(ep, settings, keys, state) {
  const e = (state.episodes[ep.id] ||= {});
  const wasPosted = e.status === "gepostet";   // erneut erstellt, aber nicht noch einmal posten
  Object.assign(e, { status: "rendert", error: null });
  state.busy = `Erstellt gerade: ${ep.title}`;
  await writeJson(P.state, state);
  try {
    let voiceDir = null, voiced = false;
    if (voiceUsable(settings, keys, state)) {
      state.busy = `Spricht gerade: ${ep.title}`; await writeJson(P.state, state);
      try { const v = await makeVoice(ep, settings, keys); voiceDir = v.dir; voiced = true; delete state.voiceBlocked; if (v.chars) await log("stimme", `Stimme aufgenommen: ${ep.title} (${v.chars} Zeichen)`); }
      catch (err) {
        state.voiceBlocked = { sig: voiceSig(settings), at: now(), error: msg(err) };
        await log("fehler", `Stimme für „${ep.title}“ fehlgeschlagen – Video ohne Stimme, nächster Versuch in 30 Minuten: ${msg(err)}`);
      }
      state.busy = `Erstellt gerade: ${ep.title}`; await writeJson(P.state, state);
    }
    const out = join(P.videos, `${ep.id}.mp4`), tmp = join(P.videos, `${ep.id}.tmp.mp4`), thumb = join(P.videos, `${ep.id}.jpg`);
    const opts = { out: tmp, voiceDir, figur: kitDir(P.figur), workers: +process.env.SHORTS_WORKERS || 1, log: () => {} };
    let r;
    try { r = await renderEpisode({ episode: ep, ...opts }); }
    catch (err) {
      // Der 3D-Stil braucht WebGL im Server-Chromium. Klappt das nicht, entsteht das Video im Cartoon-Stil statt gar nicht.
      if (ep.style !== "studio3d") throw err;
      await log("fehler", `3D-Video „${ep.title}“ fehlgeschlagen (${msg(err)}) – wird im Cartoon-Stil erstellt.`);
      r = await renderEpisode({ episode: { ...ep, style: "cartoon" }, ...opts });
    }
    await rename(tmp, out); await ownFile(out);
    execFileSync("ffmpeg", ["-y", "-v", "error", "-ss", String((r.duration * 0.55).toFixed(2)), "-i", out, "-frames:v", "1", "-vf", "scale=360:-1", "-q:v", "4", thumb]);
    await ownFile(thumb);
    Object.assign(e, { status: wasPosted ? "gepostet" : "bereit", video: `${ep.id}.mp4`, thumb: `${ep.id}.jpg`, duration: Math.round(r.duration * 10) / 10, voiced, voiceEngine: voiced ? engineOf(settings) : null, voiceSig: voiced ? voiceSig(settings) : "none", epHash: epHash(ep), renderedAt: now(), error: null });
    await log("video", `Video fertig: ${ep.title} (${voiced ? "mit Stimme" : "ohne Stimme"}, ${e.duration} s)`);
  } catch (err) {
    Object.assign(e, { status: "fehler", error: `Erstellen fehlgeschlagen: ${msg(err)}` });
    await log("fehler", `Video „${ep.title}“: ${msg(err)}`);
  } finally {
    state.busy = null;
  }
}

function needsRender(e, ep, settings, keys, state) {
  if (!e || !e.status) return true;
  if (["gepostet", "wird gepostet", "fehler"].includes(e.status)) return false;
  if (!e.video || !existsSync(join(P.videos, e.video))) return true;
  if (e.epHash !== epHash(ep)) return true;
  if (voiceUsable(settings, keys, state) && e.voiceSig !== voiceSig(settings)) return true;
  return false;
}

// ---------- Posten ----------
function youtubeDescription(ep, e = {}) {
  const link = `${SITE}${SLUG[ep.topic] || "/"}?utm_source=youtube&utm_medium=social&utm_campaign=shorts&utm_content=${ep.id}`;
  return [ep.youtube?.description || ep.title, "", `Kostenloser Rechtsschutz-Check: ${link}`, "",
    `Adrian Seitz – gebundener Versicherungsvertreter (§ 34d Abs. 7 GewO), Vertriebspartner der ARAG. Impressum: ${SITE}/impressum`,
    ...(e.voiced && e.voiceEngine === "own" ? ["", CREDIT] : [])].join("\n");
}

async function post(ep, settings, keys, state, why) {
  const e = (state.episodes[ep.id] ||= {});
  const platforms = (settings.platforms || PLATFORMS).filter((p) => PLATFORMS.includes(p));
  if (!platforms.length) { await log("fehler", "Keine Plattform ausgewählt – nichts gepostet."); return false; }
  const requestId = `${ep.id}-${Date.now()}`;
  Object.assign(e, { status: "wird gepostet", requestId, postStartedAt: now(), platforms: Object.fromEntries(platforms.map((p) => [p, { status: "queued" }])), error: null, why });
  await writeJson(P.state, state);
  try {
    await uploadVideo({ key: keys.up, user: settings.uploadUser, platforms, file: join(P.videos, e.video), ep, requestId, youtubeDescription: youtubeDescription(ep, e), aiLabel: settings.aiLabel !== false || (e.voiced && e.voiceEngine === "own"), promo: settings.promo !== false });
    await log("post", `Wird veröffentlicht: ${ep.title} (${platforms.join(", ")})`);
    return true;
  } catch (err) {
    Object.assign(e, { status: "fehler", error: `Posten fehlgeschlagen: ${msg(err)}` });
    await log("fehler", `Posten „${ep.title}“: ${msg(err)}`);
    return false;
  }
}

const FINAL = new Set(["completed", "failed", "skipped"]);
async function poll(id, e, keys) {
  if (!keys.up) return;
  let st;
  try { st = await uploadStatus({ key: keys.up, requestId: e.requestId }); } catch (err) { e.pollError = msg(err); return; }
  const results = Array.isArray(st.results) ? st.results : [];
  for (const r of results) {
    const s = r.skipped ? "skipped" : r.status || (r.success ? "completed" : r.success === false ? "failed" : "processing");
    const url = typeof r.post_url === "string" && /^https?:\/\//.test(r.post_url) ? r.post_url : null;
    e.platforms[r.platform] = { status: s, url, inbox: !!r.fallback_to_inbox, message: r.success === false || s === "failed" ? String(r.message || r.error || "").slice(0, 200) : undefined };
  }
  const states = Object.values(e.platforms || {}).map((p) => p.status);
  const allFinal = results.length > 0 && states.every((s) => FINAL.has(s));
  const age = Date.now() - Date.parse(e.postStartedAt || now());
  if (st.status === "completed" || allFinal) {
    const ok = states.some((s) => s === "completed");
    Object.assign(e, ok ? { status: "gepostet", postedAt: now() } : { status: "fehler", error: "Posten auf allen Plattformen fehlgeschlagen" });
    const failed = Object.entries(e.platforms).filter(([, p]) => p.status === "failed").map(([k]) => k);
    await log(ok ? "post" : "fehler", ok ? `Veröffentlicht: ${id}${failed.length ? ` (fehlgeschlagen: ${failed.join(", ")})` : ""}` : `Posten fehlgeschlagen: ${id}`);
  } else if (st.status === "failed" || st.status === "not_found" || age > 3 * 3600_000) {
    Object.assign(e, { status: "fehler", error: st.message ? `Posten fehlgeschlagen: ${String(st.message).slice(0, 200)}` : "Posten fehlgeschlagen (keine Rückmeldung)" });
    await log("fehler", `Posten fehlgeschlagen: ${id}`);
  }
}

// ---------- Hauptschleife ----------
let lastUsage = 0;
async function tick() {
  const settings = await readJson(P.settings, {});
  const keys = keysOf(settings);
  const state = await readJson(P.state, {});
  state.episodes ||= {};
  const lib = await loadLibrary(state.cycle || 0);
  const byId = new Map(lib.map((ep) => [ep.id, ep]));
  FIG_V = state.figur?.nutzbar && kitDir(P.figur) ? state.figur.version || 0 : 0;
  state.library = lib.map((ep) => ({ id: ep.id, order: ep.order, title: ep.title, topic: ep.topic, style: ep.style, caption: ep.caption, beats: ep.beats.length }));
  const disabled = new Set(settings.disabled || []);

  // 1) Aufträge aus dem CRM
  for (const job of await takeJobs()) {
    const ep = byId.get(job.id);
    if (job.type === "usage") { lastUsage = 0; continue; }
    if (job.type === "voicetest") { await voiceTest(settings, keys, state); await writeJson(P.state, state); continue; }
    if (job.type === "reelstimmen") { await reelVoices(settings, keys, state); await writeJson(P.state, state); continue; }
    if (job.type === "figur" && (job.id === "neu" || job.id === "weiter")) { await figur(job.id, settings, keys, state); await writeJson(P.state, state); continue; }
    if (job.type === "probe") { await probe(lib, settings, keys, state); await writeJson(P.state, state); continue; }
    if (!ep) continue;
    if (job.type === "render") { delete state.episodes[ep.id]?.error; await render(ep, settings, keys, state); }
    else if (job.type === "reset") { delete state.episodes[ep.id]; await log("info", `Wieder eingereiht: ${ep.title}`); }
    else if (job.type === "post") {
      if (!keys.up || !settings.uploadUser) { await log("fehler", "Posten nicht möglich: Upload-Post-Schlüssel oder Profilname fehlt."); continue; }
      const e = state.episodes[ep.id];
      if (!e || needsRender(e, ep, settings, keys, state) || e.status === "fehler" && !existsSync(join(P.videos, e.video || "-"))) await render(ep, settings, keys, state);
      if (state.episodes[ep.id]?.video) await post(ep, settings, keys, state, "manuell");
    }
    await writeJson(P.state, state);
  }

  // Figur: nach Ende des Tageskontingents (oder Netzfehler) von selbst weitermachen
  if (state.figur?.status === "wartet" && state.figur.weiterAb && Date.now() >= Date.parse(state.figur.weiterAb)) {
    await figur(state.figur.phase === "neu" ? "neu" : "weiter", settings, keys, state);
    await writeJson(P.state, state);
  }

  // 2) laufende Uploads
  for (const [id, e] of Object.entries(state.episodes)) if (e.status === "wird gepostet" && e.requestId) await poll(id, e, keys);

  // 3) Warteschlange + vorab erstellen (ein Video pro Durchlauf, damit Aufträge nicht lange warten)
  const open = () => lib.filter((ep) => !disabled.has(ep.id) && !["gepostet", "wird gepostet"].includes(state.episodes[ep.id]?.status));
  let queue = open();
  // Alles gepostet? Dann beginnt die Reihe von vorn (abschaltbar im CRM) – beim nächsten Durchlauf im anderen Stil
  const active = lib.filter((ep) => !disabled.has(ep.id));
  if (!queue.length && active.length && settings.repeat !== false && active.every((ep) => state.episodes[ep.id]?.status === "gepostet")) {
    state.cycle = (state.cycle || 0) + 1;
    for (const ep of active) { const e = state.episodes[ep.id]; state.episodes[ep.id] = { lastPostedAt: e.postedAt, timesPosted: (e.timesPosted || 0) + 1, lastPlatforms: e.platforms }; }
    await log("info", `Alle Videos sind gepostet – Runde ${state.cycle + 1} startet.`);
    state.heartbeat = now();
    await writeJson(P.state, state);
    return;   // nächster Durchlauf lädt die Themen im anderen Stil
  }
  state.queue = queue.map((ep) => ep.id);
  const ahead = Math.max(AHEAD, normTimes(settings).length * 2);
  for (const ep of queue.slice(0, ahead)) {
    if (needsRender(state.episodes[ep.id], ep, settings, keys, state)) { await render(ep, settings, keys, state); break; }
  }

  // 4) Termin fällig?
  if (settings.enabled) {
    const slot = dueSlot(settings, state.lastSlot);
    if (slot) {
      const next = queue.find((ep) => state.episodes[ep.id]?.status === "bereit");
      if (!keys.up || !settings.uploadUser) await log("fehler", "Termin verpasst: Upload-Post-Schlüssel oder Profilname fehlt.");
      else if (!next) await log("fehler", "Termin verpasst: kein fertiges Video in der Warteschlange.");
      else await post(next, settings, keys, state, `Termin ${slot}`);
      state.lastSlot = slot;
    }
  }
  state.nextSlot = settings.enabled ? nextSlotLabel(settings, state.lastSlot) : null;

  // 5) Verbrauch der Stimme (stündlich)
  if (engineOf(settings) === "elevenlabs" && keys.el && Date.now() - lastUsage > 3600_000) {
    lastUsage = Date.now();
    try { state.credits = { ...(await elevenlabsUsage(keys.el)), at: now() }; } catch (err) { state.credits = { error: msg(err), at: now() }; }
  }

  // Aufnahmen und Videos von Episoden, die es nicht mehr gibt (umbenannt, in die Reserve verschoben), aufräumen
  for (const d of await readdir(P.voice).catch(() => [])) if (![...byId.keys()].some((id) => d.startsWith(id + "-"))) await rm(join(P.voice, d), { recursive: true, force: true });
  for (const f of await readdir(P.videos).catch(() => [])) {
    if (/^(figur-|probe-|voice-test)/.test(f)) continue;   // Figur-Vorschauen, Probevideo und Hörprobe gehören keiner Episode
    const id = f.replace(/(\.tmp)?\.(mp4|jpg)$/, "");
    if (!byId.has(id) && state.episodes[id]?.status !== "gepostet") { await rm(join(P.videos, f), { force: true }); if (state.episodes[id]) delete state.episodes[id]; }
  }

  state.heartbeat = now();
  state.clock = berlin();
  state.worker = { site: SITE };
  await writeJson(P.state, state);
}

async function main() {
  await ensureDirs();
  // Ein Neustart mitten im Erstellen: diese Videos neu erstellen
  const st = await readJson(P.state, {});
  for (const e of Object.values(st.episodes || {})) if (e.status === "rendert") e.status = "";
  st.busy = null;
  await writeJson(P.state, st);
  await log("info", "Video-Automatik gestartet");
  let stop = false;
  for (const sig of ["SIGTERM", "SIGINT"]) process.on(sig, () => { stop = true; process.exit(0); });
  while (!stop) {
    const t0 = Date.now();
    try { await tick(); } catch (err) { await log("fehler", `Durchlauf: ${msg(err)}`); }
    await trimLog();
    await new Promise((r) => setTimeout(r, Math.max(5_000, TICK - (Date.now() - t0))));
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
export { tick, loadLibrary };
