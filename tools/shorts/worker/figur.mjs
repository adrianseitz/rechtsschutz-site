// figur.mjs: erstellt die Moderator-Figur aus Adrians Foto mit dem Bildmodell FLUX.2 über Cloudflare Workers AI.
// Kostenlos im Rahmen des Tageskontingents (10.000 „Neurons“, reicht für etwa 6 Bilder pro Tag). Ist es aufgebraucht,
// wartet der Worker bis kurz nach Mitternacht (UTC) und macht von selbst weiter.
//
// Ablauf:  „neu“    Foto → Grundbild (Adrian sieht es im CRM und gibt es frei oder lässt ein neues erzeugen)
//          „weiter“ Grundbild → Mund halb/offen, Augen zu → Figur vorbereiten (ab hier nutzbar) → fünf Gesten → fertig
// Dateien: data/social/figur/foto.*   hochgeladenes Foto (nur auf dem Server)
//          data/social/figur/raw/     erzeugte Rohbilder (grüner Hintergrund)
//          data/social/figur/kit/     freigestellt und ausgerichtet (figur/vorbereiten.py), das nutzt der Video-Player
//          data/social/videos/figur-*.jpg  Vorschaubilder fürs CRM
import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const API = process.env.CLOUDFLARE_API || "https://api.cloudflare.com/client/v4";
export const MODEL = process.env.FIGUR_MODEL || "@cf/black-forest-labs/flux-2-klein-9b";
export const SPRECHEN = ["mund-halb", "mund-offen", "augen-zu"];
export const GESTEN = ["zeigt", "daumen", "erschrocken", "nachdenklich", "winkt"];
const SEED = 4711;   // gleicher Zufallswert für alle Bilder: hilft, dass die Varianten zum Grundbild passen

const BASIS = "Create a high-quality 3D animated avatar of the man in the reference photo, in the style of modern 3D emoji avatars and Pixar-style animated films: " +
  "smooth stylized skin, slightly enlarged head, large expressive brown eyes, friendly and trustworthy. Keep his likeness: exactly his hairstyle " +
  "(dark brown, swept back, short on the sides), his eyebrows and his short chin beard. He wears a dark navy suit jacket and a crisp white shirt with an open collar, no tie. " +
  "Head-and-shoulders portrait, facing and looking straight into the camera, mouth closed, relaxed shoulders. Soft even studio lighting. " +
  "Plain flat solid chroma-key green background (#00B140), no shadow, no floor, no text, no border. Centered, a clear gap above the hair, " +
  "the head in the upper third of the image, the shoulders reaching the bottom edge.";
const SAME = "The reference image shows a 3D avatar on a green background. Reproduce it exactly: same character, same face, same hair and beard, same clothes, " +
  "same pose, same camera distance and framing, same lighting, same plain green background. The only change: ";
const POSE = "The reference image shows a 3D avatar on a green background. Show the same character with the same face, hair, beard, clothes, rendering style, " +
  "lighting and plain green background, the head at the same size and position, mouth closed, ";
export const PROMPTS = {
  "mund-halb": SAME + "his mouth is slightly open, as if he is in the middle of speaking, teeth slightly visible. Everything else stays identical.",
  "mund-offen": SAME + "his mouth is wide open, as when saying \"ah\", teeth and tongue visible. Everything else stays identical.",
  "augen-zu": SAME + "his eyes are fully closed, as in a blink, with relaxed eyelids. Everything else stays identical.",
  zeigt: POSE + "pointing with one hand to the side, towards the left edge of the image.",
  daumen: POSE + "giving a thumbs up with one hand and smiling broadly.",
  erschrocken: POSE + "looking shocked, both hands on his cheeks, eyebrows raised.",
  nachdenklich: POSE + "looking thoughtful, one hand on his chin.",
  winkt: POSE + "waving friendly with one raised hand.",
};
const LABEL = { basis: "Grundbild", "mund-halb": "Mund leicht offen", "mund-offen": "Mund weit offen", "augen-zu": "Augen zu", zeigt: "Geste: zeigt", daumen: "Geste: Daumen hoch", erschrocken: "Geste: erschrocken", nachdenklich: "Geste: nachdenklich", winkt: "Geste: winkt" };

export class FigurError extends Error {
  constructor(text, code = "fehler") { super(text); this.code = code; }
}

