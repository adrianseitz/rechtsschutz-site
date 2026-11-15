// brand.js: Seitz Rechtsschutz – Schild-Maskottchen im Whiteboard-Stil, Farben und Einblendungen (Pflichtangaben).
// Das Maskottchen wird wie alles andere mit dem Marker gezeichnet (Striche → drawOn), danach per Versatz animiert.

const BRAND = { sun: '#FFD60A', ink: '#0B0B0A', name: 'Seitz', name2: 'Rechtsschutz' };
window.EXTRA_FONTS = [['800 40px "Geist"', 'Seitz Rechtsschutz'], ['italic 40px "SerifI"', 'Rechtsschutz'], ['500 30px "Geist"', 'je nach Tarif §']];

// Schild-Figur, gebaut um (0,0) in Einheiten von ±50 (≈ 100 hoch), dann mit place() skaliert.
// face: 'happy' | 'proud' | 'worried' | 'sad' | 'wow'   arms: 'wave' | 'up' | 'down' | 'cheer'
function shieldGuy(cx, cy, size = 400, o = {}) {
  const u = size / 100, face = o.face || 'happy', arms = o.arms || 'down', k = o.key || 'sg';
  const P = (pts) => pts.map(([x, y]) => [x, y]);
  const body = [[0, -50], [20, -43], [40, -42], [40, 0], [32, 26], [0, 49], [-32, 26], [-40, 0], [-40, -42], [-20, -43]];
  const out = [];
  // Arme und Beine zuerst (liegen hinter dem Körper)
  const armR = { wave: [[39, -6], [56, -20], [60, -40]], up: [[39, -8], [52, -30], [54, -56]], down: [[39, 4], [52, 16], [56, 30]], cheer: [[39, -10], [58, -24], [66, -46]] }[arms];
  const armL = arms === 'cheer' ? [[-39, -10], [-58, -24], [-66, -46]] : [[-39, 4], [-52, 16], [-56, 30]];
  out.push(S.path(P(armL), { key: k + 'aL' }), S.path(P(armR), { key: k + 'aR' + arms }));
  for (const [hx, hy, kk] of [[armL[2][0], armL[2][1], 'hL'], [armR[2][0], armR[2][1], 'hR' + arms]]) {
    out.push(S.circle(hx, hy, 6.5, 6.5, { key: k + kk, w: WB.w * .9 }), S.fill(polyCircle(hx, hy, 6, 6, 20), { col: '#FFFFFF', alpha: 1, mode: 'cover', z: -2 }));
  }
  out.push(S.path([[-14, 44], [-16, 62]], { key: k + 'lL' }), S.path([[14, 44], [16, 62]], { key: k + 'lR' }));
  out.push(S.fill(polyCircle(-21, 64, 10, 4.5, 24), { col: INK.black, alpha: 1, mode: 'cover', z: 1 }), S.fill(polyCircle(21, 64, 10, 4.5, 24), { col: INK.black, alpha: 1, mode: 'cover', z: 1 }));
  // Körper (Schild): deckende Füllung verdeckt die Arm-Ansätze, dann Umriss
  out.push(S.fill(catmull(body, true), { col: BRAND.sun, alpha: 1, mode: 'cover', z: -1, cost: 90 }));
  out.push(S.path(body, { closed: true, sharp: [0, 2, 5, 8], key: k + 'body' }));
  out.push(S.path([[-29, -33], [-29, 0], [-21, 20]], { key: k + 'shine', col: '#FFFFFF', w: WB.w * .9, z: 1 }));
  // Gesicht
  const eyeY = -14;
  for (const s of [-1, 1]) {
    out.push(S.circle(s * 14, eyeY, 8.5, 10, { key: k + 'e' + s, w: WB.w * .85, turns: 1 }), S.fill(polyCircle(s * 14, eyeY, 8, 9.5, 24), { col: '#FFFFFF', alpha: 1, mode: 'cover', z: 0 }));
    const look = face === 'worried' ? [-2, 2] : face === 'wow' ? [0, -1] : [2, 1];
    out.push(S.dot(s * 14 + look[0] * 1.5, eyeY + look[1] * 1.5, WB.w * .55, { col: INK.black, z: 2 }));
    out.push(S.fill(polyCircle(s * 27, 6, 5.5, 4, 20), { col: '#FF8FA3', alpha: .55, z: 1 }));
  }
  const brows = {
    worried: [[[-21, -30], [-8, -26]], [[21, -30], [8, -26]]],
    sad: [[[-21, -27], [-8, -30]], [[21, -27], [8, -30]]],
    happy: [[[-21, -29], [-8, -31]], [[21, -29], [8, -31]]],
    proud: [[[-21, -31], [-8, -29]], [[21, -31], [8, -29]]],
    wow: [[[-21, -33], [-8, -35]], [[21, -33], [8, -35]]],
  }[face];
  brows.forEach((b, i) => out.push(S.path(b, { key: k + 'b' + face + i, w: WB.w * .85, z: 2 })));
  const mouth = {
    happy: [[-12, 6], [0, 15], [12, 6]],
    proud: [[-13, 5], [0, 13], [13, 3]],
    worried: [[-10, 12], [-4, 9], [4, 12], [10, 9]],
    sad: [[-11, 14], [0, 8], [11, 14]],
    wow: null,
  }[face];
  if (mouth) out.push(S.path(mouth, { key: k + 'm' + face, z: 2 }));
  else out.push(S.circle(0, 10, 6, 7.5, { key: k + 'mo', z: 2, turns: 1 }), S.fill(polyCircle(0, 10, 5.5, 7, 20), { col: INK.red, alpha: .85, z: 1 }));
  return place(out, cx, cy, o.rot || 0, u);
}

