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

  // ---------- Layouts je Abschnittstyp → { items, cam, hold, cheerAt } ----------
  // Platz: oben volle Breite bis y ≈ 1060, darunter nur links (x < 570) – rechts unten steht das Erklär-Männchen.
  const LOW = 1060, LEFTW = 470;
  const BEATS = {
    hook(bt, D) {
      const items = [], size = fit(bt.lines, 116); let y = bt.tag ? 470 : 400;
      if (bt.tag) {   // Zielgruppe steht ab dem ersten Bild da (nicht erst geschrieben)
        const ts = fit([bt.tag], 68, 700), tb = textBox(bt.tag, X0 + 14, 318, { size: ts });
        items.push({ n: 0, fixed: true, draw: () => { ink(hilite(tb.x - 8, tb.y, tb.w + 16, tb.h, { col: HL.yellow, alpha: .8 })); writeOn(bt.tag, X0 + 14, 318, -2, -1, { size: ts, col: INK.blue }); } });
      }
      items.push(...lines(bt.lines, X0, y, { size }, size * 1.17)); y += (bt.lines.length - 1) * size * 1.17;
      if (bt.items && bt.items.length) {
        const k = bt.items.length, cw = MAXW / k, ms = Math.min(...bt.items.map(m => fit([m], 88, cw - 95)));
        y += 150;
        bt.items.forEach((m, j) => { const el = line(m, X0 + j * cw, y, { size: ms, underline: false }); items.push(el, mark(bt.mark || 'cross', X0 + j * cw + el.box.w + 44, y - ms * .32, 60)); });
        y += 50;
      }
      if (bt.icon) { const sz = Math.min(430, 1470 - y - 60); if (sz > 200) items.push(icon(bt.icon, 320, y + 40 + sz / 2, sz, bt.iconLabel)); }
      if (bt.note) items.push(line(bt.note, X0 + 8, 1470, { size: fit([bt.note], 50, LEFTW), col: INK.grey, weight: 400, underline: false }));
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
      y += 170;
      if (bt.items && bt.items.length) {
        if (bt.itemsTitle) { items.push(line(bt.itemsTitle, X0, y, { size: fit([bt.itemsTitle], 72, LEFTW), underline: false })); y += 110; }
        const is = Math.min(...bt.items.map(m => fit(['+ ' + m], 82, LEFTW)));
        bt.items.forEach((m, i) => items.push(line('+ ' + m, X0 + 20, y + i * 108, { size: is, col: INK.red, underline: false })));
      } else if (bt.icon) { const sz = Math.min(400, 1470 - y); items.push(icon(bt.icon, 320, y + sz / 2, sz, bt.iconLabel)); }
      return { items, cam: [[0, [540, 960, 1]], [D, [540, 975, 1.03]]] };
    },
    fact(bt, D) {
      const items = []; let y = 400;
      if (bt.kicker) { const ks = fit(bt.kicker, 96); items.push(...lines(bt.kicker, X0, y, { size: ks }, ks * 1.17)); y += bt.kicker.length * ks * 1.17 + 30; }
      const bs = fit([bt.big], 220, 840); y += bs * .62;
      const big = line(bt.big, X0 + 10, y, { size: bs, col: INK.blue, em: INK.red, underline: false });
      items.push(big, draw(() => S.ring(big.box.x + big.box.w / 2, big.box.y + big.box.h / 2, big.box.w / 2 + 42, big.box.h / 2 + 24, { col: INK.red, key: 'ring' }), .32));
      y += bs * .45 + 120;
      if (bt.lines) {
        const ys = bt.lines.map((_, i) => y + i * 96), ls = Math.min(...bt.lines.map((l, i) => fit([l], 80, ys[i] > LOW - 60 ? LEFTW : MAXW)));
        items.push(...lines(bt.lines, X0, y, { size: ls }, ls * 1.2)); y += bt.lines.length * ls * 1.2;
      }
      const sz = Math.min(320, 1470 - y - 20);
      if (bt.icon && sz > 180) items.push(icon(bt.icon, 320, y + 10 + sz / 2, sz, bt.iconLabel));
      else if (bt.icon) items.push(icon(bt.icon, 900, 330, 150, bt.iconLabel));
      if (bt.note) items.push(line(bt.note, X0 + 8, 1500, { size: fit([bt.note], 48, LEFTW), col: INK.grey, weight: 400, underline: false }));
      return { items, cam: [[0, [540, 960, 1.03]], [D, [540, 960, 1]]] };
    },
    list(bt, D) {
      const items = []; let y = 400; const ts = fit(bt.title, 104);
      items.push(...lines(bt.title, X0, y, { size: ts }, ts * 1.17)); y += bt.title.length * ts * 1.17 + 90;
      const n = bt.items.length, W = bt.items.map(m => wrapFit(m, 80, 740, 62)), nl = W.reduce((a, w) => a + w.lines.length, 0), gap = n > 3 ? 40 : 58;
      let is = Math.min(...W.map(w => w.size));
      is = Math.min(is, Math.floor((LOW + 40 - y - gap * (n - 1)) / (nl * 1.12)));   // alles oberhalb des Männchens
      W.forEach((w, i) => {
        const kind = (bt.marks && bt.marks[i]) || bt.mark || 'check';
        items.push(mark(kind, 150, y - is * .32, Math.min(78, is), i + 1), ...lines(w.lines, 225, y, { size: is }, is * 1.12));
        y += w.lines.length * is * 1.12 + gap;
      });
      if (bt.note) items.push(line(bt.note, X0 + 8, Math.max(y + 40, 1180), { size: fit([bt.note], 56, LEFTW), col: INK.blue, underline: false }));
      return { items, cam: [[0, [540, 960, 1]], [D, [540, 970, 1.03]]] };
    },
    solution(bt, D) {
      const items = [], hl = !!bt.highlight; let y = 420;
      const ps = fit(bt.product, 118);
      items.push(...lines(bt.product, X0, y, { size: ps, col: INK.blue, underline: false }, ps * 1.02)); y += bt.product.length * ps * 1.02 + 6;
      const ls = fit(bt.lines || [], hl ? 80 : 92);
      const ll = lines(bt.lines, X0, y, { size: ls }, ls * 1.18); items.push(...ll); y += (bt.lines || []).length * ls * 1.18;
      let hlEl = null;
      if (hl) {
        y += 60; const hs = fit([bt.highlight], 96);
        hlEl = line('{' + bt.highlight + '}', X0, y, { size: hs, underline: false }); items.push(hlEl); y += hs * 1.02;
        const hls = Math.min(...(bt.highlightLines || []).map((l, i) => fit([l], 68, y + i * 80 > LOW - 40 ? LEFTW : MAXW)));
        items.push(...lines(bt.highlightLines, X0, y, { size: hls }, hls * 1.2));
      }
      const P = { items, cam: [[0, [540, 960, 1]], [D, [540, 975, 1.03]]] };
      P.after = () => { const el = hlEl || ll[ll.length - 1] || items[items.length - 1]; P.cheerAt = el ? el.b : null; };
      return P;
    },
    warning(bt, D) {
      const items = []; const title = bt.title || 'Aber Achtung:';
      items.push(line(title, X0, 400, { size: fit([title], 120), col: INK.red, underline: false }));
      const ls = fit(bt.lines, 108); let y = 590;
      const ll = lines(bt.lines, X0, y, { size: ls, underline: false }, ls * 1.3); items.push(...ll); y += (bt.lines.length - 1) * ls * 1.3;
      const last = ll[ll.length - 1];
      items.push(draw(() => S.ring(last.box.x + last.box.w / 2, last.box.y + last.box.h / 2, last.box.w / 2 + 34, last.box.h / 2 + 22, { col: INK.red, key: 'wr' }), .3));
      y += 150;
      if (bt.note) { items.push(line(bt.note, X0, y, { size: fit([bt.note], 66), col: INK.blue, underline: false })); y += 60; }
      const sz = Math.min(340, 1470 - y - 30);
      if (sz > 180) items.push(icon(bt.icon || 'clock', 320, y + 30 + sz / 2, sz, bt.iconLabel));
      return { items, cam: [[0, [540, 960, 1.02]], [D, [540, 960, 1]]] };
    },
    cta(bt, D) {
      const items = [], qs = fit(bt.question, 112);
      items.push(...lines(bt.question, X0, 360, { size: qs, em: INK.blue, underline: false }, 130));
      items.push(draw(() => S.rect(70, 590, 940, 440, { r: 34, key: 'box' }), .45));
      const bx = bt.box || 'Kostenloser Check', sub = bt.sub || 'in 60 Sekunden';
      items.push(line(bx, 120, 715, { size: fit([bx], 100, 840), underline: false }), line(sub, 120, 822, { size: fit([sub], 70, 840), col: INK.grey, underline: false }));
      const lk = line('{Link in der Bio}', 120, 965, { size: 92, hlCol: INK.red, underline: false }); items.push(lk);
      items.push(draw(() => S.arrow(lk.box.x + lk.box.w + 50, lk.box.y2 - 10, lk.box.x + lk.box.w + 80, lk.box.y - 100, { col: INK.red, bend: -.25, key: 'arr' }), .22));
      return { items, cam: [[0, [540, 960, 1]], [D, [540, 960, 1.02]]], hold: 1.6 };
    },
  };

  // ---------- Erklär-Männchen: steht die ganze Zeit rechts unten, redet, zeigt, freut sich, sorgt sich ----------
  const HX = 800, HY = 1262, HS = 330;
  function host(t) {
    const i = TALK.beatAt(t), bt = EP.beats[i], lt = t - TM.beats[i].start, P = plan(i);
    const talking = TALK.talking(t), talk = talking ? TALK.open(t) : 0, g = Math.floor(t * 0.75) % 2;
    let face = 'happy', arms = 'down', hop = 0, rays = -1;
    switch (bt.type) {
      case 'hook': face = lt < 1.4 ? 'wow' : 'happy'; arms = talking ? (g ? 'explain' : 'point') : 'point'; break;
      case 'cost': face = 'worried'; arms = lt < 1.6 ? 'up' : talking ? (g ? 'point' : 'explain') : 'point'; break;
      case 'fact': arms = talking ? (g ? 'point' : 'explain') : 'point'; break;
      case 'list': arms = 'point'; break;
      case 'solution':
        face = 'proud'; arms = talking ? (g ? 'explain' : 'point') : 'point';
        if (P.cheerAt != null && lt > P.cheerAt) { const c = lt - P.cheerAt; if (c < 1.6) { arms = 'cheer'; hop = -Math.max(0, Math.sin(c * 9)) * 26 * Math.exp(-c * 2); rays = c; } }
        break;
      case 'warning': face = 'worried'; arms = talking && g ? 'explain' : 'up'; break;
      case 'cta': arms = 'wave'; hop = -Math.abs(Math.sin(lt * 4)) * 8; break;
    }
    if (lt < .45 && i > 0) hop -= Math.sin((lt / .45) * Math.PI) * 14;          // kleiner Hüpfer beim neuen Abschnitt
    hop += Math.sin(t * 2.3) * 2.5 - talk * 3;                                  // atmen, beim Reden leicht wippen
    const strokes = shieldGuy(HX, HY, HS, { face, arms, talk, look: [-2, -0.6], key: 'host' });
    if (t < .7) drawOn(strokes, 0, .6, { hand: false, y: hop }); else ink(strokes, { y: hop });
    if (rays >= 0 && rays < .6) ink(S.rays(HX, HY - HS * .1 + hop, HS * .62, HS * .78, 9, { col: INK.orange, key: 'yay' }), { alpha: 1 - seg(rays, .35, .6) });
  }

  // ---------- Szenen aufbauen ----------
  const PLANS = [];
  function plan(i) {
    if (PLANS[i]) return PLANS[i];
    if (!G) G = OUT;   // Textmaße brauchen den Zeichenkontext (auch vor dem ersten Bild)
    const bt = EP.beats[i], tm = TM.beats[i], D = tm.dur, P = (BEATS[bt.type] || BEATS.fact)(bt, D);
    const fixed = P.items.filter(it => it.fixed); fixed.forEach(it => { it.a = -2; it.b = -1; });
    schedule(P.items.filter(it => !it.fixed), .15, D - (P.hold || .95));
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
  // Das Männchen steht VOR der Tafel: nach Hand und Wischer zeichnen, über allem
  const prevHook = window.overlayHook;
  // Fortschrittsbalken oben: ein Segment je Abschnitt (hält die Leute dran)
  function progress(c, t) {
    const x0 = 80, w = 920, gap = 10, y = 206, h = 9, n = TM.beats.length, total = TM.total;
    let x = x0;
    TM.beats.forEach((b, i) => {
      const sw = (w - gap * (n - 1)) * (b.dur / total), k = Math.min(1, Math.max(0, (t - b.start) / b.dur));
      c.fillStyle = 'rgba(11,11,10,.13)'; c.beginPath(); c.roundRect(x, y, sw, h, 5); c.fill();
      if (k > 0) { c.fillStyle = '#0B0B0A'; c.beginPath(); c.roundRect(x, y, Math.max(h, sw * k), h, 5); c.fill(); }
      x += sw + gap;
    });
  }
  window.overlayHook = (c, t) => { G.save(); G.setTransform(1, 0, 0, 1, 0, 0); host(t); G.restore(); progress(c, t); if (prevHook) prevHook(c, t); };

  // Geräusche: Marker beim Schreiben, Wischer beim Übergang, „Pop“ beim Jubeln
  window.collectSfx = () => {
    const out = [];
    EP.beats.forEach((bt, i) => {
      const P = plan(i), t0 = TM.beats[i].start;
      for (const it of P.items) if (it.b - it.a > .05) out.push({ time: t0 + it.a, kind: 'marker', dur: it.b - it.a, gain: .9 });
      if (i < last) out.push({ time: t0 + TM.beats[i].dur - .72, kind: 'erase', dur: .7, gain: .8 });
      if (P.cheerAt != null) out.push({ time: t0 + P.cheerAt, kind: 'pop', gain: .8 });
    });
    return out;
  };

  // Pflichtangaben + Markenzeile (Bildschirm-Einblendungen aus brand.js)
  const starred = EP.beats.findIndex(b => b.type === 'solution' && JSON.stringify(b).includes('*'));
  if (starred >= 0) { const s = TM.beats[starred]; overlay([{ a: s.start + Math.min(3.4, s.dur * .45), b: s.start + s.dur - .4, kind: 'fine', y: 1560 }]); }
  const ci = EP.beats.findIndex(b => b.type === 'cta');
  if (ci >= 0) { const c = TM.beats[ci]; overlay([{ a: c.start + 1.2, b: TM.total + 1, kind: 'brand', y: 1110 }, { a: c.start + 1.4, b: TM.total + 1, kind: 'fine', y: 1560 }]); }
})();