function run(cmd, args, { cwd, timeout = 10 * 60_000 } = {}) {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, { cwd, timeout, maxBuffer: 16 << 20 }, (err, stdout, stderr) => {
      if (err) { err.message = `${err.message}\n${String(stderr || "").slice(-600)}`; reject(err); } else resolve(String(stdout));
    });
  });
}

/** Ein Bild bei Cloudflare erzeugen (FLUX.2, Referenzbild als input_image_0) */
async function flux({ account, token, prompt, ref }) {
  const form = new FormData();
  form.append("prompt", prompt);
  form.append("input_image_0", new Blob([ref], { type: "image/png" }), "referenz.png");
  form.append("width", "1024");
  form.append("height", "1024");
  form.append("seed", String(SEED));
  let res;
  try {
    res = await fetch(`${API}/accounts/${account}/ai/run/${MODEL}`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: form, signal: AbortSignal.timeout(240_000) });
  } catch (err) {
    throw new FigurError(`Cloudflare nicht erreichbar (${err.name === "TimeoutError" ? "Zeitüberschreitung" : err.message}). Nächster Versuch in einer Stunde.`, "netz");
  }
  const type = res.headers.get("content-type") || "";
  if (res.ok && type.startsWith("image/")) return Buffer.from(await res.arrayBuffer());
  const j = await res.json().catch(() => null);
  const img = j?.result?.image ?? j?.image;
  if (res.ok && typeof img === "string") return Buffer.from(img.replace(/^data:image\/\w+;base64,/, ""), "base64");
  const text = (j?.errors || []).map((e) => `${e.code ?? ""} ${e.message ?? ""}`.trim()).join("; ") || `HTTP ${res.status}`;
  if (res.status === 429 || /neuron|daily|free allocation|quota|rate limit|4006/i.test(text))
    throw new FigurError("Das kostenlose Tageskontingent bei Cloudflare ist aufgebraucht. Die Figur wird nach Mitternacht automatisch weiter erstellt.", "kontingent");
  if (res.status === 401 || res.status === 403 || /auth|token|permission|10000/i.test(text))
    throw new FigurError("Cloudflare lehnt den Zugang ab: Account-ID und API-Token prüfen (der Token braucht die Berechtigung „Workers AI“).", "zugang");
  if (/nsfw|safety|flagged|moderation/i.test(text)) throw new FigurError("Der Bilddienst hat das Bild abgelehnt. Bitte ein anderes Foto (Brustbild, neutraler Hintergrund) hochladen.", "foto");
  throw new FigurError(`Bilddienst: ${text.slice(0, 220)}`);
}

/** Bild als PNG unter 512 × 512 (Grenze für Referenzbilder), quadratisch; bei Hochformat den oberen Teil (Gesicht) */
async function referenz(src, out) {
  await run("ffmpeg", ["-y", "-v", "error", "-i", src, "-frames:v", "1",
    "-vf", "crop='min(iw,ih)':'min(iw,ih)':'(iw-min(iw,ih))/2':'(ih-min(iw,ih))/4',scale=504:504:flags=lanczos", out], { timeout: 60_000 });
  return readFile(out);
}

async function vorschau(png, jpg) {
  await run("ffmpeg", ["-y", "-v", "error", "-i", png, "-vf", "scale=480:-1", "-q:v", "4", jpg], { timeout: 60_000 });
}

/** Rohbilder → Figuren-Satz (Python, figur/vorbereiten.py) */
async function vorbereiten(dir, videos) {
  const out = join(dir, "kit.neu"), prev = join(videos, "figur-vorschau.jpg");
  await rm(out, { recursive: true, force: true });
  const stdout = await run("python3", [join(HERE, "..", "figur", "vorbereiten.py"), join(dir, "raw"), "--out", out, "--vorschau", prev], { timeout: 10 * 60_000 });
  await rm(join(dir, "kit"), { recursive: true, force: true });
  await rename(out, join(dir, "kit"));
  let info = {};
  try { info = JSON.parse(stdout); } catch { /* nur Hinweise fehlen */ }
  return info;
}

const nextMidnightUtc = () => { const d = new Date(); d.setUTCHours(24, 5, 0, 0); return d.toISOString(); };

/**
 * Einen Schritt der Figur abarbeiten.
 * @param {"neu"|"weiter"} phase
 * @param {{ dir: string, videos: string, account: string, token: string, state: object, save: () => Promise<void>, log: (k: string, t: string) => Promise<void>, own: (f: string) => Promise<void>, foto: string|null }} c
 */