// Einblendungen in Bildschirm-Koordinaten (scharf, nicht handgezeichnet): Pflichtangaben + Markenzeile.
const OVERLAYS = [];   // { a, b, kind: 'fine' | 'brand', y }
function overlay(list) { OVERLAYS.push(...list); }
const FINE = '* je nach Tarif. Mietausfallschutz als Zusatzbaustein in ausgewählten Tarifen; Leerstand und bestehende Rückstände sind nicht versichert. Adrian Seitz, gebundener Versicherungsvertreter (§ 34d Abs. 7 GewO), Vertriebspartner der ARAG.';
function _wrap(c, txt, maxW) { const words = txt.split(' '), lines = []; let cur = ''; for (const w of words) { const t = cur ? cur + ' ' + w : w; if (c.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; } if (cur) lines.push(cur); return lines; }
window.overlayHook = (c, t) => {
  for (const o of OVERLAYS) {
    if (t < o.a || t > o.b) continue;
    const k = Math.min(1, (t - o.a) / .35) * Math.min(1, (o.b - t) / .25);
    c.save(); c.globalAlpha = Math.max(0, k);
    if (o.kind === 'fine') {
      c.font = '500 25px "Geist", sans-serif'; c.fillStyle = 'rgba(35,38,43,.62)'; c.textBaseline = 'top';
      _wrap(c, FINE, W - 200).forEach((l, i) => c.fillText(l, 80, (o.y || 1610) + i * 34));
    } else if (o.kind === 'brand') {
      const y = o.y || 1450, x = 80, s = 82;
      c.fillStyle = BRAND.ink; c.beginPath(); c.roundRect(x, y, s, s, 22); c.fill();
      c.save(); c.translate(x + s / 2, y + s / 2); c.fillStyle = BRAND.sun; c.beginPath();
      c.moveTo(0, -27); c.bezierCurveTo(12, -21, 21, -21, 25, -21); c.lineTo(25, 1); c.bezierCurveTo(25, 15, 13, 24, 0, 29); c.bezierCurveTo(-13, 24, -25, 15, -25, 1); c.lineTo(-25, -21); c.bezierCurveTo(-21, -21, -12, -21, 0, -27); c.fill();
      c.strokeStyle = BRAND.ink; c.lineWidth = 6; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); c.moveTo(-11, 1); c.lineTo(-3, 9); c.lineTo(12, -8); c.stroke(); c.restore();
      c.fillStyle = BRAND.ink; c.textBaseline = 'middle'; c.font = '800 56px "Geist", sans-serif'; c.fillText('Seitz', x + s + 22, y + s / 2 + 2);
      const w1 = c.measureText('Seitz ').width; c.font = 'italic 60px "SerifI", serif'; c.fillText('Rechtsschutz', x + s + 22 + w1, y + s / 2 + 2);
    }
    c.restore();
  }
};
