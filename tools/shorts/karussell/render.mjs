// render.mjs: macht aus einem Bilder-Post (karussell/posts/*.json) die Einzelbilder fürs Instagram-Karussell
// (JPG, 1080 × 1350, Format 4:5) – gezeichnet in Chrome mit vorlage.html.
//
//   node karussell/render.mjs karussell/posts/k01-….json --out=out/k01          → out/k01--s1.jpg, --s2.jpg …
//   node karussell/render.mjs --alle --out=out/karussell --sheet                 alle Posts + je ein Übersichtsbild
//
// Als Modul: import { renderKarussell } from './karussell/render.mjs'
import puppeteer from "puppeteer-core";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { validateKarussell } from "./validate.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
export const POSTS = join(HERE, "posts");
const VORLAGE = pathToFileURL(join(HERE, "vorlage.html")).href;

function findChrome(p) {
  const c = [p, process.env.CHROME_PATH, "/usr/bin/chromium", "/usr/bin/chromium-browser", "/opt/google/chrome/chrome", "/usr/bin/google-chrome"].find((x) => x && existsSync(x));
  if (!c) throw new Error("Chrome/Chromium nicht gefunden (CHROME_PATH)");
  return c;
}

/**
 * Alle Folien eines Posts als JPG speichern.
 * @param {{ post: object, dir: string, name?: string, chrome?: string }} o  name = Dateianfang (Standard: post.id)
 * @returns {Promise<{ files: string[], warnings: string[] }>}  files = Dateinamen (ohne Ordner) in Reihenfolge
 */
export async function renderKarussell({ post, dir, name = post.id, chrome }) {
  mkdirSync(dir, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: findChrome(chrome), headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--allow-file-access-from-files", "--font-render-hinting=none", "--hide-scrollbars"],
  });
  const files = [], warnings = [];
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 1350, deviceScaleFactor: 1 });
    await page.goto(VORLAGE, { waitUntil: "load" });
    for (let i = 0; i < post.slides.length; i++) {
      const r = await page.evaluate((p, n) => window.zeige(p, n), post, i);
      await page.evaluate(() => Promise.all([...document.images].map((im) => (im.complete ? 0 : new Promise((ok) => { im.onload = im.onerror = ok; })))));
      if (r.overflow) warnings.push(`Folie ${i + 1}: Text passt nicht ganz aufs Bild`);
      else if (r.zoom < 0.85) warnings.push(`Folie ${i + 1}: Text stark verkleinert (${Math.round(r.zoom * 100)} %)`);
      const f = `${name}--s${i + 1}.jpg`;
      await page.screenshot({ path: join(dir, f), type: "jpeg", quality: 92, clip: { x: 0, y: 0, width: 1080, height: 1350 } });
      files.push(f);
    }
  } finally {
    await browser.close();
  }
  return { files, warnings };
}

/** Übersichtsbild: alle Folien nebeneinander (zum Ansehen) */
export function sheet(dir, files, out) {
  const cols = Math.min(files.length, 4), rows = Math.ceil(files.length / cols);
  const inputs = files.flatMap((f) => ["-i", join(dir, f)]);
  const layout = files.map((_, i) => `${(i % cols) * 360 + (i % cols) * 12}_${Math.floor(i / cols) * 462}`).join("|");
  const scaled = files.map((_, i) => `[${i}:v]scale=360:450,pad=360:462:0:0:white[v${i}]`).join(";");
  execFileSync("ffmpeg", ["-y", "-v", "error", ...inputs, "-filter_complex", `${scaled};${files.map((_, i) => `[v${i}]`).join("")}xstack=inputs=${files.length}:layout=${layout}:fill=white`, "-frames:v", "1", "-q:v", "3", out]);
  void rows;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  const opt = Object.fromEntries(args.filter((a) => a.startsWith("--")).map((a) => { const [k, v] = a.slice(2).split("="); return [k, v ?? true]; }));
  const list = opt.alle ? readdirSync(POSTS).filter((f) => f.endsWith(".json")).sort().map((f) => join(POSTS, f)) : args.filter((a) => !a.startsWith("--"));
  const out = resolve(opt.out || "out/karussell");
  for (const file of list) {
    const post = JSON.parse(readFileSync(file, "utf8"));
    const errors = validateKarussell(post, file.split("/").pop().replace(/\.json$/, ""));
    if (errors.length) { console.log(`✗ ${post.id}: ${errors.join("; ")}`); continue; }
    const { files, warnings } = await renderKarussell({ post, dir: out, chrome: opt.chrome });
    if (opt.sheet) sheet(out, files, join(out, `${post.id}--uebersicht.jpg`));
    console.log(`✓ ${post.id}: ${files.length} Bilder${warnings.length ? ` – ${warnings.join("; ")}` : ""}`);
  }
}
