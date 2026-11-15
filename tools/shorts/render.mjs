// Rendert die Szene Bild für Bild (deterministisch) und baut daraus ein MP4 mit Tonspur.
// Aufruf: node render.mjs <html> <ausgabe.mp4> [--stills 1,4.5,9]
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

const [html, out] = process.argv.slice(2);
const stillsArg = process.argv.indexOf("--stills");
const FPS = 30;
const b = await chromium.launch({ executablePath: "/opt/google/chrome/chrome", args: ["--no-sandbox", "--force-color-profile=srgb"] });
const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
await p.goto("file://" + path.resolve(html));
await p.waitForFunction(() => window.READY === true);
await p.waitForTimeout(300);

if (stillsArg > 0) {
  const times = process.argv[stillsArg + 1].split(",").map(Number);
  for (const t of times) {
    await p.evaluate((tt) => window.render(tt), t);
    await p.screenshot({ path: `${out}-${String(t).replace(".", "_")}.png` });
  }
  await b.close();
  process.exit(0);
}

const dur = await p.evaluate(() => window.DURATION);
const frames = Math.round(dur * FPS);
const dir = out + ".frames";
rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true });
const t0 = Date.now();
for (let i = 0; i < frames; i++) {
  await p.evaluate((tt) => window.render(tt), i / FPS);
  await p.screenshot({ path: `${dir}/${String(i).padStart(5, "0")}.jpg`, type: "jpeg", quality: 94 });
  if (i % 150 === 0) console.log(`Bild ${i}/${frames} (${Math.round((Date.now() - t0) / 1000)} s)`);
}
const sfx = await p.evaluate(() => window.SFX);
writeFileSync(out + ".sfx.json", JSON.stringify({ duration: dur, sfx }));
await b.close();

// Tonspur erzeugen (Musik + Geräusche), dann zusammenfügen
execFileSync("python3", [path.join(path.dirname(new URL(import.meta.url).pathname), "audio.py"), out + ".sfx.json", out + ".wav"], { stdio: "inherit" });
execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-framerate", String(FPS), "-i", `${dir}/%05d.jpg`, "-i", out + ".wav",
  "-c:v", "libx264", "-preset", "medium", "-crf", "19", "-pix_fmt", "yuv420p", "-profile:v", "high", "-movflags", "+faststart",
  "-af", "loudnorm=I=-14:TP=-1.5:LRA=11", "-c:a", "aac", "-b:a", "192k", "-ar", "44100", "-shortest", out], { stdio: "inherit" });
rmSync(dir, { recursive: true, force: true });
console.log("fertig:", out, `${Math.round((Date.now() - t0) / 1000)} s`);
