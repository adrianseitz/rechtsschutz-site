// render.mjs: macht aus einer Episode (episodes/*.json) ein fertiges Hochformat-Video – Bild für Bild in Chrome
// gerendert (deterministisch), Tonspur aus Musik, Geräuschen und Stimme, am Ende auf -14 LUFS gebracht.
//
//   node render.mjs episodes/01-….json --out=out/01.mp4                 Video (Stimme optional: --voice=<ordner>)
//   node render.mjs episodes/01-….json --sheet --out=out/01.jpg         Kontrollbild: 15 Momente als Raster
//   Optionen: --voice=<ordner mit beat-0.mp3 …>  --chrome=<pfad>  --workers=2  --stills=1.5,7,12 (PNG-Einzelbilder)
//             --style=studio3d|cartoon|whiteboard (überschreibt den Stil aus der Episode)
//
// Als Modul: import { renderEpisode } from './render.mjs'
import puppeteer from "puppeteer-core";
import { spawn, execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync, mkdtempSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";
import { planTiming } from "./lib/timing.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const PLAYER = { whiteboard: join(HERE, "whiteboard/player.html"), cartoon: join(HERE, "cartoon/player.html"), studio3d: join(HERE, "studio3d/player.html") };
const FPS = { whiteboard: 24, cartoon: 30, studio3d: 25 };

function findChrome(p) {
  const list = [p, process.env.CHROME_PATH, "/usr/bin/chromium", "/usr/bin/chromium-browser", "/opt/google/chrome/chrome", "/usr/bin/google-chrome"];
  const c = list.find((x) => x && existsSync(x));
  if (!c) throw new Error("Chrome/Chromium nicht gefunden (--chrome=<pfad> oder CHROME_PATH)");
  return c;
}

function run(cmd, args, input) {
  return new Promise((ok, bad) => {
    const p = spawn(cmd, args, { stdio: [input ? "pipe" : "ignore", "ignore", "pipe"] });
    let err = "";
    p.stderr.on("data", (d) => (err += d));
    p.on("close", (c) => (c ? bad(new Error(`${cmd} ${c}: ${err.slice(-800)}`)) : ok()));
    if (input) input(p.stdin);
  });
}

/** Dauer einer Audiodatei in Sekunden */
export function audioDuration(file) {
  const out = execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", file]).toString();
  return parseFloat(out);
}

/** Sprachaufnahmen je Abschnitt (beat-0.mp3 …) einsammeln, falls vorhanden */
function voiceFiles(ep, dir) {
  if (!dir) return null;
  const files = ep.beats.map((_, i) => join(dir, `beat-${i}.mp3`));
  return files.every((f) => existsSync(f)) ? files : null;
}

/** Lautstärke-Verlauf einer Sprachaufnahme (0–1 je Videobild) – damit bewegt das Männchen den Mund */
export function mouthEnvelope(file, fps) {
  const raw = execFileSync("ffmpeg", ["-v", "error", "-i", file, "-ac", "1", "-ar", "8000", "-f", "s16le", "-"]);
  const s = new Int16Array(raw.buffer, raw.byteOffset, Math.floor(raw.length / 2)), win = Math.round(8000 / fps), env = [];
  for (let i = 0; i < s.length; i += win) {
    let sum = 0; const end = Math.min(s.length, i + win);
    for (let j = i; j < end; j++) sum += s[j] * s[j];
    env.push(Math.sqrt(sum / Math.max(1, end - i)) / 32768);
  }
  const top = [...env].sort((a, b) => a - b)[Math.floor(env.length * 0.95)] || 1;
  return env.map((v) => Math.round(Math.min(1, v / top) * 100) / 100);
}

async function openPlayer(browser, ep, timing, mouth = null) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });
  page.on("pageerror", (e) => console.log("[Seite]", e.message));
  page.on("console", (m) => { if (m.type() === "error") console.log("[Seite]", m.text()); });
  await page.evaluateOnNewDocument((e, t, m) => { window.EP = e; window.EP_TIMING = t; window.EP_MOUTH = m; }, ep, timing, mouth);
  await page.goto(pathToFileURL(PLAYER[ep.style]).href + "?render", { waitUntil: "load" });
  await page.waitForFunction("window.ready === true", { timeout: 60000 });
  return page;
}

async function frameJpeg(page, style, t) {
  if (style === "whiteboard") {
    const url = await page.evaluate((tt) => window.renderAt(tt, "image/jpeg", 0.93), t);
    return Buffer.from(url.slice(url.indexOf(",") + 1), "base64");
  }
  await page.evaluate((tt) => window.render(tt), t);
  return page.screenshot({ type: "jpeg", quality: 93 });
}

/**
 * @param {object} o { episode (Pfad oder Objekt), out, voiceDir?, chrome?, workers?, sheet?, stills?, log? }
 * @returns {{ out: string, duration: number, timing: object }}
 */
