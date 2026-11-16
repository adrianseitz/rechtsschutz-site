// talk.js: Mundbewegung des Erklär-Männchens.
// Mit Sprachaufnahme: aus deren Lautstärke (window.EP_MOUTH, vom Renderer berechnet).
// Ohne Aufnahme (Vorschau): aus dem Text geschätzt – Vokale offen, Konsonanten halb, Pausen zu.
window.TALK = (() => {
  const EP = window.EP, TM = window.EP_TIMING, M = window.EP_MOUTH || null;
  function beatAt(t) { let i = 0; while (i + 1 < TM.beats.length && t >= TM.beats[i + 1].start) i++; return i; }
  function raw(t) {
    const i = beatAt(t), b = TM.beats[i], lt = t - b.voiceAt;
    if (lt < 0 || lt > b.speech) return 0;
    if (M && M.beats && M.beats[i]) { const env = M.beats[i]; const v = env[Math.floor(lt * M.fps)] || 0; return Math.min(1, Math.max(0, (v - 0.12) / 0.75)); }
    const s = EP.beats[i].say || '', pos = Math.floor((lt / b.speech) * s.length), ch = (s[pos] || ' ').toLowerCase();
    if (/[aeiouäöüy]/.test(ch)) return 0.55 + 0.4 * Math.abs(Math.sin(t * 21));
    if (/[\s.,;:!?–-]/.test(ch)) return 0;
    return 0.22;
  }
  // leicht geglättet, damit der Mund nicht flackert
  const open = (t) => (raw(t - 0.033) + 2 * raw(t) + raw(t + 0.033)) / 4;
  const talking = (t) => { const i = beatAt(t), b = TM.beats[i], lt = t - b.voiceAt; return lt >= 0 && lt <= b.speech; };
  return { open, talking, beatAt };
})();