export async function figurSchritt(phase, c) {
  const f = (c.state.figur ||= {});
  const raw = join(c.dir, "raw");
  const set = async (patch) => { Object.assign(f, patch, { at: new Date().toISOString() }); await c.save(); };
  try {
    if (!c.account || !c.token) throw new FigurError("Erst Cloudflare-Account-ID und API-Token im CRM speichern.", "zugang");
    await mkdir(raw, { recursive: true });

    if (phase === "neu") {
      if (!c.foto || !existsSync(c.foto)) throw new FigurError("Erst ein Foto im CRM hochladen.", "foto");
      await rm(raw, { recursive: true, force: true }); await mkdir(raw, { recursive: true });
      await set({ status: "läuft", phase, schritt: LABEL.basis, fertig: [], error: null, hinweise: [], weiterAb: null });
      const ref = await referenz(c.foto, join(c.dir, "foto-ref.png"));
      const png = await flux({ account: c.account, token: c.token, prompt: BASIS, ref });
      await writeFile(join(raw, "basis.png"), png); await c.own(join(raw, "basis.png"));
      await vorschau(join(raw, "basis.png"), join(c.videos, "figur-basis.jpg")); await c.own(join(c.videos, "figur-basis.jpg"));
      await set({ status: "auswahl", schritt: null, fertig: ["basis"], version: Date.now() });
      await c.log("figur", "Grundbild deiner Figur ist fertig – bitte im CRM ansehen und freigeben.");
      return;
    }

    // „weiter“: Varianten und Gesten zum freigegebenen Grundbild
    if (!existsSync(join(raw, "basis.png"))) throw new FigurError("Es gibt noch kein Grundbild. Bitte „Figur erstellen“ neu starten.", "foto");
    const ref = await referenz(join(raw, "basis.png"), join(c.dir, "basis-ref.png"));
    const todo = [...SPRECHEN, ...GESTEN];
    for (const name of ["basis", ...todo]) {   // fehlende Vorschaubilder nachholen
      const pv = join(c.videos, `figur-${name}.jpg`);
      if (existsSync(join(raw, `${name}.png`)) && !existsSync(pv)) { await vorschau(join(raw, `${name}.png`), pv); await c.own(pv); }
    }
    for (const name of todo) {
      const file = join(raw, `${name}.png`);
      if (!existsSync(file)) {
        await set({ status: "läuft", phase, schritt: LABEL[name], error: null, weiterAb: null });
        const png = await flux({ account: c.account, token: c.token, prompt: PROMPTS[name], ref });
        await writeFile(file, png); await c.own(file);
        await vorschau(file, join(c.videos, `figur-${name}.jpg`)); await c.own(join(c.videos, `figur-${name}.jpg`));
        f.fertig = [...new Set([...(f.fertig || []), name])];
      }
      // sobald Grundbild + Sprech-Varianten da sind, ist die Figur nutzbar
      if (name === SPRECHEN[SPRECHEN.length - 1] || name === GESTEN[GESTEN.length - 1]) {
        await set({ schritt: "Figur wird freigestellt und ausgerichtet" });
        const info = await vorbereiten(c.dir, c.videos);
        await c.own(join(c.videos, "figur-vorschau.jpg"));
        await set({ hinweise: info.hinweise || [], nutzbar: true, version: Date.now() });
      }
    }
    await set({ status: "fertig", schritt: null });
    await c.log("figur", "Deine Figur ist fertig. Mit „Probevideo erstellen“ siehst du sie im Video.");
  } catch (err) {
    const e = err instanceof FigurError ? err : new FigurError(String(err.message || err).split("\n")[0]);
    if (e.code === "kontingent") await set({ status: "wartet", phase, weiterAb: nextMidnightUtc(), error: e.message });
    else if (e.code === "netz") await set({ status: "wartet", phase, weiterAb: new Date(Date.now() + 3600_000).toISOString(), error: e.message });
    else await set({ status: "fehler", phase, error: e.message });
    await c.log(e.code === "kontingent" ? "figur" : "fehler", `Figur: ${e.message}`);
  }
}

/** Ordner mit fertigem Figuren-Satz (für den Video-Player) oder null */
export const kitDir = (dir) => (existsSync(join(dir, "kit", "kit.json")) ? join(dir, "kit") : null);
