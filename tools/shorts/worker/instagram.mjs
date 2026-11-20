// instagram.mjs: Reels direkt über die offizielle Instagram-Schnittstelle veröffentlichen – ohne Zusatzdienst.
// „Instagram API mit Instagram-Login“ (graph.instagram.com): Business- oder Creator-Konto + eigene, kostenlose Meta-App.
// Ablauf: Video kurz unter einer zufälligen, nicht erratbaren Adresse bereitstellen → Instagram holt es ab
//         → Container ist fertig verarbeitet → veröffentlichen → Link zum Beitrag. Danach wird die Kopie gelöscht.
import { randomBytes } from "node:crypto";
import { copyFile, mkdir, readdir, rm, stat } from "node:fs/promises";
import { join } from "node:path";

const IG = process.env.INSTAGRAM_API || "https://graph.instagram.com/v23.0";
const REFRESH = process.env.INSTAGRAM_REFRESH || "https://graph.instagram.com/refresh_access_token";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function call(url, { method = "GET", params = {}, token }) {
  const u = new URL(url);
  const body = new URLSearchParams({ ...params, access_token: token });
  const res = method === "GET"
    ? await fetch(`${u}${u.search ? "&" : "?"}${body}`, { signal: AbortSignal.timeout(60_000) })
    : await fetch(u, { method, body, signal: AbortSignal.timeout(120_000) });
  const j = await res.json().catch(() => ({}));
  if (!res.ok || j.error) {
    const e = j.error || {};
    const hint = e.code === 190 ? " – der Instagram-Zugang ist abgelaufen oder ungültig, bitte im CRM neu eintragen" : "";
    throw new Error(`Instagram ${res.status}: ${e.error_user_msg || e.message || "Fehler"}${hint}`);
  }
  return j;
}

/** Wer ist verbunden? → { id, username } */
export async function igMe(token) {
  const j = await call(`${IG}/me`, { params: { fields: "user_id,username" }, token });
  return { id: String(j.user_id || j.id), username: j.username || "" };
}

/** Zugang verlängern (gilt 60 Tage, verlängerbar ab 24 Stunden Alter) → { token, expiresIn } */
export async function igRefresh(token) {
  const j = await call(REFRESH, { params: { grant_type: "ig_refresh_token" }, token });
  return { token: j.access_token, expiresIn: j.expires_in };
}

/** Kurzzeit-Kopien, die Instagram nicht abgeholt hat, nach 6 Stunden löschen */
export async function cleanPublic(dir) {
  for (const f of await readdir(dir).catch(() => [])) {
    const s = await stat(join(dir, f)).catch(() => null);
    if (s && Date.now() - s.mtimeMs > 6 * 3600_000) await rm(join(dir, f), { force: true });
  }
}

/**
 * Reel veröffentlichen.
 * @param {{ token: string, file: string, caption: string, site: string, publicDir: string, onStep?: (t: string) => Promise<void> }} o
 * @returns {Promise<{ id: string, url: string | null, username: string }>}
 */
export async function igPublishReel({ token, file, caption, site, publicDir, onStep = async () => {} }) {
  const me = await igMe(token);
  const name = `${randomBytes(16).toString("hex")}.mp4`;
  const copy = join(publicDir, name);
  await mkdir(publicDir, { recursive: true });
  await copyFile(file, copy);
  try {
    await onStep("Instagram holt das Video ab");
    const c = await call(`${IG}/${me.id}/media`, {
      method: "POST", token,
      params: { media_type: "REELS", video_url: `${site}/api/social/clip/${name}`, caption: caption.slice(0, 2200), share_to_feed: "true" },
    });
    // Instagram verarbeitet das Video (meist unter einer Minute); höchstens 10 Minuten warten
    let status = "";
    for (let i = 0; i < 60; i++) {
      await sleep(10_000);
      const s = await call(`${IG}/${c.id}`, { params: { fields: "status_code,status" }, token });
      status = s.status_code;
      if (status === "FINISHED") break;
      if (status === "ERROR" || status === "EXPIRED") throw new Error(`Instagram konnte das Video nicht verarbeiten (${s.status || status}). Häufig: falsches Format – nötig ist MP4 (H.264, AAC), 3 Sekunden bis 15 Minuten, Hochformat.`);
    }
    if (status !== "FINISHED") throw new Error("Instagram hat das Video nach 10 Minuten noch nicht verarbeitet – es wird beim nächsten Termin erneut versucht.");
    await onStep("Wird auf Instagram veröffentlicht");
    const p = await call(`${IG}/${me.id}/media_publish`, { method: "POST", params: { creation_id: c.id }, token });
    let url = null;
    try { url = (await call(`${IG}/${p.id}`, { params: { fields: "permalink" }, token })).permalink || null; } catch { /* Link ist nur Komfort */ }
    return { id: String(p.id), url, username: me.username };
  } finally {
    await rm(copy, { force: true });
  }
}