export async function renderEpisode(o) {
  const ep = typeof o.episode === "string" ? JSON.parse(readFileSync(o.episode, "utf8")) : o.episode;
  if (o.style) ep.style = o.style;
  if (!PLAYER[ep.style]) throw new Error(`Unbekannter Stil: ${ep.style}`);
  const log = o.log || console.log;
  const voices = voiceFiles(ep, o.voiceDir);
  const timing = planTiming(ep, voices ? voices.map(audioDuration) : null);
  const fps = FPS[ep.style], frames = Math.round(timing.total * fps);
  const mouth = voices ? { fps, beats: voices.map((f) => mouthEnvelope(f, fps)) } : null;
  mkdirSync(dirname(resolve(o.out)), { recursive: true });
  // eine Browser-Instanz je Arbeiter: Screenshots von Seiten im Hintergrund können sonst hängen bleiben
  const launch = () => puppeteer.launch({
    executablePath: findChrome(o.chrome), headless: true, protocolTimeout: 180_000,
    args: ["--no-sandbox", "--allow-file-access-from-files", "--force-color-profile=srgb", "--disable-renderer-backgrounding", "--disable-background-timer-throttling", "--disable-backgrounding-occluded-windows", "--font-render-hinting=none", "--disable-dev-shm-usage",
      // 3D-Stil: WebGL ohne Grafikkarte (Software-Renderer)
      ...(ep.style === "studio3d" ? ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] : [])],
  });
  const browsers = [];
  const browser = await launch(); browsers.push(browser);
  const tmp = mkdtempSync(join(tmpdir(), "short-"));
  try {
    // Kontrollbild oder Einzelbilder
    if (o.sheet || o.stills) {
      const page = await openPlayer(browser, ep, timing, mouth);
      const times = o.stills || Array.from({ length: 15 }, (_, i) => +(((i + 0.5) / 15) * timing.total).toFixed(2));
      const files = [];
      for (const [i, t] of times.entries()) { const f = join(tmp, `s${String(i).padStart(2, "0")}.jpg`); writeFileSync(f, await frameJpeg(page, ep.style, t)); files.push(f); }
      if (o.stills) { files.forEach((f, i) => execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", f, `${o.out}-${times[i]}.png`])); return { out: o.out, duration: timing.total, timing }; }
      await run("ffmpeg", ["-y", "-loglevel", "error", "-framerate", "1", "-i", join(tmp, "s%02d.jpg"), "-vf", "scale=360:-1,tile=5x3:padding=6:color=white", "-frames:v", "1", o.out]);
      return { out: o.out, duration: timing.total, timing };
    }

    // Video: mehrere Seiten rendern parallel, Bilder gehen der Reihe nach an ffmpeg
    const workers = Math.max(1, Math.min(4, o.workers || 2));
    const pages = [await openPlayer(browser, ep, timing, mouth)];
    for (let i = 1; i < workers; i++) { const b = await launch(); browsers.push(b); pages.push(await openPlayer(b, ep, timing, mouth)); }
    const sfx = await pages[0].evaluate(() => (window.collectSfx ? window.collectSfx() : window.SFX || []));
    const silent = join(tmp, "video.mp4"), t0 = Date.now();
    await run("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-c:v", "mjpeg", "-framerate", String(fps), "-i", "-",
      "-vf", "scale=out_range=tv", "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p", "-color_range", "tv", "-movflags", "+faststart", silent], async (stdin) => {
      const done = new Map(); let next = 0, issued = 0;
      const write = (buf) => new Promise((ok) => (stdin.write(buf) ? ok() : stdin.once("drain", ok)));
      async function worker(page) {
        while (issued < frames) {
          const i = issued++;
          done.set(i, await frameJpeg(page, ep.style, i / fps));
          while (done.has(next)) { const b = done.get(next); done.delete(next); next++; await write(b); if (next % 240 === 0) log(`Bild ${next}/${frames} (${Math.round((Date.now() - t0) / 1000)} s)`); }
        }
      }
      await Promise.all(pages.map(worker));
      stdin.end();
    });

    // Tonspur: Musik + Geräusche + Stimme
    const job = { duration: timing.total, sfx, seed: ep.id, voice: voices ? voices.map((f, i) => ({ time: timing.beats[i].voiceAt, file: f })) : [] };
    writeFileSync(join(tmp, "audio.json"), JSON.stringify(job));
    execFileSync("python3", [join(HERE, "audio.py"), join(tmp, "audio.json"), join(tmp, "audio.wav")], { stdio: "inherit" });
    await run("ffmpeg", ["-y", "-loglevel", "error", "-i", silent, "-i", join(tmp, "audio.wav"), "-map", "0:v", "-map", "1:a", "-c:v", "copy",
      "-af", "loudnorm=I=-14:TP=-1.5:LRA=11", "-c:a", "aac", "-b:a", "192k", "-ar", "44100", "-shortest", "-movflags", "+faststart", o.out]);
    log(`fertig: ${o.out} (${timing.total.toFixed(1)} s Video, ${Math.round((Date.now() - t0) / 1000)} s Rechenzeit)`);
    return { out: o.out, duration: timing.total, timing };
  } finally {
    await Promise.all(browsers.map((b) => b.close().catch(() => {})));
    rmSync(tmp, { recursive: true, force: true });
  }
}

// ---- Aufruf von der Kommandozeile ----
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = Object.fromEntries(process.argv.slice(3).map((a) => { const [k, v] = a.replace(/^--/, "").split("="); return [k, v ?? true]; }));
  const episode = process.argv[2];
  if (!episode) { console.error("Aufruf: node render.mjs <episode.json> --out=<datei> [--sheet] [--voice=<ordner>]"); process.exit(1); }
  const out = args.out || join(HERE, "out", episode.replace(/^.*\//, "").replace(/\.json$/, args.sheet ? ".jpg" : ".mp4"));
  renderEpisode({ episode, out, style: args.style, voiceDir: args.voice, chrome: args.chrome, workers: +args.workers || 2, sheet: !!args.sheet, stills: args.stills ? String(args.stills).split(",").map(Number) : null })
    .catch((e) => { console.error(e); process.exit(1); });
}
