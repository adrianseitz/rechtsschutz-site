// vermieter.js: „Dein Mieter zahlt nicht mehr?“ – Whiteboard-Erklärvideo (26 s, Hochformat 1080×1920).
// A: Problem (Haus, Monate ohne Miete, Kosten) → B: Lösung (Schild, Rechtsschutz + Mietausfallschutz)
// → C: Haken (Wartezeit) → D: Handlungsaufforderung.
// Inhalt im Bereich y ≈ 300–1500 halten: oben und unten liegen bei TikTok/Reels die Bedienelemente.
(() => {
  const L = 90;            // linker Rand (Welt-Pixel)
  const Y2 = 1700;         // zweiter Tafelbereich in Szene A liegt 1700 px tiefer

  // ---- A: Das Problem (lange Tafel, die Kamera fährt nach unten) -------------------------------------------
  function problem(t, lt, dur) {
    wbBegin(lt, { cam: [[0, [540, 960, 1.04]], [4.9, [540, 960, 1]], [5.5, [540, 960 + Y2, 1]], [dur, [540, 975 + Y2, 1.03]]] });

    writeOn('Dein Mieter', L, 400, .15, 1.1, { size: 116 });
    const z = textBox('zahlt ', L, 535, { size: 108 });
    writeOn('zahlt', L, 535, 1.15, 1.55, { size: 108 });
    const nm = writeOn('nicht mehr?', L + z.w, 535, 1.6, 2.45, { size: 108, col: INK.red });
    drawOn(S.underline(nm.x, nm.y2 + 6, nm.w, { col: INK.red }), 2.47, 2.7);

    drawOn(ICON.house(320, 1010, 470, { col: HL.blue }), 2.8, 3.9);
    ['März', 'April', 'Mai'].forEach((m, i) => {
      const y = 900 + i * 135, a = 3.95 + i * .3;
      writeOn(m, 640, y, a, a + .22, { size: 86 });
      drawOn(S.cross(940, y - 28, 74, { key: 'x' + i }), a + .22, a + .3);
    });

    // zweiter Bereich: was es kostet
    writeOn('Jeder Monat kostet dich:', L, 400 + Y2, 5.55, 6.45, { size: 76 });
    const sum = writeOn('– 5.700 €', L, 610 + Y2, 6.5, 7.25, { size: 190, col: INK.red });
    drawOn(S.underline(sum.x, sum.y2 + 4, sum.w, { col: INK.red, double: true }), 7.27, 7.45);
    writeOn('Beispiel: 950 € Kaltmiete, 6 Monate', L + 8, 715 + Y2, 7.5, 7.95, { size: 46, col: INK.grey, weight: 400 });
    drawOn([ICON.coin(880, 500 + Y2, 120, { key: 'c1' }), ...S.speed(965, 465 + Y2, 90, -.6, 3, 24, { key: 'sp' })], 6.9, 7.25, { hand: false });

    writeOn('Dazu kommen:', L, 880 + Y2, 8.0, 8.45, { size: 72 });
    ['Anwalt', 'Gericht', 'Räumung'].forEach((w, i) => writeOn('+ ' + w, L + 20, 990 + Y2 + i * 105, 8.5 + i * .25, 8.72 + i * .25, { size: 80, col: INK.red }));
    // Rechnung mit Fragezeichen
    drawOn([S.rect(600, 880 + Y2, 380, 400, { r: 14, key: 'bill' }), ...[0, 1, 2, 3].map(i => S.line(640, 960 + Y2 + i * 55, 900 - (i % 2) * 70, 960 + Y2 + i * 55, { w: WB.w * .6, key: 'bl' + i }))], 8.0, 8.6, { hand: false });
    writeOn('?', 830, 1240 + Y2, 8.9, 9.05, { size: 150, col: INK.red });

    camEnd();
    eraseWipe(seg(lt, dur - .75, dur), { rows: 4 });
  }

  // ---- B: Die Lösung ---------------------------------------------------------------------------------------
  function loesung(t, lt, dur) {
    wbBegin(lt, { cam: [[0, [540, 960, 1]], [dur, [540, 975, 1.03]]] });
    const drawn = lt > 1.6;
    const face = lt < 5.6 ? 'happy' : 'proud', arms = lt > 1.9 && lt < 3.3 ? 'wave' : lt > 5.6 ? 'cheer' : 'down';
    const hop = drawn ? -Math.abs(Math.sin((lt - 1.6) * 5)) * 22 * Math.exp(-(lt - 1.6) * 1.2) - (lt > 5.6 && lt < 6.3 ? Math.max(0, Math.sin((lt - 5.6) * 9)) * 26 : 0) : 0;
    drawOn(shieldGuy(540, 470, 400, { face: drawn ? face : 'happy', arms: drawn ? arms : 'down' }), .1, 1.6, { y: hop });

    writeOn('Vermieter-', L, 900, 1.8, 2.5, { size: 118, col: INK.blue });
    writeOn('rechtsschutz', L, 1020, 2.5, 3.25, { size: 118, col: INK.blue });
    writeOn('zahlt Anwalt, Gericht', L, 1145, 3.35, 4.15, { size: 76 });
    writeOn('und Räumung.*', L, 1235, 4.15, 4.6, { size: 76 });

    const m = textBox('+ Mietausfallschutz', L, 1390, { size: 98 });
    drawOn(hilite(m.x, m.y, m.w, m.h, { col: HL.yellow, alpha: .75 }), 4.75, 5.05);
    writeOn('+ Mietausfallschutz', L, 1390, 5.05, 5.95, { size: 98 });
    writeOn('ersetzt die Miete –', L, 1485, 6.05, 6.55, { size: 66 });
    writeOn('bis zu 12 Monate.*', L, 1565, 6.55, 7.05, { size: 66 });
    if (lt > 5.6 && lt < 6.2) ink(S.rays(540, 420 + hop, 250, 300, 9, { col: INK.orange, key: 'yay' }), { alpha: 1 - seg(lt, 5.95, 6.2) });

    camEnd();
    eraseWipe(seg(lt, dur - .75, dur), { rows: 4 });
  }

  // ---- C: Der Haken – Wartezeit ----------------------------------------------------------------------------
  function haken(t, lt, dur) {
    wbBegin(lt, { cam: [[0, [540, 960, 1.02]], [dur, [540, 960, 1]]] });
    writeOn('Aber Achtung:', L, 400, .1, .9, { size: 120, col: INK.red });
    drawOn(ICON.clock(300, 760, 330, { col: HL.blue }), .95, 1.7);
    const worried = lt > 1.7;
    drawOn(shieldGuy(800, 770, 300, { face: 'worried', arms: worried ? 'up' : 'down', key: 'sg2' }), 1.7, 2.4, { y: worried ? Math.sin(lt * 6) * 4 : 0 });
    writeOn('Erst absichern,', L, 1150, 2.5, 3.2, { size: 108 });
    const d = writeOn('dann Ärger.', L, 1290, 3.2, 3.75, { size: 108 });
    drawOn(S.ring(d.cx, d.cy, d.w / 2 + 34, d.h / 2 + 22, { col: INK.red }), 3.8, 4.05);
    writeOn('Wartezeit meist 3 Monate', L, 1450, 4.1, 4.75, { size: 66, col: INK.blue });
    camEnd();
    eraseWipe(seg(lt, dur - .7, dur), { rows: 4 });
  }

  // ---- D: Handlungsaufforderung ----------------------------------------------------------------------------
  function cta(t, lt, dur) {
    wbBegin(lt, { cam: [[0, [540, 960, 1]], [dur, [540, 960, 1.02]]] });
    writeOn('Passt das zu', L, 360, .1, .7, { size: 112 });
    writeOn('deiner Immobilie?', L, 490, .7, 1.45, { size: 112, col: INK.blue });
    drawOn(S.rect(70, 590, 940, 480, { r: 34, key: 'box' }), 1.5, 1.95);
    writeOn('Kostenloser Check', 120, 720, 1.95, 2.6, { size: 100 });
    writeOn('in 60 Sekunden', 120, 830, 2.6, 2.95, { size: 70, col: INK.grey });
    const lk = textBox('Link in der Bio', 120, 985, { size: 92 });
    drawOn(hilite(lk.x, lk.y, lk.w, lk.h, { col: HL.yellow, alpha: .8 }), 2.95, 3.2);
    writeOn('Link in der Bio', 120, 985, 3.2, 3.75, { size: 92, col: INK.red });
    drawOn(S.arrow(lk.x2 + 50, lk.y2 - 10, lk.x2 + 80, lk.y - 110, { col: INK.red, bend: -.25, key: 'arr' }), 3.8, 4.0);
    const done = lt > 4.1;
    drawOn(shieldGuy(830, 1250, 240, { face: 'happy', arms: done ? 'wave' : 'down', key: 'sg3' }), 1.0, 1.01, { hand: false, y: done ? -Math.abs(Math.sin(lt * 4)) * 10 : 0 });
  }

  shots([[0, problem], [9.6, loesung], [17.6, haken], [23.6, cta]]);
  overlay([
    { a: 13.0, b: 17.0, kind: 'fine', y: 1650 },
    { a: 23.6 + 1.2, b: 29, kind: 'brand', y: 1440 },
    { a: 23.6 + 1.4, b: 29, kind: 'fine', y: 1580 },
  ]);
})();
