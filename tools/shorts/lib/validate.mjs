// validate.mjs: prüft eine Episode, bevor sie erstellt und gepostet wird. Was hier durchfällt, geht nicht online.
//   node lib/validate.mjs            alle Dateien in episodes/ prüfen
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const TYPES = ["hook", "cost", "fact", "list", "solution", "warning", "cta", "letter", "versus"];
const ONLY_3D = ["letter", "versus"];   // diese Abschnitte gibt es nur im 3D-Stil
// Werbeaussagen, die in der Versicherungsvermittlung nichts verloren haben
export const BANNED = /\b(garantiert|garantie|100\s?%|immer versichert|zahlt immer|alles versichert|ohne wartezeit|sofort versichert|beste[rn]? (rechtsschutz|versicherung)|günstigste|testsieger)\b/i;

/** @returns {string[]} Liste der Fehler (leer = in Ordnung) */
export function validateEpisode(ep, fileId = null) {
  const err = [];
  const str = (v, min, max) => typeof v === "string" && v.trim().length >= min && v.length <= max;
  if (!/^[a-z0-9][a-z0-9-]{0,80}$/.test(ep.id || "")) err.push("id ungültig");
  if (fileId && ep.id !== fileId) err.push("id passt nicht zum Dateinamen");
  if (!["whiteboard", "cartoon", "studio3d"].includes(ep.style)) err.push("style muss studio3d, whiteboard oder cartoon sein");
  if (!str(ep.title, 5, 120)) err.push("title fehlt");
  if (!str(ep.caption, 40, 2200)) err.push("caption fehlt oder zu lang");
  if (!str(ep.youtube?.title, 5, 100)) err.push("youtube.title fehlt oder länger als 100 Zeichen");
  if (!str(ep.fine, 40, 420) || !ep.fine.includes("§ 34d")) err.push("fine (Pflichtangaben mit § 34d) fehlt");
  const beats = Array.isArray(ep.beats) ? ep.beats : [];
  if (beats.length < 3 || beats.length > 7) err.push("3 bis 7 Abschnitte nötig");
  if (!["hook", "letter"].includes(beats[0]?.type)) err.push("erster Abschnitt muss hook oder letter sein");
  if (beats[beats.length - 1]?.type !== "cta") err.push("letzter Abschnitt muss cta sein");
  beats.forEach((b, i) => {
    if (!TYPES.includes(b.type)) err.push(`Abschnitt ${i + 1}: unbekannter Typ`);
    if (!str(b.say, 8, 280)) err.push(`Abschnitt ${i + 1}: Sprechertext fehlt oder zu lang`);
    if (b.type === "hook" && !(Array.isArray(b.lines) && b.lines.length)) err.push("hook ohne lines");
    if (b.type === "solution" && !/je nach tarif/i.test(b.say || "")) err.push("Lösung ohne „je nach Tarif“ im Sprechertext");
    if (b.type === "solution" && !JSON.stringify(b).includes("*")) err.push("Lösung ohne Sternchen-Hinweis");
    if (b.type === "list" && !(Array.isArray(b.items) && b.items.length >= 2 && b.items.length <= 4)) err.push("list braucht 2 bis 4 Punkte");
    if (b.type === "cta" && !(Array.isArray(b.question) && b.question.length)) err.push("cta ohne question");
    if (ONLY_3D.includes(b.type) && ep.style !== "studio3d") err.push(`Abschnitt ${i + 1}: ${b.type} gibt es nur mit style studio3d`);
    if (b.type === "letter" && !(Array.isArray(b.pov) && b.pov.length && typeof b.subject === "string" && b.subject)) err.push("letter braucht pov und subject");
    if (b.type === "versus") {
      const ok = (d) => d && typeof d.label === "string" && Array.isArray(d.rows) && d.rows.length >= 2 && d.rows.length <= 4 && typeof d.total === "string";
      if (!(Array.isArray(b.title) && b.title.length && ok(b.left) && ok(b.right))) err.push("versus braucht title sowie left und right mit label, 2 bis 4 rows und total");
      else if (!JSON.stringify(b.right).includes("*")) err.push("versus: rechte Spalte ohne Sternchen-Hinweis");
    }
  });
  const all = JSON.stringify([ep.title, ep.caption, ep.youtube, beats]);
  const m = all.match(BANNED);
  if (m) err.push(`unzulässige Werbeaussage: „${m[0]}“`);
  return err;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "episodes");
  let bad = 0;
  for (const f of readdirSync(dir).filter((x) => x.endsWith(".json")).sort()) {
    const e = validateEpisode(JSON.parse(readFileSync(join(dir, f), "utf8")), f.replace(/\.json$/, ""));
    if (e.length) { bad++; console.log(`✗ ${f}: ${e.join("; ")}`); }
  }
  console.log(bad ? `${bad} Episode(n) mit Fehlern` : "Alle Episoden in Ordnung");
  process.exit(bad ? 1 : 0);
}
