// sprechtext.mjs: bereitet einen Sprechertext für die eigene Stimme (Pocket TTS) vor.
// Das deutsche Modell liest nur Wörter sicher – Zahlen, Zeichen und Abkürzungen werden hier ausgeschrieben:
//   "Bei 950 € fehlen dir 5.700 Euro (30 %), § 548 BGB, z. B. bis 18:30 Uhr."
//   → "Bei neunhundertfünfzig Euro fehlen dir fünftausendsiebenhundert Euro, dreißig Prozent, Paragraf fünfhundertachtundvierzig BGB, zum Beispiel bis achtzehn Uhr dreißig."

const EINS = ["null", "eins", "zwei", "drei", "vier", "fünf", "sechs", "sieben", "acht", "neun", "zehn", "elf", "zwölf",
  "dreizehn", "vierzehn", "fünfzehn", "sechzehn", "siebzehn", "achtzehn", "neunzehn"];
const ZEHNER = ["", "", "zwanzig", "dreißig", "vierzig", "fünfzig", "sechzig", "siebzig", "achtzig", "neunzig"];

function unter100(n) {
  if (n < 20) return EINS[n];
  const e = n % 10, z = ZEHNER[Math.floor(n / 10)];
  return e ? `${e === 1 ? "ein" : EINS[e]}und${z}` : z;
}
function unter1000(n) {
  const h = Math.floor(n / 100), r = n % 100;
  return (h ? `${h === 1 ? "ein" : EINS[h]}hundert` : "") + (r ? unter100(r) : "");
}
// als Faktor vor „tausend“: „einhunderteintausend“, nicht „…einstausend“
const faktor = (n) => unter1000(n).replace(/eins$/, "ein");

/** Ganze Zahl (0 bis 999.999.999) in Worten */
export function zahlwort(n) {
  if (!Number.isInteger(n) || n < 0 || n > 999_999_999) return String(n);
  if (n === 0) return "null";
  const mio = Math.floor(n / 1_000_000), tsd = Math.floor((n % 1_000_000) / 1000), rest = n % 1000;
  const teile = [];
  if (mio) teile.push(mio === 1 ? "eine Million" : `${faktor(mio)} Millionen`);
  const klein = (tsd ? `${faktor(tsd)}tausend` : "") + (rest ? unter1000(rest) : "");
  if (klein) teile.push(klein);
  return teile.join(" ");
}

/** „1,5“ → „eins Komma fünf“, „2,50 €“ wird vorher eigens behandelt */
function dezimal(ganz, nachkomma) {
  return `${zahlwort(ganz)} Komma ${[...nachkomma].map((d) => EINS[+d]).join(" ")}`;
}

const ABK = [
  [/\bz\.\s?B\./g, "zum Beispiel"], [/\bd\.\s?h\./g, "das heißt"], [/\bu\.\s?a\./g, "unter anderem"], [/\bu\.\s?U\./g, "unter Umständen"],
  [/\bggf\./g, "gegebenenfalls"], [/\bbzw\./g, "beziehungsweise"], [/\binkl\./g, "inklusive"], [/\bzzgl\./g, "zuzüglich"],
  [/\bca\./g, "circa"], [/\busw\./g, "und so weiter"], [/\betc\./g, "et cetera"], [/\bvgl\./g, "vergleiche"],
  [/\bAbs\./g, "Absatz"], [/\bNr\./g, "Nummer"], [/\bS\.\s(?=\d)/g, "Seite "], [/\bMio\./g, "Millionen"], [/\bMrd\./g, "Milliarden"],
  [/\bTsd\./g, "tausend"], [/\bStd\./g, "Stunden"], [/\bMin\./g, "Minuten"], [/\bmtl\./g, "monatlich"], [/\bjährl\./g, "jährlich"],
  [/\bEUR\b/g, "Euro"], [/\bGmbH\b/g, "G m b H"], [/\bUG\b/g, "U G"],
];

/** Sprechertext → Text, den das Modell sauber vorliest */
export function sprechtext(input) {
  let s = String(input ?? "")
    .replace(/[[\]{}*]/g, "")                         // Markierungen aus den Folien-Texten
    .replace(/\s+/g, " ").trim();
  for (const [re, w] of ABK) s = s.replace(re, w);
  s = s
    .replace(/§§\s*/g, "Paragrafen ").replace(/§\s*/g, "Paragraf ")
    .replace(/(\d)\s*%/g, "$1 Prozent").replace(/%/g, " Prozent")
    .replace(/\b([01]?\d|2[0-3]):([0-5]\d)\s*Uhr\b/g, (_, h, m) => `${zahlwort(+h)} Uhr${+m ? ` ${zahlwort(+m)}` : ""}`)   // „18:30 Uhr“ → „achtzehn Uhr dreißig“
    // Beträge mit Cent: „2,50 €“ → „zwei Euro fünfzig“
    .replace(/(\d{1,3}(?:\.\d{3})+|\d+),(\d{2})\s*(?:€|Euro\b)/g, (_, e, c) => `${zahlwort(+e.replace(/\./g, ""))} Euro${+c ? ` ${zahlwort(+c)}` : ""}`)
    .replace(/€/g, " Euro")
    // Tausenderpunkte: „5.700“ → 5700 (aber keine Datumsangaben wie 1.12.)
    .replace(/\b\d{1,3}(?:\.\d{3})+\b(?!\.\d)/g, (m) => m.replace(/\./g, ""))
    .replace(/\b(\d+),(\d+)\b/g, (_, g, n) => dezimal(+g, n))
    .replace(/\b\d+\b/g, (m) => (m.length > 9 ? [...m].map((d) => EINS[+d]).join(" ") : zahlwort(+m)))
    .replace(/\s*&\s*/g, " und ").replace(/\s\+\s/g, " plus ").replace(/(\S)\/(\S)/g, "$1 oder $2")
    .replace(/\s*\(\s*/g, ", ").replace(/\s*\)\s*/g, ", ")
    .replace(/\s+([,.!?])/g, "$1").replace(/,\s*([.!?])/g, "$1").replace(/,{2,}/g, ",")
    .replace(/\s+/g, " ").trim();
  if (s && !/[.!?]$/.test(s)) s += ".";
  return s;
}
