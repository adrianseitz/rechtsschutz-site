// validate.mjs: prüft einen Bilder-Post, bevor er erstellt und gepostet wird. Was hier durchfällt, geht nicht online.
//   node karussell/validate.mjs        alle Dateien in karussell/posts/ prüfen
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { BANNED } from "../lib/validate.mjs";

export const SLIDE_TYPES = ["cover", "chat", "brief", "zahl", "text", "liste", "vergleich", "loesung", "achtung", "cta", "mythos"];
const SUPERLATIV = /\b(die einzige[n]?|der einzige|einzigartig|unschlagbar|nr\.?\s?1)\b/i;

/** @returns {string[]} Liste der Fehler (leer = in Ordnung) */
export function validateKarussell(p, fileId = null) {
  const err = [];
  const str = (v, min, max) => typeof v === "string" && v.trim().length >= min && v.length <= max;
  const arr = (v) => Array.isArray(v) && v.length > 0;
  if (!/^[a-z0-9][a-z0-9-]{0,60}$/.test(p.id || "")) err.push("id ungültig");
  if (fileId && p.id !== fileId) err.push("id passt nicht zum Dateinamen");
  if (!["vermieter", "firma", "privat", "arbeit", "verkehr", "allgemein"].includes(p.topic)) err.push("topic ungültig");
  if (!str(p.title, 5, 120)) err.push("title fehlt");
  if (!str(p.caption, 40, 2200)) err.push("caption fehlt oder zu lang");
  if (!str(p.fine, 40, 420) || !p.fine.includes("§ 34d")) err.push("fine (Pflichtangaben mit § 34d) fehlt");
  const s = Array.isArray(p.slides) ? p.slides : [];
  if (s.length < 3 || s.length > 10) err.push("3 bis 10 Folien nötig (Instagram erlaubt höchstens 10)");
  if (s[0]?.type !== "cover") err.push("erste Folie muss cover sein");
  if (s[s.length - 1]?.type !== "cta") err.push("letzte Folie muss cta sein");
  s.forEach((x, i) => {
    const n = `Folie ${i + 1}`;
    if (!SLIDE_TYPES.includes(x.type)) return err.push(`${n}: unbekannter Typ „${x.type}“`);
    if (["cover", "text", "liste", "achtung", "cta"].includes(x.type) && !(arr(x.title) || str(x.title, 2, 200))) err.push(`${n}: title fehlt`);
    if (x.type === "zahl" && !str(x.big, 1, 20)) err.push(`${n}: big fehlt`);
    if (x.type === "liste" && !(arr(x.items) && x.items.length <= 5)) err.push(`${n}: 1 bis 5 items nötig`);
    if (x.type === "mythos" && !(str(x.myth, 5, 220) && str(x.fact, 5, 260))) err.push(`${n}: myth und fact nötig`);
    if (x.type === "chat" && !arr(x.messages)) err.push(`${n}: messages fehlen`);
    if (x.type === "brief" && !(str(x.subject, 3, 120) && arr(x.body))) err.push(`${n}: subject und body nötig`);
    if (x.type === "vergleich" && !(x.left?.rows?.length && x.right?.rows?.length && x.left.total && x.right.total)) err.push(`${n}: left/right mit rows und total nötig`);
    if (x.type === "loesung") {
      if (!arr(x.product)) err.push(`${n}: product fehlt`);
      if (!/je nach tarif/i.test(JSON.stringify(x)) && !JSON.stringify(x).includes("*")) err.push(`${n}: Lösung ohne „je nach Tarif“ oder Sternchen`);
    }
  });
  const all = JSON.stringify([p.title, p.caption, s]);
  if (/rechtsschutz|mietausfall|soforthilfe/i.test(JSON.stringify(s.filter((x) => x.type === "loesung"))) && !/je nach tarif/i.test(p.caption)) err.push("caption ohne „je nach Tarif“");
  if (p.topic === "vermieter" && !/wartezeit/i.test(all)) err.push("Vermieter-Post ohne Hinweis auf die Wartezeit");
  const m = all.match(BANNED) || all.match(SUPERLATIV);
  if (m) err.push(`unzulässige Werbeaussage: „${m[0]}“`);
  return err;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const dir = join(dirname(fileURLToPath(import.meta.url)), "posts");
  let bad = 0;
  for (const f of readdirSync(dir).filter((x) => x.endsWith(".json")).sort()) {
    const e = validateKarussell(JSON.parse(readFileSync(join(dir, f), "utf8")), f.replace(/\.json$/, ""));
    if (e.length) { bad++; console.log(`✗ ${f}: ${e.join("; ")}`); } else console.log(`✓ ${f}`);
  }
  console.log(bad ? `${bad} Post(s) mit Fehlern` : "Alle Bilder-Posts in Ordnung");
  process.exit(bad ? 1 : 0);
}
