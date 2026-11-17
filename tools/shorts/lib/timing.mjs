// timing.mjs: Länge jedes Abschnitts (beat) aus der Sprachaufnahme – oder, solange es keine gibt, geschätzt aus dem Text.
// Die Bilder passen sich der Stimme an, nicht umgekehrt: Jeder Abschnitt dauert so lange, wie gesprochen wird,
// plus etwas Vorlauf und Luft für den Übergang.

const MIN = { hook: 3.5, cost: 5.2, fact: 4.6, list: 5.0, solution: 5.8, warning: 4.4, cta: 5.2, letter: 5.4, versus: 7.2 };
const LEAD = 0.25;   // Stimme setzt kurz nach dem Schnitt ein
const TAIL = 0.4;   // Luft nach dem letzten Wort (der Wisch-Übergang beginnt schon während des letzten Worts)
const END = 1.6;     // am Schluss bleibt das Abschlussbild stehen

/** Geschätzte Sprechdauer in Sekunden (deutsche KI-Stimme, Tempo 1,1). */
export function estimateSpeech(text) {
  const s = String(text || "").trim();
  if (!s) return 0;
  const pauses = (s.match(/[.,;:!?–]/g) || []).length;
  return s.length / 16.5 + pauses * 0.1;
}

/**
 * @param ep Episode (episodes/*.json)
 * @param voice optional: Sprechdauer je Abschnitt in Sekunden (gleiche Reihenfolge wie ep.beats)
 * @returns {{ total: number, beats: { start: number, dur: number, voiceAt: number, speech: number }[] }}
 */
export function planTiming(ep, voice = null) {
  const beats = [];
  let t = 0;
  ep.beats.forEach((b, i) => {
    const speech = voice && voice[i] != null ? voice[i] : estimateSpeech(b.say);
    const last = i === ep.beats.length - 1;
    const lead = i === 0 ? 0.15 : LEAD;
    const min = (MIN[b.type] || 5) + (b.type === 'hook' ? (b.items?.length || 0) * 0.25 + (b.icon ? 0.3 : 0) : 0);   // mehr zu zeichnen = etwas mehr Zeit
    const dur = Math.max(min, lead + speech + (last ? END : TAIL));
    beats.push({ start: round(t), dur: round(dur), voiceAt: round(t + lead), speech: round(speech) });
    t += dur;
  });
  return { total: round(t), beats };
}

const round = (x) => Math.round(x * 1000) / 1000;
