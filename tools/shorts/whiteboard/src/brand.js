// brand.js: Seitz Rechtsschutz – Schild-Maskottchen im Whiteboard-Stil, Farben und Einblendungen (Pflichtangaben).
// Das Maskottchen wird wie alles andere mit dem Marker gezeichnet (Striche → drawOn), danach per Versatz animiert.

const BRAND = { sun: '#FFD60A', ink: '#0B0B0A', name: 'Seitz', name2: 'Rechtsschutz' };
WB.handScale = .68;   // im Hochformat sonst zu wuchtig
window.EXTRA_FONTS = [['800 40px "Geist"', 'Seitz Rechtsschutz'], ['italic 40px "SerifI"', 'Rechtsschutz'], ['500 30px "Geist"', 'je nach Tarif §']];
// alle Texte der Episode, damit die Handschrift vorab geladen ist
window.WB_TEXT = JSON.stringify(window.EP || {});

// Schild-Figur, gebaut um (0,0) in Einheiten von ±50 (≈ 100 hoch), dann mit place() skaliert.
// face: 'happy' | 'proud' | 'worried' | 'sad' | 'wow'   arms: 'wave' | 'up' | 'down' | 'cheer'
function shieldGuy(cx, cy, size = 400, o = {}) {
  const u = size / 100, face = o.face || 'happy', arms = o.arms || 'down', k = o.key || 'sg';
  const P = (pts) => pts.map(([x, y]) => [x, y]);
  const body = [[0, -50], [20, -43], [40, -42], [40, 0], [32, 26], [0, 49], [-32, 26], [-40, 0], [-40, -42], [-20, -43]];
  const out = [];
  // Arme und Beine zuerst (liegen hinter dem Körper)
  const ARMS = {   // [linker Arm, rechter Arm]
    down: [[[-39, 4], [-52, 16], [-56, 30]], [[39, 4], [52, 16], [56, 30]]],
    wave: [[[-39, 4], [-52, 16], [-56, 30]], [[39, -6], [56, -20], [60, -40]]],
    up: [[[-39, 4], [-52, 16], [-56, 30]], [[39, -8], [52, -30], [54, -56]]],
    cheer: [[[-39, -10], [-58, -24], [-66, -46]], [[39, -10], [58, -24], [66, -46]]],
    point: [[[-39, -6], [-60, -22], [-82, -40]], [[39, 4], [52, 16], [56, 30]]],      // zeigt nach links oben
    explain: [[[-39, 2], [-60, 2], [-72, -12]], [[39, 2], [60, 2], [72, -12]]],       // offene Hände
  };
  const [armL, armR] = ARMS[arms] || ARMS.down;
  out.push(S.path(P(armL), { key: k + 'aL' + arms }), S.path(P(armR), { key: k + 'aR' + arms }));
  for (const [hx, hy, kk] of [[armL[2][0], armL[2][1], 'hL' + arms], [armR[2][0], armR[2][1], 'hR' + arms]]) {
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
    const look = o.look || (face === 'worried' ? [-2, 2] : face === 'wow' ? [0, -1] : [2, 1]);
    out.push(S.dot(s * 14 + look[0] * 1.5, eyeY + look[1] * 1.5, WB.w * .55, { col: INK.black, z: 2 }));
    out.push(S.fill(polyCircle(s * 27, 6, 5.5, 4, 20), { col: '#FF8FA3', alpha: .55, z: 1 }));
  }
  const brows = {
    worried: [[[-21, -26], [-8, -32]], [[21, -26], [8, -32]]],   // innen hoch = besorgt (innen runter wäre böse)
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
  const talk = o.talk || 0;
  if (talk > .08) {   // sprechender Mund: Öffnung folgt der Stimme
    const ry = 2.5 + talk * 8, rx = 8 + talk * 2.5, q = Math.round(talk * 6);
    out.push(S.circle(0, 10, rx, ry, { key: k + 'mt' + q, z: 2, turns: 1 }), S.fill(polyCircle(0, 10, rx - .5, ry - .5, 20), { col: '#8E2A2A', alpha: .9, z: 1 }));
  } else if (mouth) out.push(S.path(mouth, { key: k + 'm' + face, z: 2 }));
  else if (!(talk > .08)) out.push(S.circle(0, 10, 6, 7.5, { key: k + 'mo', z: 2, turns: 1 }), S.fill(polyCircle(0, 10, 5.5, 7, 20), { col: INK.red, alpha: .85, z: 1 }));
  return place(out, cx, cy, o.rot || 0, u);
}

// Einblendungen in Bildschirm-Koordinaten (scharf, nicht handgezeichnet): Pflichtangaben + Markenzeile.
const OVERLAYS = [];   // { a, b, kind: 'fine' | 'brand', y }
function overlay(list) { OVERLAYS.push(...list); }
const FINE = (window.EP && window.EP.fine) || '* je nach Tarif und Versicherungsbedingungen; Wartezeiten und Ausschlüsse beachten. Adrian Seitz, gebundener Versicherungsvertreter (§ 34d Abs. 7 GewO), Vertriebspartner der ARAG.';
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

// ---------- weitere Symbole für die Rechtsschutz-Themen (Einheiten wie ICON: Größe 100 ≈ s) ----------
{
  const def = (name, fn) => { ICON[name] = (cx, cy, s = 140, o = {}) => place(fn(s / 100, o, o.key || keyOf(name, cx, cy)), cx, cy, o.rot || 0); };
  const L = (pts, k, o = {}) => _line(resample(pts, 5), { wob: .6, bow: 0, ...o }, k);
  const C = (pts, k, o = {}) => _line(catmull(pts), { wob: .6, bow: 0, ...o }, k);
  const U = (u, pts) => pts.map(([x, y]) => [x * u, y * u]);
  const rot = (pts, a, cx = 0, cy = 0) => pts.map(([x, y]) => [cx + x * Math.cos(a) - y * Math.sin(a), cy + x * Math.sin(a) + y * Math.cos(a)]);
  def('calendar', (u, o, k) => [S.rect(-50 * u, -40 * u, 100 * u, 92 * u, { key: k + 'r', r: 8 * u }), L(U(u, [[-50, -14], [50, -14]]), k + 'h'),
    L(U(u, [[-26, -54], [-26, -30]]), k + 'a'), L(U(u, [[26, -54], [26, -30]]), k + 'b'), S.fill(polyRect(-48 * u, -38 * u, 96 * u, 23 * u, 6 * u), { col: o.col || INK.red, alpha: .85 })]);
  def('bill', (u, o, k) => { const p = U(u, [[-38, -52], [38, -52], [38, 46], [26, 54], [14, 46], [2, 54], [-10, 46], [-22, 54], [-38, 46], [-38, -52]]);
    return [L(p, k + 'o'), ...[0, 1, 2].map(i => L(U(u, [[-24, -30 + i * 18], [20 - (i % 2) * 14, -30 + i * 18]]), k + 'l' + i, { w: WB.w * .6 })), L(U(u, [[-24, 28], [24, 28]]), k + 's'), S.fill(p, { col: o.col || '#FFF3B8', alpha: .9 })]; });
  ICON.letter = ICON.mail;
  def('contract', (u, o, k) => { const p = U(u, [[-38, -54], [24, -54], [40, -38], [40, 54], [-38, 54], [-38, -54]]);
    return [L(p, k + 'o'), ...[0, 1, 2, 3].map(i => L(U(u, [[-24, -32 + i * 16], [26 - (i % 2) * 16, -32 + i * 16]]), k + 'l' + i, { w: WB.w * .6 })), S.wave(-26 * u, 36 * u, 18 * u, 32 * u, 6 * u, 3, { key: k + 'sig', col: INK.blue }), S.fill(p, { col: o.col || '#FFFFFF', alpha: .9 })]; });
  def('gavel', (u, o, k) => { const a = -.62, head = rot(U(u, [[-34, -14], [34, -14], [34, 14], [-34, 14], [-34, -14]]), a, -8 * u, -20 * u), stick = rot(U(u, [[0, 14], [0, 74]]), a, -8 * u, -20 * u);
    return [L(head, k + 'h'), L(stick, k + 's', { w: WB.w * 1.4 }), S.rect(-14 * u, 40 * u, 68 * u, 14 * u, { key: k + 'b' }), S.fill(head, { col: o.col || '#D9A066', alpha: .9 }), S.fill(polyRect(-14 * u, 40 * u, 68 * u, 14 * u), { col: '#D9A066', alpha: .9 })]; });
  def('car', (u, o, k) => { const b = U(u, [[-62, 14], [-62, -6], [-46, -12], [-30, -34], [22, -34], [40, -12], [60, -8], [62, 14], [-62, 14]]);
    return [L(b, k + 'b'), L(U(u, [[-24, -13], [-17, -27], [16, -27], [28, -13], [-24, -13]]), k + 'w', { w: WB.w * .7 }), S.circle(-34 * u, 16 * u, 13 * u, 13 * u, { key: k + 'c1' }), S.circle(34 * u, 16 * u, 13 * u, 13 * u, { key: k + 'c2' }),
      S.fill(b, { col: o.col || HL.blue, alpha: .85 }), S.fill(polyCircle(-34 * u, 16 * u, 12 * u), { col: '#FFFFFF', alpha: 1, mode: 'cover', z: -.5 }), S.fill(polyCircle(34 * u, 16 * u, 12 * u), { col: '#FFFFFF', alpha: 1, mode: 'cover', z: -.5 })]; });
  def('wrench', (u, o, k) => {   // Maulschlüssel: Griff + Kopf mit Öffnung, schräg gestellt
    const cy = -30, r = 24, pt = (deg) => [r * Math.cos(deg * Math.PI / 180), cy + r * Math.sin(deg * Math.PI / 180)];
    const arc = (a0, a1) => Array.from({ length: 13 }, (_, i) => pt(a0 + (a1 - a0) * i / 12));
    const shape = [[-7, 62], [-7, -9], ...arc(106, 248), [-6, -38], [6, -38], ...arc(292, 434), [7, -9], [7, 62], [-7, 62]];
    const p = rot(shape.map(([x, y]) => [x * u, y * u]), -.75, 0, 12 * u);
    return [L(p, k + 'w'), S.fill(p, { col: o.col || '#B9C3D0', alpha: .9 })];
  });
  def('building', (u, o, k) => { const out = [S.rect(-40 * u, -58 * u, 80 * u, 112 * u, { key: k + 'r' }), L(U(u, [[-10, 54], [-10, 30], [10, 30], [10, 54]]), k + 'd')];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) out.push(S.rect((-28 + c * 20) * u, (-44 + r * 22) * u, 12 * u, 12 * u, { key: k + 'w' + r + c, w: WB.w * .5 }));
    out.push(S.fill(polyRect(-38 * u, -56 * u, 76 * u, 108 * u), { col: o.col || '#C9D6EA', alpha: .9 })); return out; });
  def('fire', (u, o, k) => { const f = U(u, [[0, -60], [20, -30], [34, 0], [28, 32], [0, 50], [-28, 32], [-34, 2], [-20, -20], [-10, -4], [-6, -34], [0, -60]]), g = U(u, [[2, -10], [14, 10], [12, 30], [0, 40], [-12, 30], [-12, 12], [2, -10]]);
    return [C(f, k + 'o'), C(g, k + 'i', { col: INK.orange, w: WB.w * .7 }), S.fill(catmull(f), { col: o.col || '#FF8A4C', alpha: .9 }), S.fill(catmull(g), { col: INK.yellow, alpha: .95, z: -.5 })]; });
}
