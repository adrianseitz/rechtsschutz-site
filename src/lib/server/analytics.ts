import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { serverConfig } from "./config";
import { emptyDay, PAGE_LABEL, type StatsData } from "../stats";

/**
 * Reichweitenmessung ohne Cookies:
 * - Es wird nichts auf dem Gerät der Besucher gespeichert.
 * - IP-Adressen werden nicht gespeichert. Für die Zählung eindeutiger Besucher pro Tag wird
 *   ein Hash aus IP, Browserkennung und einem täglich neuen Zufallswert gebildet. Der Zufallswert
 *   und die Hashes liegen nur im Arbeitsspeicher und werden täglich verworfen.
 * - Auf die Festplatte kommen nur Summen pro Tag (Aufrufe, Besucher, Seiten, Quellen, Gerätetyp).
 */
const file = () => path.join(serverConfig.storageDir, "stats.json");
const KEEP_DAYS = 730;

const BOT = /bot|crawl|spider|slurp|preview|monitor|headless|lighthouse|pingdom|uptime|curl|wget|python|java\/|go-http|axios|node-fetch|facebookexternalhit|whatsapp|telegram/i;

export const dayKey = (d = new Date()) => d.toLocaleDateString("sv-SE", { timeZone: "Europe/Berlin" });

let salt = { day: "", value: Buffer.alloc(0), seen: new Set<string>() };
function seenToday(ip: string, ua: string): boolean {
  const day = dayKey();
  if (salt.day !== day) salt = { day, value: randomBytes(32), seen: new Set() };
  const h = createHash("sha256").update(salt.value).update(ip).update("|").update(ua).digest("base64url").slice(0, 22);
  if (salt.seen.has(h)) return true;
  salt.seen.add(h);
  return false;
}

export const isBot = (ua: string) => !ua || BOT.test(ua);

/** Nur bekannte Seiten zählen – verhindert, dass beliebige Pfade die Statistik füllen. */
export function normalizePath(p: string): string | null {
  const clean = (p.split(/[?#]/)[0] || "/").replace(/\/+$/, "") || "/";
  return clean in PAGE_LABEL ? clean : null;
}

const HOSTS: [RegExp, string][] = [
  [/(^|\.)google\./, "Google (Suche)"],
  [/(^|\.)bing\.com$/, "Bing"],
  [/(^|\.)duckduckgo\.com$/, "DuckDuckGo"],
  [/(^|\.)ecosia\.org$/, "Ecosia"],
  [/(^|\.)(facebook\.com|fb\.com|m\.facebook\.com|l\.facebook\.com|lm\.facebook\.com)$/, "Facebook"],
  [/(^|\.)instagram\.com$/, "Instagram"],
  [/(^|\.)linkedin\.com$|^lnkd\.in$/, "LinkedIn"],
  [/(^|\.)tiktok\.com$/, "TikTok"],
  [/(^|\.)youtube\.com$/, "YouTube"],
  [/^t\.co$|(^|\.)x\.com$|(^|\.)twitter\.com$/, "X / Twitter"],
];

export function classifySource(opts: { ref?: string; utm?: string; medium?: string; gclid?: boolean; fbclid?: boolean; ownHost: string }): string {
  if (opts.gclid) return "Google Ads";
  if (opts.fbclid) return "Meta Ads (Facebook/Instagram)";
  const utm = (opts.utm || "").toLowerCase().slice(0, 40);
  if (utm) {
    const paid = /cpc|paid|ads|ppc/.test((opts.medium || "").toLowerCase());
    if (/google/.test(utm)) return paid ? "Google Ads" : "Google";
    if (/facebook|fb|instagram|ig|meta/.test(utm)) return paid ? "Meta Ads (Facebook/Instagram)" : utm.includes("insta") || utm === "ig" ? "Instagram" : "Facebook";
    return `Kampagne: ${utm.replace(/[^a-z0-9._-]/g, "")}`;
  }
  let host = "";
  try {
    host = opts.ref ? new URL(opts.ref).hostname.toLowerCase().replace(/^www\./, "") : "";
  } catch {
    host = "";
  }
  if (!host || host === opts.ownHost.replace(/^www\./, "")) return "Direkt / Lesezeichen";
  for (const [re, name] of HOSTS) if (re.test(host)) return name;
  return host.slice(0, 60);
}

export async function readStats(): Promise<StatsData> {
  try {
    return JSON.parse(await readFile(file(), "utf8"));
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return {};
    throw e;
  }
}

/* Zählungen werden im Speicher gesammelt und alle paar Sekunden gebündelt geschrieben. */
type Hit = { day: string; page: string; source: string | null; device: string; newVisitor: boolean };
let pending: Hit[] = [];
let timer: NodeJS.Timeout | null = null;
let writing: Promise<void> = Promise.resolve();

async function flush() {
  timer = null;
  const hits = pending;
  pending = [];
  if (!hits.length) return;
  writing = writing.then(async () => {
    const all = await readStats();
    for (const h of hits) {
      const d = (all[h.day] ??= emptyDay());
      d.views++;
      d.pages[h.page] = (d.pages[h.page] ?? 0) + 1;
      if (h.newVisitor) {
        d.visitors++;
        if (h.source) d.sources[h.source] = (d.sources[h.source] ?? 0) + 1;
        d.devices[h.device] = (d.devices[h.device] ?? 0) + 1;
      }
    }
    const cutoff = dayKey(new Date(Date.now() - KEEP_DAYS * 86400000));
    for (const k of Object.keys(all)) if (k < cutoff) delete all[k];
    await mkdir(serverConfig.storageDir, { recursive: true, mode: 0o700 });
    const tmp = `${file()}.${process.pid}.tmp`;
    await writeFile(tmp, JSON.stringify(all), { encoding: "utf8", mode: 0o600 });
    await rename(tmp, file());
  }).catch((e) => console.error("[stats] Schreiben fehlgeschlagen:", e instanceof Error ? e.message : e));
  await writing;
}

export function recordHit(input: { ip: string; ua: string; page: string; source: string; mobile: boolean }) {
  const newVisitor = !seenToday(input.ip, input.ua);
  pending.push({ day: dayKey(), page: input.page, source: newVisitor ? input.source : null, device: input.mobile ? "Handy" : "Computer", newVisitor });
  if (pending.length > 500) void flush();
  else if (!timer) timer = setTimeout(() => void flush(), 5000);
}

/** Für Tests/Abfragen: noch nicht geschriebene Zählungen sofort speichern. */
export const flushStats = () => flush();