/** Warten, bis Instagram einen Container verarbeitet hat (Bilder: meist sofort) */
async function waitReady(id, token, what, tries = 30) {
  for (let i = 0; i < tries; i++) {
    const s = await call(`${IG}/${id}`, { params: { fields: "status_code,status" }, token });
    if (s.status_code === "FINISHED") return;
    if (s.status_code === "ERROR" || s.status_code === "EXPIRED") throw new Error(`Instagram konnte ${what} nicht verarbeiten (${s.status || s.status_code}). Nötig ist JPG, Seitenverhältnis zwischen 4:5 und 1,91:1.`);
    await sleep(5_000);
  }
  throw new Error(`Instagram hat ${what} nach ${Math.round(tries * 5 / 60)} Minuten noch nicht verarbeitet – es wird beim nächsten Termin erneut versucht.`);
}

/**
 * Bilder-Post (Karussell mit 2–10 Bildern) veröffentlichen.
 * Ablauf: jedes Bild kurz unter einer Zufallsadresse bereitstellen → je Bild ein Container (is_carousel_item)
 *         → Karussell-Container mit allen Bildern und Text → veröffentlichen. Danach werden die Kopien gelöscht.
 * @param {{ token: string, files: string[], caption: string, site: string, publicDir: string, onStep?: (t: string) => Promise<void> }} o
 * @returns {Promise<{ id: string, url: string | null, username: string }>}
 */
export async function igPublishCarousel({ token, files, caption, site, publicDir, onStep = async () => {} }) {
  if (files.length < 2 || files.length > 10) throw new Error(`Ein Karussell braucht 2 bis 10 Bilder (hier: ${files.length}).`);
  const me = await igMe(token);
  await mkdir(publicDir, { recursive: true });
  const copies = [];
  try {
    for (const f of files) {
      const name = `${randomBytes(16).toString("hex")}.jpg`;
      await copyFile(f, join(publicDir, name));
      copies.push(name);
    }
    const children = [];
    for (const [i, name] of copies.entries()) {
      await onStep(`Instagram holt Bild ${i + 1} von ${copies.length} ab`);
      const c = await call(`${IG}/${me.id}/media`, { method: "POST", token, params: { image_url: `${site}/api/social/clip/${name}`, is_carousel_item: "true" } });
      await waitReady(c.id, token, `Bild ${i + 1}`, 12);
      children.push(c.id);
    }
    await onStep("Instagram setzt das Karussell zusammen");
    const k = await call(`${IG}/${me.id}/media`, { method: "POST", token, params: { media_type: "CAROUSEL", children: children.join(","), caption: caption.slice(0, 2200) } });
    await waitReady(k.id, token, "das Karussell");
    await onStep("Wird auf Instagram veröffentlicht");
    const p = await call(`${IG}/${me.id}/media_publish`, { method: "POST", params: { creation_id: k.id }, token });
    let url = null;
    try { url = (await call(`${IG}/${p.id}`, { params: { fields: "permalink" }, token })).permalink || null; } catch { /* Link ist nur Komfort */ }
    return { id: String(p.id), url, username: me.username };
  } finally {
    for (const name of copies) await rm(join(publicDir, name), { force: true });
  }
}
