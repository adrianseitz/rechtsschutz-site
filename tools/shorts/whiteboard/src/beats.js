// beats.js: baut aus einer Episode (window.EP) die Whiteboard-Szenen – ein Abschnitt (beat) = eine Tafel.
// Typen: hook, cost, fact, list, solution, warning, cta. Zeiten kommen aus window.EP_TIMING (vom Renderer aus der
// Länge der Sprachaufnahme berechnet). Inhalt im Bereich y ≈ 300–1600 halten: oben und unten liegen bei
// TikTok/Reels die Bedienelemente.
// Text-Auszeichnung in der Episode: [betont] (rot, unterstrichen), {markiert} (gelber Marker).
(() => {
  const EP = window.EP, TM = window.EP_TIMING;
  if (!EP || !TM) { console.error('EP / EP_TIMING fehlt'); return; }
  const X0 = 90, MAXW = 880;
  window.SFX = [];

  // ---------- Text ----------
  function parse(s) {
    const out = []; let cur = '', mode = null;
    for (const ch of String(s)) {
      if (ch === '[' || ch === '{') { if (cur) out.push({ t: cur, m: mode }); cur = ''; mode = ch === '[' ? 'em' : 'hl'; continue; }
      if (ch === ']' || ch === '}') { if (cur) out.push({ t: cur, m: mode }); cur = ''; mode = null; continue; }
      cur += ch;
    }
    if (cur) out.push({ t: cur, m: mode });
    return out;
  }
  const plain = s => parse(s).map(p => p.t).join('');
  const width = (s, size) => textBox(plain(s), 0, 0, { size }).w;
  function fit(lines, base, maxW = MAXW) {
    let s = base;
    for (const l of [].concat(lines || [])) { const w = width(l, s); if (w > maxW) s = Math.floor(s * maxW / w); }
    return s;
  }
  // zu lange Zeile → an der Leerstelle nahe der Mitte umbrechen (nicht innerhalb von [..] / {..})
  function wrapFit(str, base, maxW, min = 60) {
    const one = fit([str], base, maxW);
    if (one >= min) return { lines: [str], size: one };
    let depth = 0, best = -1; const mid = str.length / 2;
    [...str].forEach((ch, i) => { if (ch === '[' || ch === '{') depth++; else if (ch === ']' || ch === '}') depth--; else if (ch === ' ' && !depth && (best < 0 || Math.abs(i - mid) < Math.abs(best - mid))) best = i; });
    if (best < 0) return { lines: [str], size: one };
    const two = [str.slice(0, best), str.slice(best + 1)];
    return { lines: two, size: Math.max(one, fit(two, base, maxW)) };
  }
  const nText = (s, size) => .2 + .058 * plain(s).length * Math.sqrt(size / 100);

  // ---------- Elemente: { n (natürliche Dauer), draw(lt), a, b } ----------
  function line(str, x, y, o = {}) {
    const size = o.size || 80, segs = parse(str), parts = []; let cx = x;
    for (const s of segs) { const w = textBox(s.t, 0, 0, { size }).w; parts.push({ ...s, x: cx, w }); cx += w; }
    const chars = Math.max(1, parts.reduce((a, p) => a + p.t.length, 0));
    const em = o.underline === false ? null : parts.filter(p => p.m === 'em').pop();
    const el = { n: nText(str, size) + (em ? .2 : 0), box: { x, y: y - size * .78, w: cx - x, h: size * 1.02, y2: y + size * .24 } };
    el.draw = () => {
      const end = em ? el.a + (el.b - el.a) * .84 : el.b; let a = el.a;
      for (const p of parts) {
        const b = a + (end - el.a) * p.t.length / chars;
        if (p.m === 'hl') {
          const bx = textBox(p.t.trim(), p.x, y, { size });
          drawOn(hilite(bx.x, bx.y, bx.w, bx.h, { col: HL.yellow, alpha: .75 }), a, a + (b - a) * .3);
          writeOn(p.t, p.x, y, a + (b - a) * .3, b, { size, col: o.hlCol || o.col || INK.black });
        } else writeOn(p.t, p.x, y, a, b, { size, col: p.m === 'em' ? (o.em || INK.red) : (o.col || INK.black), weight: o.weight });
        a = b;
      }
      if (em) { const bx = textBox(em.t.trim(), em.x, y, { size }); drawOn(S.underline(bx.x, bx.y2 + 6, bx.w, { col: o.em || INK.red, key: 'u' + Math.round(y) }), end, el.b); }
    };
    return el;
  }
  const lines = (arr, x, y, o, step) => (arr || []).map((l, i) => line(l, x, y + i * step, o));
  function draw(build, n, o = {}) { const el = { n }; el.draw = () => drawOn(build(), el.a, el.b, o); return el; }
  function icon(name, cx, cy, s, label) {
    const fn = ICON[name] || ICON.house;
    const el = { n: .95 };
    el.draw = () => {
      const end = label ? el.a + (el.b - el.a) * .68 : el.b;
      drawOn(fn(cx, cy, s, { key: 'i' + name + Math.round(cx) + Math.round(cy) }), el.a, end);
      if (label) writeOn(label, cx, cy + s * .26, end, el.b, { size: fit([label], s * .2, s * .78), align: 'center', col: INK.black });
    };
    if (label) el.n += .45;
    return el;
  }
  function mark(kind, x, y, s, num) {
    const el = { n: kind === 'num' ? .4 : .22 };
    el.draw = () => {
      if (kind === 'num') { drawOn(S.circle(x, y, s * .52, s * .52, { key: 'n' + num + Math.round(y), col: INK.blue }), el.a, el.a + (el.b - el.a) * .55); writeOn(String(num), x, y + s * .26, el.a + (el.b - el.a) * .55, el.b, { size: s * .72, align: 'center', col: INK.blue }); }
      else drawOn(kind === 'check' ? S.check(x, y, s * 1.05, { key: 'ck' + Math.round(y) }) : S.cross(x, y, s, { key: 'x' + Math.round(x) + Math.round(y) }), el.a, el.b);
    };
    return el;
  }

  // Elemente nacheinander ins Zeitfenster legen (gestaucht, wenn eng; höchstens 35 % langsamer als natürlich)
  function schedule(items, w0, w1) {
    const gap = .1, nat = items.reduce((s, it) => s + it.n, 0) + gap * Math.max(0, items.length - 1);
    const k = Math.min(1.35, (w1 - w0) / Math.max(nat, .01));
    let t = w0;
    for (const it of items) { it.a = t; it.b = t + it.n * k; t = it.b + gap * k; }
  }

  // ---------- Maskottchen ----------
  function mascot(cx, cy, size, o = {}) {
    const el = { n: o.n ?? 1.3, kind: 'mascot' };
    el.draw = (lt) => {
      const drawn = lt > el.b, since = lt - el.b;
      let face = o.face || 'happy', arms = 'down', hop = 0;
      if (drawn) {
        if (o.mood === 'worried') { arms = 'up'; hop = Math.sin(lt * 6) * 4; }
        else {
          hop = -Math.abs(Math.sin(since * 5)) * 22 * Math.exp(-since * 1.2);
          if (since > .3 && since < 1.7) arms = 'wave';
          if (o.cheerAt != null && lt > o.cheerAt()) { face = 'proud'; arms = 'cheer'; const c = lt - o.cheerAt(); if (c < .7) hop -= Math.max(0, Math.sin(c * 9)) * 26; }
          if (o.waveLoop) { arms = 'wave'; hop = -Math.abs(Math.sin(lt * 4)) * 10; }
        }
      }
      drawOn(shieldGuy(cx, cy, size, { face: drawn ? face : 'happy', arms: drawn ? arms : 'down', key: o.key || 'sg' }), el.a, el.b, { y: hop, hand: o.instant ? false : undefined });
      if (o.cheerAt != null && drawn) { const c = lt - o.cheerAt(); if (c > 0 && c < .6) ink(S.rays(cx, cy - size * .12 + hop, size * .62, size * .75, 9, { col: INK.orange, key: 'yay' + Math.round(cx) }), { alpha: 1 - seg(c, .35, .6) }); }
    };
    return el;
  }

  // ---------- Layouts je Abschnittstyp → { items, cam, w1, extra } ----------
  const BEATS = {
    hook(bt, D) {
      const items = [], size = fit(bt.lines, 116); let y = 400;
      items.push(...lines(bt.lines, X0, y, { size }, size * 1.17)); y += bt.lines.length * size * 1.17 + 10;
      if (bt.items && bt.items.length) {
        items.push(icon(bt.icon || 'house', 320, y + 360, 470, bt.iconLabel));
        const ms = Math.min(...bt.items.map(m => fit([m], 86, 270)));
        bt.items.forEach((m, i) => { const yy = y + 250 + i * 135; items.push(line(m, 640, yy, { size: ms, underline: false })); items.push(mark(bt.mark || 'cross', 950, yy - ms * .32, 74)); });
      } else if (bt.icon) items.push(icon(bt.icon, 540, y + 420, 520, bt.iconLabel));
      if (bt.note) items.push(line(bt.note, X0 + 8, 1460, { size: fit([bt.note], 52), col: INK.grey, weight: 400, underline: false }));
      return { items, cam: [[0, [540, 960, 1.04]], [D, [540, 960, 1]]] };
    },
    cost(bt, D) {
      const items = []; let y = 400;
      items.push(line(bt.title, X0, y, { size: fit([bt.title], 78), underline: false })); y += 210;
      const bs = fit([bt.big], 190, 840), big = line(bt.big, X0, y, { size: bs, col: INK.red, underline: false });
      items.push(big, draw(() => S.underline(big.box.x, big.box.y2 + 4, big.box.w, { col: INK.red, double: true, key: 'bigu' }), .25));
      if (big.box.w < 650) items.push(draw(() => [ICON.coin(880, y - 110, 120, { key: 'c1' }), ...S.speed(965, y - 145, 90, -.6, 3, 24, { key: 'sp' })], .4, { hand: false }));
      y += 105;
      if (bt.note) items.push(line(bt.note, X0 + 8, y, { size: fit([bt.note], 46), col: INK.grey, weight: 400, underline: false }));
      y += 165;
      if (bt.items && bt.items.length) {
        const top = y - 70;
        if (bt.itemsTitle) { items.push(line(bt.itemsTitle, X0, y, { size: fit([bt.itemsTitle], 72, 480), underline: false })); y += 110; }
        const is = Math.min(...bt.items.map(m => fit(['+ ' + m], 80, 470)));
        bt.items.forEach((m, i) => items.push(line('+ ' + m, X0 + 20, y + i * 105, { size: is, col: INK.red, underline: false })));
        items.push(draw(() => [S.rect(620, top, 360, 400, { r: 14, key: 'bill' }), ...[0, 1, 2, 3].map(i => S.line(660, top + 80 + i * 55, 920 - (i % 2) * 70, top + 80 + i * 55, { w: WB.w * .6, key: 'bl' + i }))], .6, { hand: false }));
        items.push(line(bt.billMark || '?', 820, top + 360, { size: 150, col: INK.red, underline: false }));
      } else if (bt.icon) { const sz = Math.min(440, 1560 - y); items.push(icon(bt.icon, 540, y + sz / 2, sz, bt.iconLabel)); }
      return { items, cam: [[0, [540, 960, 1]], [D, [540, 975, 1.03]]] };
    },
    fact(bt, D) {
      const items = []; let y = 400;
      if (bt.kicker) { const ks = fit(bt.kicker, 96); items.push(...lines(bt.kicker, X0, y, { size: ks }, ks * 1.17)); y += bt.kicker.length * ks * 1.17 + 30; }
      const bs = fit([bt.big], 230, 840); y += bs * .62;
      const big = line(bt.big, X0 + 10, y, { size: bs, col: INK.blue, em: INK.red, underline: false });
      items.push(big, draw(() => S.ring(big.box.x + big.box.w / 2, big.box.y + big.box.h / 2, big.box.w / 2 + 42, big.box.h / 2 + 24, { col: INK.red, key: 'ring' }), .32));
      y += bs * .45 + 120;
      if (bt.lines) { const ls = fit(bt.lines, 84); items.push(...lines(bt.lines, X0, y, { size: ls }, ls * 1.2)); y += bt.lines.length * ls * 1.2; }
      const room = 1560 - y;
      if (bt.icon && room > 220) { const sz = Math.min(400, room - 40); items.push(icon(bt.icon, 540, y + 20 + sz / 2, sz, bt.iconLabel)); }
      else if (bt.icon) items.push(icon(bt.icon, 900, 330, 160, bt.iconLabel));
      if (bt.note) items.push(line(bt.note, X0 + 8, 1640, { size: fit([bt.note], 50), col: INK.grey, weight: 400, underline: false }));
      return { items, cam: [[0, [540, 960, 1.03]], [D, [540, 960, 1]]] };
    },
    list(bt, D) {
      const items = []; let y = 400; const ts = fit(bt.title, 104);
      items.push(...lines(bt.title, X0, y, { size: ts }, ts * 1.17)); y += bt.title.length * ts * 1.17 + 120;
      const n = bt.items.length, W = bt.items.map(m => wrapFit(m, 80, 740, 62)), is = Math.min(...W.map(w => w.size));
      const hts = W.map(w => w.lines.length * is * 1.12 + (n > 3 ? 46 : 70)), total = hts.reduce((a, b) => a + b, 0);
      y = Math.max(y, Math.min(y + 120, (y + 1500 - total) / 2));
      W.forEach((w, i) => {
        const kind = (bt.marks && bt.marks[i]) || bt.mark || 'check';
        items.push(mark(kind, 150, y - is * .32, 78, i + 1), ...lines(w.lines, 225, y, { size: is }, is * 1.12));
        y += hts[i];
      });
      if (bt.note) items.push(line(bt.note, X0 + 8, Math.min(1560, y + 30), { size: fit([bt.note], 56), col: INK.blue, underline: false }));
      return { items, cam: [[0, [540, 960, 1]], [D, [540, 970, 1.03]]] };
    },
    solution(bt, D) {
      const items = [], hl = !!bt.highlight; let y = 900, cheer = null;
      const sg = mascot(540, 470, 400, { cheerAt: () => cheer }); items.push(sg);
      const ps = fit(bt.product, 118);
      items.push(...lines(bt.product, X0, y, { size: ps, col: INK.blue, underline: false }, ps * 1.02)); y += bt.product.length * ps * 1.02 + 20;
      const ls = fit(bt.lines || [], hl ? 76 : 90);
      items.push(...lines(bt.lines, X0, y, { size: ls }, ls * 1.18)); y += (bt.lines || []).length * ls * 1.18;
      let hlEl = null;
      if (hl) {
        y += 50; const hs = fit([bt.highlight], 98);
        hlEl = line('{' + bt.highlight + '}', X0, y, { size: hs, underline: false }); items.push(hlEl); y += hs * .97;
        const hls = fit(bt.highlightLines || [], 66); items.push(...lines(bt.highlightLines, X0, y, { size: hls }, hls * 1.2));
      }
      return { items, cam: [[0, [540, 960, 1]], [D, [540, 975, 1.03]]], after() { cheer = hlEl ? hlEl.b : null; } };
    },
    warning(bt, D) {
      const items = []; const title = bt.title || 'Aber Achtung:';
      items.push(line(title, X0, 400, { size: fit([title], 120), col: INK.red, underline: false }));
      items.push(icon(bt.icon || 'clock', 300, 760, 330, bt.iconLabel));
      items.push(mascot(800, 770, 300, { mood: 'worried', face: 'worried', key: 'sg2', n: .9 }));
      const ls = fit(bt.lines, 108); let y = 1150;
      const ll = lines(bt.lines, X0, y, { size: ls, underline: false }, ls * 1.3); items.push(...ll); y += bt.lines.length * ls * 1.3;
      const last = ll[ll.length - 1];
      items.push(draw(() => S.ring(last.box.x + last.box.w / 2, last.box.y + last.box.h / 2, last.box.w / 2 + 34, last.box.h / 2 + 22, { col: INK.red, key: 'wr' }), .3));
      if (bt.note) items.push(line(bt.note, X0, y + 10, { size: fit([bt.note], 66), col: INK.blue, underline: false }));
      return { items, cam: [[0, [540, 960, 1.02]], [D, [540, 960, 1]]] };
    },
    cta(bt, D) {
      const items = [], qs = fit(bt.question, 112);
      items.push(...lines(bt.question, X0, 360, { size: qs, em: INK.blue, underline: false }, 130));
      items.push(draw(() => S.rect(70, 590, 940, 480, { r: 34, key: 'box' }), .45));
      const bx = bt.box || 'Kostenloser Check', sub = bt.sub || 'in 60 Sekunden';
      items.push(line(bx, 120, 720, { size: fit([bx], 100, 840), underline: false }), line(sub, 120, 830, { size: fit([sub], 70, 840), col: INK.grey, underline: false }));
      const lk = line('{Link in der Bio}', 120, 985, { size: 92, hlCol: INK.red, underline: false }); items.push(lk);
      items.push(draw(() => S.arrow(lk.box.x + lk.box.w + 50, lk.box.y2 - 10, lk.box.x + lk.box.w + 80, lk.box.y - 110, { col: INK.red, bend: -.25, key: 'arr' }), .22));
      items.push(mascot(830, 1250, 240, { key: 'sg3', waveLoop: true, n: .02, instant: true }));
      return { items, cam: [[0, [540, 960, 1]], [D, [540, 960, 1.02]]], hold: 1.6 };
    },
  };

  // ---------- Szenen aufbauen ----------
  const PLANS = [];
  function plan(i) {
    if (PLANS[i]) return PLANS[i];
    if (!G) G = OUT;   // Textmaße brauchen den Zeichenkontext (auch vor dem ersten Bild)
    const bt = EP.beats[i], tm = TM.beats[i], D = tm.dur, P = (BEATS[bt.type] || BEATS.fact)(bt, D);
    const mascots = P.items.filter(it => it.kind === 'mascot' && it.n < .1);   // sofort da, nicht eingeplant
    const rest = P.items.filter(it => !mascots.includes(it));
    schedule(rest, .15, D - (P.hold || .95));
    mascots.forEach(m => { m.a = 1; m.b = 1.01; });
    if (P.after) P.after();
    PLANS[i] = P;
    return P;
  }
  const last = EP.beats.length - 1;
  shots(EP.beats.map((bt, i) => [TM.beats[i].start, (t, lt, dur) => {
    const P = plan(i);
    wbBegin(lt, { cam: P.cam });
    for (const it of P.items) it.draw(lt);
    camEnd();
    if (i < last) eraseWipe(seg(lt, dur - .7, dur), { rows: 4 });
  }]));

  // Geräusche: Marker beim Schreiben, Wischer beim Übergang, „Pop“ beim Jubeln
  window.collectSfx = () => {
    const out = [];
    EP.beats.forEach((bt, i) => {
      const P = plan(i), t0 = TM.beats[i].start;
      for (const it of P.items) if (it.b - it.a > .05) out.push({ time: t0 + it.a, kind: 'marker', dur: it.b - it.a, gain: .9 });
      if (i < last) out.push({ time: t0 + TM.beats[i].dur - .72, kind: 'erase', dur: .7, gain: .8 });
    });
    return out;
  };

  // Pflichtangaben + Markenzeile (Bildschirm-Einblendungen aus brand.js)
  const starred = EP.beats.findIndex(b => b.type === 'solution' && JSON.stringify(b).includes('*'));
  if (starred >= 0) { const s = TM.beats[starred]; overlay([{ a: s.start + Math.min(3.4, s.dur * .45), b: s.start + s.dur - .4, kind: 'fine', y: 1650 }]); }
  const ci = EP.beats.findIndex(b => b.type === 'cta');
  if (ci >= 0) { const c = TM.beats[ci]; overlay([{ a: c.start + 1.2, b: TM.total + 1, kind: 'brand', y: 1440 }, { a: c.start + 1.4, b: TM.total + 1, kind: 'fine', y: 1580 }]); }
})();
