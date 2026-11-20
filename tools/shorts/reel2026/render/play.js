// ---------- Spielszenen mit 3D-Figuren (Microsoft Fluent Emoji 3D, MIT) ----------
// Bühne = abgerundetes Fenster; Figuren sind Brustbilder und stehen auf der Unterkante.
const FL = k => `assets/fl/${k}.png`;
const SETS = {
  living: [{ img: 'window', x: 210, y: 70, h: 250, blur: 5, op: .55 }, { img: 'picture', x: 520, y: 60, h: 160, blur: 5, op: .45 }, { img: 'plant', x: 860, y: 300, h: 300, blur: 4, op: .6 }],
  door:   [{ img: 'door', x: 780, y: 40, h: 560, blur: 4, op: .6 }, { img: 'plant', x: 150, y: 330, h: 270, blur: 5, op: .5 }],
  office: [{ img: 'window', x: 760, y: 70, h: 250, blur: 5, op: .5 }, { img: 'plant', x: 140, y: 300, h: 300, blur: 5, op: .55 }, { img: 'picture', x: 420, y: 70, h: 150, blur: 6, op: .4 }],
  court:  [{ img: 'court', x: 480, y: 40, h: 340, blur: 5, op: .45 }, { img: 'balance', x: 150, y: 90, h: 200, blur: 6, op: .4 }],
  street: [{ img: 'house2', x: 220, y: 120, h: 330, blur: 4, op: .55 }, { img: 'houses', x: 760, y: 150, h: 300, blur: 5, op: .45 }],
  bank:   [{ img: 'office', x: 760, y: 60, h: 380, blur: 4, op: .5 }, { img: 'coin', x: 520, y: 90, h: 150, blur: 6, op: .4 }, { img: 'plant', x: 140, y: 320, h: 280, blur: 5, op: .45 }],
  house:  [{ img: 'house', x: 760, y: 90, h: 380, blur: 4, op: .55 }, { img: 'plant', x: 130, y: 320, h: 280, blur: 5, op: .45 }],
  none: [],
};
W.play = (root, p, beat) => {
  const at = (v, d = 0) => v == null ? d : typeof v === 'number' ? v : (beat.wordAt(v) ?? (beat.start + d)) - beat.start;
  const end = beat.next - beat.start;
  const P = { x: p.left ?? 60, y: p.top ?? 480, w: p.w ?? 960, h: p.h ?? 760 };
  const D = dark();
  const tint = p.tint || (D ? 'night' : 'paper');
  const BG = {
    night: 'radial-gradient(900px 600px at 50% 30%, #33363E 0%, #24262B 60%, #1B1C20 100%)',
    red: 'radial-gradient(900px 600px at 50% 35%, #4A2A2E 0%, #2A2226 60%, #1C1A1D 100%)',
    paper: 'radial-gradient(900px 600px at 50% 30%, #FFFFFF 0%, #F3F1EA 70%, #E9E6DC 100%)',
    yellow: 'radial-gradient(900px 600px at 50% 25%, #FFE869 0%, #FFD60A 70%, #F5C800 100%)',
  }[tint];
  const panel = el('div', `position:absolute; left:${P.x}px; top:${P.y}px; width:${P.w}px; height:${P.h}px; border-radius:52px; overflow:hidden; background:${BG};
    box-shadow:${D ? '0 50px 100px rgba(0,0,0,.5), inset 0 0 0 2px rgba(255,255,255,.07)' : '0 40px 90px rgba(40,36,20,.18), inset 0 0 0 2px rgba(23,24,27,.06)'};`, '', root);
  const over = el('div', `position:absolute; left:${P.x}px; top:${P.y}px; width:${P.w}px; height:${P.h}px;`, '', root); // ungeclippt: Sprechblasen, Stempel
  // Kulisse (unscharf = Tiefe)
  (typeof p.set === 'string' ? SETS[p.set] : (p.set || [])).forEach(s => {
    const i = el('img', `position:absolute; left:${s.x - s.h/2}px; top:${s.y}px; height:${s.h}px; filter:blur(${s.blur ?? 4}px) ${D ? 'brightness(.75)' : ''}; opacity:${s.op ?? .5};`, '', panel); i.src = FL(s.img);
  });
  // Boden-Schatten unten
  el('div', `position:absolute; left:0; right:0; bottom:0; height:180px; background:linear-gradient(transparent, ${D ? 'rgba(0,0,0,.28)' : 'rgba(80,70,30,.08)'});`, '', panel);
  // Figuren
  const actors = {};
  (p.actors || []).forEach(a => {
    const h = a.h ?? 440;
    const wrap = el('div', `position:absolute; left:${a.x - h/2}px; top:${P.h - h * .985 + (a.dy || 0)}px; width:${h}px; height:${h}px; transform-origin:50% 100%; z-index:${a.z ?? 2};`, '', panel);
    const imgs = [a.img, ...(a.swap || []).map(s => s.img)].map((k, i) => { const im = el('img', `position:absolute; inset:0; width:100%; height:100%; ${a.flip ? 'transform:scaleX(-1);' : ''} opacity:${i ? 0 : 1};`, '', wrap); im.src = FL(k); return im; });
    const o = { a, h, wrap, imgs, tIn: at(a.in?.at ?? a.at, 0), tOut: a.out ? at(a.out.at, end) : 1e9, swaps: (a.swap || []).map(s => at(s.at, .5)),
      moves: (a.move || []).map(m => ({ ...m, t: at(m.at, .5) })), shakes: (a.shake || []).map(s => ({ t: at(s.at, .5), d: s.dur ?? .5 })), hops: (a.hop || []).map(s => at(s, .5)) };
    const typ = a.in?.type || 'up';
    if (typ !== 'none' && !p.cont) EV.push({ t: beat.start + o.tIn, type: typ === 'pop' ? 'pop' : 'whoosh', gain: .45 });
    o.swaps.forEach(t => EV.push({ t: beat.start + t, type: 'pop', gain: .5 }));
    o.shakes.forEach(s => EV.push({ t: beat.start + s.t, type: 'thud', gain: .5 }));
    actors[a.id || a.img] = o;
  });
  // Requisiten / Effekte
  const fx = (p.fx || []).map(f => {
    const layer = f.front === false ? panel : over;
    const n = f.n || 1; const h = f.h ?? 150;
    const items = [...Array(n)].map((_, i) => { const im = el('img', `position:absolute; left:0; top:0; width:${h}px; height:${h}px; opacity:0; z-index:${f.z ?? 5};`, '', layer); im.src = FL(f.img); return im; });
    const t0 = at(f.at, .4), t1 = f.end != null ? at(f.end, end) : end + 1;
    const kind = f.anim || 'pop';
    if (kind === 'fly' || kind === 'stream') for (let i = 0; i < n; i++) EV.push({ t: beat.start + t0 + i * (f.gap ?? .22), type: 'whoosh', gain: .35 });
    else EV.push({ t: beat.start + t0, type: kind === 'stamp' ? 'stamp' : 'pop', gain: .55 });
    return { f, items, h, t0, t1, kind };
  });
  // Sprechblasen
  const bubbles = (p.say || []).map(s => {
    const who = actors[s.who]; const kind = s.kind || 'say';
    const ax = who ? who.a.x + (s.side === 'l' ? -who.h * .28 : who.h * .28) + (s.dx || 0) : (s.x ?? P.w/2);
    const ay = who ? P.h - who.h * .985 + 30 + (s.dy || 0) : (s.y ?? 120);
    const bg = kind === 'shout' ? '#FFD60A' : '#FFFFFF';
    const b = el('div', `position:absolute; left:${ax}px; top:${ay}px; max-width:${s.w ?? 460}px; width:max-content; padding:24px 32px; border-radius:36px; background:${bg}; color:#17181B;
      font-weight:${kind === 'shout' ? 900 : 750}; font-stretch:90%; font-size:${s.size ?? 46}px; line-height:1.1; box-shadow:0 18px 40px rgba(0,0,0,.25); z-index:8; ${kind === 'think' ? 'font-style:italic;' : ''}`, s.text, over);
    const bw = b.offsetWidth, bh = b.offsetHeight;
    const left = s.side === 'l' ? ax - bw + 40 : ax - 40; b.style.left = Math.max(-40, Math.min(P.w + 40 - bw, left)) + 'px'; b.style.top = (ay - bh) + 'px';
    const tailX = ax - parseFloat(b.style.left);
    if (kind === 'think') { [0, 1].forEach(i => el('div', `position:absolute; left:${tailX - 14 + (s.side === 'l' ? 10 : -10) * i}px; top:${bh + 10 + i * 30}px; width:${26 - i * 10}px; height:${26 - i * 10}px; border-radius:50%; background:${bg};`, '', b)); }
    else el('div', `position:absolute; left:${tailX - 20}px; top:${bh - 14}px; width:40px; height:40px; background:${bg}; transform:rotate(45deg); border-radius:6px;`, '', b);
    b.style.transformOrigin = `${tailX}px ${bh + 20}px`;
    const t0 = at(s.at, .3), t1 = s.end != null ? at(s.end, end) : 1e9;
    EV.push({ t: beat.start + t0, type: 'pop', gain: .6 });
    return { b, t0, t1, who };
  });
  // Stempel / Etiketten
  const labels = (p.labels || []).map(l => {
    const tone = { red: ['#E5484D', '#fff'], yellow: ['#FFD60A', '#17181B'], ink: ['#17181B', '#fff'], white: ['#FFFFFF', '#17181B'], outline: ['transparent', '#E5484D'] }[l.tone || 'red'];
    const d = el('div', `position:absolute; left:${l.x}px; top:${l.y}px; padding:${l.pad ?? '16px 30px'}; border-radius:${l.r ?? 22}px; background:${tone[0]}; color:${tone[1]}; ${l.tone === 'outline' ? 'border:7px solid #E5484D;' : ''}
      font-weight:900; font-stretch:${l.stretch ?? 90}%; font-size:${l.size ?? 52}px; line-height:1; white-space:nowrap; transform-origin:50% 50%; z-index:9; box-shadow:${l.tone === 'outline' ? 'none' : '0 16px 36px rgba(0,0,0,.25)'};`, l.text, over);
    if (l.center) d.style.left = (l.x - d.offsetWidth / 2) + 'px';
    const t0 = at(l.at, .4), t1 = l.end != null ? at(l.end, end) : 1e9;
    EV.push({ t: beat.start + t0, type: l.sound || (l.stamp ? 'stamp' : 'pop'), gain: .6 });
    return { d, l, t0, t1, num: l.count };
  });
  return lt => {
    // Bühne
    const a0 = p.cont ? 1 : eo(prog(lt, 0, .5));
    panel.style.transform = over.style.transform = `translateY(${(1 - a0) * 120}px) scale(${.96 + .04 * a0})`; panel.style.opacity = a0;
    // Figuren
    Object.values(actors).forEach(o => {
      const a = o.a, typ = a.in?.type || 'up'; let x = 0, y = 0, sx = 1, sy = 1, r = 0, op = 1;
      const k = typ === 'none' || p.cont && !a.in ? 1 : prog(lt, o.tIn, .55);
      if (typ === 'up') { y = (1 - back(k)) * (o.h * .9); op = k > 0 ? 1 : 0; }
      else if (typ === 'left' || typ === 'right') { x = (1 - eo(k)) * (typ === 'left' ? -1 : 1) * (a.x + o.h); y = -Math.abs(Math.sin(k * Math.PI * 3)) * 26 * (1 - k); op = k > 0 ? 1 : 0; }
      else if (typ === 'pop') { const q = back(k); sx = sy = q; op = clamp(k * 3); }
      if (lt < o.tIn - .01 && typ !== 'none' && !(p.cont && !a.in)) op = 0;
      // Bewegungen
      let mx = 0; o.moves.forEach(m => { mx += (m.x - a.x - mx) * eio(prog(lt, m.t, m.dur ?? .7)); if (lt > m.t && lt < m.t + (m.dur ?? .7)) y -= Math.abs(Math.sin(prog(lt, m.t, m.dur ?? .7) * Math.PI * 4)) * 18; });
      x += mx;
      // Atmen + leichtes Wiegen
      const ph = (a.x || 0) * .01;
      sy *= 1 + Math.sin(lt * 2.4 + ph) * .012; r += Math.sin(lt * 1.3 + ph) * .8;
      o.shakes.forEach(s => { const q = prog(lt, s.t, s.d); if (q > 0 && q < 1) { x += Math.sin(q * 40) * 16 * (1 - q); r += Math.sin(q * 34) * 3 * (1 - q); } });
      o.hops.forEach(t => { const q = prog(lt, t, .45); if (q > 0 && q < 1) { y -= Math.sin(q * Math.PI) * 60; sy *= 1 + Math.sin(q * Math.PI * 2) * .05; } });
      // Gesicht/Pose wechseln
      let cur = 0; o.swaps.forEach((t, i) => { if (lt >= t) cur = i + 1; });
      o.imgs.forEach((im, i) => im.style.opacity = i === cur ? 1 : 0);
      const lastSw = o.swaps.filter(t => lt >= t).pop(); if (lastSw != null) { const q = prog(lt, lastSw, .3); sy *= 1 + Math.sin(q * Math.PI) * .07; sx *= 1 - Math.sin(q * Math.PI) * .04; }
      // Abgang
      if (lt > o.tOut) { const q = eo(prog(lt, o.tOut, .5)); const ot = a.out.type || 'down'; if (ot === 'down') y += q * o.h; else if (ot === 'fade') op *= 1 - q; else x += q * (ot === 'left' ? -1 : 1) * 1100; }
      o.wrap.style.opacity = op; o.wrap.style.transform = `translate(${x}px, ${y}px) rotate(${r}deg) scale(${sx}, ${sy})`;
    });
    // Effekte
    fx.forEach(o => o.items.forEach((im, i) => {
      const f = o.f, t0 = o.t0 + i * (f.gap ?? .22); const q = prog(lt, t0, f.dur ?? .9);
      let x = f.x ?? 400, y = f.y ?? 300, s = 1, r = 0, op = lt >= t0 && lt < o.t1 ? 1 : 0;
      if (o.kind === 'pop' || o.kind === 'stamp') { const b = o.kind === 'stamp' ? lerp(2.2, 1, back(prog(lt, t0, .3))) : back(prog(lt, t0, .45)); s = b; y += Math.sin((lt - t0) * 2.2 + i) * 8; r = (f.rot ?? 0) + Math.sin((lt - t0) * 1.7) * 3; if (o.kind === 'pop') op *= clamp(prog(lt, t0, .15) * 2); }
      else if (o.kind === 'fly' || o.kind === 'stream') { const e = eio(q); const to = f.to || { x: x + 600, y: y - 500 }; const jx = (i % 3 - 1) * 70, jy = (i % 2) * 60; x = lerp(x, to.x + jx, e); y = lerp(y, to.y + jy, e) - Math.sin(e * Math.PI) * (f.arc ?? 160); r = e * (f.spin ?? 140) * (i % 2 ? 1 : -1); s = lerp(1, f.toScale ?? .7, e); op *= q >= 1 && !f.stay ? 0 : clamp(q * 6) * (f.fade === false ? 1 : 1 - Math.max(0, (q - .75) * 4)); }
      else if (o.kind === 'rain') { const yy = ((lt - t0) * (f.speed ?? 500) + i * 170) % (f.range ?? 700); y = (f.y ?? 0) + yy; x = (f.x ?? 100) + (i * 137) % (f.spread ?? 760); op *= lt >= t0 ? .9 : 0; r = Math.sin(lt * 2 + i) * 10; }
      else if (o.kind === 'emote') { const b = back(prog(lt, t0, .35)); s = b; y -= prog(lt, t0, 1.2) * 30; r = Math.sin((lt - t0) * 9) * 8 * (1 - prog(lt, t0, 1)); }
      if (lt > o.t1 - .25 && o.t1 < 1e8 && o.kind !== 'fly') { const z = prog(lt, o.t1 - .25, .25); s *= 1 - z; }
      im.style.opacity = op; im.style.transform = `translate(${x - o.h/2}px, ${y - o.h/2}px) rotate(${r}deg) scale(${s})`;
    }));
    // Sprechblasen
    bubbles.forEach(o => { const k = back(prog(lt, o.t0, .35)); const out = lt > o.t1 ? eo(prog(lt, o.t1, .2)) : 0; o.b.style.opacity = lt < o.t0 ? 0 : clamp(k * 2) * (1 - out); o.b.style.transform = `scale(${k * (1 - out * .3)})`; });
    // Etiketten
    labels.forEach(o => {
      const k = o.l.stamp ? prog(lt, o.t0, .28) : back(prog(lt, o.t0, .4)); const out = lt > o.t1 ? eo(prog(lt, o.t1, .2)) : 0;
      o.d.style.opacity = lt < o.t0 ? 0 : clamp(k * 3) * (1 - out);
      o.d.style.transform = o.l.stamp ? `scale(${lerp(2.4, 1, back(k))}) rotate(${(o.l.rot ?? -8) + (1 - k) * -14}deg)` : `scale(${k}) rotate(${o.l.rot ?? 0}deg)`;
      if (o.num) { const q = eio(prog(lt, o.t0, o.num.dur ?? 1.4)); const v = Math.round(lerp(o.num.from || 0, o.num.to, q) / (o.num.round || 1)) * (o.num.round || 1); o.d.textContent = (o.num.prefix || '') + euro(v); }
    });
  };
};
