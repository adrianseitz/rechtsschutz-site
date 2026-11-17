/* ======================================================================
   Der Moderator: eine stilisierte 3D-Figur von Adrian (nach Foto modelliert) –
   dunkles, nach hinten gekämmtes Haar mit kurzen Seiten, kräftige Brauen, braune Augen, Kinnbart,
   dunkler Anzug, weißes Hemd mit offenem Kragen. Alles wird hier aus Formen berechnet, es gibt keine Modell-Datei.
   Maße: Kopfmitte = Ursprung, Kopfradius ≈ 1. makeAvatar(THREE) → { root, update(state) }
   ====================================================================== */
window.makeAvatar = function (T) {
  const SKIN = 0xe9b896, SKIN_D = 0xd9a07e, HAIR = 0x231913, SUIT = 0x1b2030, LAPEL = 0x283048;
  const ss = (a, b, x) => { x = Math.min(1, Math.max(0, (x - a) / (b - a))); return x * x * (3 - 2 * x); };
  const bump = (x, c, w) => Math.exp(-((x - c) * (x - c)) / (w * w));
  const std = (color, o = {}) => new T.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0, ...o });
  const mesh = (g, m, x = 0, y = 0, z = 0) => { const o = new T.Mesh(g, m); o.position.set(x, y, z); return o; };
  const ball = (m, sx, sy, sz, x = 0, y = 0, z = 0) => { const o = mesh(new T.SphereGeometry(1, 36, 24), m, x, y, z); o.scale.set(sx, sy, sz); return o; };
  // Material, das nur dort zeichnet, wo der Wert „mk“ der Eckpunkte positiv ist (saubere Kanten für Haaransatz, Bart, Revers)
  const masked = (m) => {
    m.side = T.DoubleSide;
    m.onBeforeCompile = (sh) => {
      sh.vertexShader = "attribute float mk;\nvarying float vMk;\n" + sh.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\nvMk = mk;");
      sh.fragmentShader = "varying float vMk;\n" + sh.fragmentShader.replace("#include <clipping_planes_fragment>", "if (vMk < 0.0) discard;\n#include <clipping_planes_fragment>");
    };
    return m;
  };
  const smoothGeo = (g) => { g.deleteAttribute("uv"); g.deleteAttribute("normal"); g = T.mergeVertices(g, 1e-5); g.computeVertexNormals(); return g; };

  /* ---------- Kopf ---------- */
  // Kugel → Kopfform: unten schmaler (Kiefer, Kinn), Gesicht etwas flacher
  const jaw = (sy) => 1 - 0.28 * ss(0.3, 1.0, -sy);
  const headPt = (sx, sy, sz, inflate = 0) => {
    const j = jaw(sy), f = 1 + inflate, t = Math.max(0, -sy);
    return [sx * 0.88 * j * f, sy * (sy < 0 ? 1.2 : 1.04) * f, (sz * (sz > 0 ? 0.88 : 0.96) * (1 - 0.1 * t) + (sz > 0 ? 0.05 * ss(0.5, 0.92, t) * sz : 0)) * f];
  };
  function headGeo(inflate, maskFn, colorFn) {
    const g = new T.SphereGeometry(1, 120, 90), p = g.attributes.position, n = p.count, mk = new Float32Array(n), col = colorFn ? new Float32Array(n * 3) : null, c = new T.Color();
    for (let i = 0; i < n; i++) {
      const sx = p.getX(i), sy = p.getY(i), sz = p.getZ(i), q = headPt(sx, sy, sz, inflate);
      p.setXYZ(i, q[0], q[1], q[2]);
      if (maskFn) mk[i] = maskFn(sx, sy, sz);
      if (colorFn) { colorFn(sx, sy, sz, c); col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
    }
    if (maskFn) g.setAttribute("mk", new T.BufferAttribute(mk, 1));
    if (col) g.setAttribute("color", new T.BufferAttribute(col, 3));
    return smoothGeo(g);
  }
  // Punkt auf der Gesichtsoberfläche zu (x, y)
  const faceZ = (x, y) => { const sy = y / (y < 0 ? 1.2 : 1.04), t = Math.max(0, -sy), sx = x / (0.88 * jaw(sy)), sz = Math.sqrt(Math.max(0, 1 - sx * sx - sy * sy)); return sz * 0.88 * (1 - 0.1 * t) + 0.05 * ss(0.5, 0.92, t) * sz; };

  const skinM = std(SKIN, { roughness: 0.55, emissive: 0x8a2f12, emissiveIntensity: 0.1 });
  const head = new T.Group(), skull = mesh(headGeo(0), skinM); head.add(skull);
  [-1, 1].forEach((s) => { head.add(ball(skinM, 0.13, 0.23, 0.17, s * 0.875, -0.06, -0.05), ball(std(SKIN_D), 0.055, 0.12, 0.08, s * 0.93, -0.06, 0.0)); });

  // Haaransatz: Höhe je nach Richtung (vorn hoch, Geheimratsecken, Koteletten, hinten tief im Nacken)
  const hairline = (a) => {
    let h = 0.60 + 0.06 * bump(a, 0.72, 0.28);
    h = h + (0.14 - h) * ss(0.92, 1.22, a);
    h -= 0.26 * bump(a, 1.3, 0.11);
    return h + (-0.46 - h) * ss(1.7, 2.25, a);
  };
  const hairMask = (sx, sy, sz) => sy - hairline(Math.abs(Math.atan2(sx, sz)));
  const cSkin = new T.Color(SKIN), cHair = new T.Color(HAIR);
  // Seiten kurz rasiert: unten schimmert die Haut durch (Übergang)
  const hairCap = mesh(headGeo(0.022, hairMask, (sx, sy, sz, c) => { const a = Math.abs(Math.atan2(sx, sz)), side = ss(0.9, 1.3, a), up = ss(-0.1, 0.5, sy); c.copy(cSkin).lerp(cHair, 0.72 + 0.28 * Math.max(up, 1 - side)); }), masked(std(0xffffff, { vertexColors: true, roughness: 0.75 })));
  head.add(hairCap);
  // Deckhaar: Volumen, nach hinten und leicht zur Seite gekämmt, mit Strähnen
  const top = (() => {
    const g = new T.SphereGeometry(1, 96, 64), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const ux = p.getX(i), uy = p.getY(i), uz = p.getZ(i);
      const ridge = 0.03 * Math.sin(ux * 17 + uz * 1.6 + Math.sin(uz * 2.6) * 0.9) * ss(-0.15, 0.35, uy), r = 1 + ridge;
      let x = ux * 0.69 * r, y = uy * 0.4 * r, z = uz * 0.86 * r;
      y += 0.2 * ss(-0.2, 0.9, uz) * ss(-0.4, 0.5, uy);        // vorn höher (Tolle)
      y -= 0.12 * ss(0.1, 1, -uz);                             // hinten flacher
      z -= 0.12 * ss(0.0, 1, uy) * ss(0.2, 1, uz);             // oben nach hinten gekämmt
      x += 0.07 * Math.max(0, uy) * ss(-0.5, 0.8, uz);         // leicht zur Seite
      x *= 1 - 0.08 * ss(0.3, 1, uz);
      p.setXYZ(i, x, y, z);
    }
    const m = mesh(smoothGeo(g), std(HAIR, { roughness: 0.5 }), 0.015, 0.76, -0.1); m.rotation.set(0.06, 0, -0.04); return m;
  })();
  head.add(top);

  // Bart: Kinn und Kieferlinie bis zu den Koteletten, dazu ein dezenter Oberlippenbart
  const beardMask = (sx, sy, sz) => {
    const chin = Math.min(-0.775 + 0.34 * sx * sx - sy + 0.05 * bump(sx, 0, 0.28), sz + 0.25);                       // Kinn und Unterkante
    const strap = Math.min(0.4 - sz, sz - (0.4 - 0.26 * ss(0.05, 0.6, -sy)), -0.1 - sy);                             // schmale Linie am Kiefer bis zu den Koteletten
    return Math.max(chin, strap);
  };
  head.add(mesh(headGeo(0.018, beardMask), masked(std(0x2b1e17, { roughness: 0.85 }))));

  // Augen
  const whiteM = std(0xffffff, { roughness: 0.2, emissive: 0xffffff, emissiveIntensity: 0.32 }), irisM = std(0x6b4322, { roughness: 0.25, emissive: 0x3a2008, emissiveIntensity: 0.5 }), darkM = std(0x140d0a, { roughness: 0.3 }), browM = std(0x23170f, { roughness: 0.8 });
  const glintM = new T.MeshBasicMaterial({ color: 0xffffff });
  const eyes = [-1, 1].map((s) => {
    const e = new T.Group(), x = s * 0.325, y = 0.06; e.position.set(x, y, faceZ(x, y) - 0.04); e.rotation.y = s * 0.2; e.scale.set(0.15, 0.16, 0.09);
    const iris = new T.Group(); iris.add(ball(irisM, 0.6, 0.6, 0.3, 0, 0, 0.82), ball(darkM, 0.32, 0.32, 0.2, 0, 0, 1.02), ball(glintM, 0.14, 0.14, 0.1, 0.2, 0.24, 1.14));
    const lid = new T.Group(), rimM = darkM;
    lid.add(mesh(new T.SphereGeometry(1.07, 36, 18, 0, Math.PI * 2, 0, Math.PI / 2), skinM)); const rim = mesh(new T.TorusGeometry(1.07, 0.085, 8, 40), rimM); rim.rotation.x = Math.PI / 2; lid.add(rim);
    e.add(ball(whiteM, 1, 1, 1), iris, lid); e.userData = { iris, lid }; head.add(e); return e;
  });
  const brows = [-1, 1].map((s) => { const x = s * 0.335, y = 0.315, b = mesh(new T.CapsuleGeometry(0.045, 0.3, 6, 14), browM, x, y, faceZ(x, y) + 0.02); b.scale.set(1, 1, 0.6); b.rotation.set(0, s * 0.32, Math.PI / 2 - s * 0.1); head.add(b); return b; });
  // Nase, Mund
  head.add(ball(std(0xe3ad8a, { roughness: 0.5, emissive: 0x8a2f12, emissiveIntensity: 0.12 }), 0.072, 0.1, 0.105, 0, -0.21, faceZ(0, -0.21) + 0.01));
  const MY = -0.55, MZ = faceZ(0, MY);
  const lipM = std(0x7c3b30, { roughness: 0.5 });
  const smile = mesh(new T.TorusGeometry(0.3, 0.022, 10, 28, Math.PI * 0.44), lipM, 0, MY + 0.27, MZ + 0.0); smile.rotation.z = Math.PI + Math.PI * 0.28;
  const flat = mesh(new T.CapsuleGeometry(0.02, 0.2, 4, 10), lipM, 0, MY, MZ + 0.012); flat.rotation.z = Math.PI / 2;
  const mouth = ball(std(0x5a1512, { roughness: 0.4 }), 0.15, 0.08, 0.05, 0, MY, MZ - 0.012);
  const teeth = ball(std(0xffffff, { roughness: 0.3, emissive: 0xffffff, emissiveIntensity: 0.3 }), 0.11, 0.03, 0.03, 0, MY, MZ + 0.008);
  const tongue = ball(std(0xe2695f), 0.08, 0.035, 0.03, 0, MY, MZ + 0.006);
  head.add(smile, flat, mouth, teeth, tongue);
  [-1, 1].forEach((s) => { const x = s * 0.5, y = -0.28, c = new T.Mesh(new T.CircleGeometry(0.15, 28), new T.MeshBasicMaterial({ color: 0xf08a6a, transparent: true, opacity: 0.12, depthWrite: false })); c.position.set(x, y, faceZ(x, y) + 0.012); c.rotation.y = s * 0.5; head.add(c); });

  /* ---------- Körper: Anzug, Hemd, Arme ---------- */
  const body = new T.Group(), TY = -2.86;
  const torsoPt = (sx, sy, sz, inflate = 0) => {
    const pw = (v, e) => Math.sign(v) * Math.pow(Math.abs(v), e), f = 1 + inflate;
    let x = pw(sx, 0.55) * 1.34, y = pw(sy, 0.5) * 1.4, z = pw(sz, 0.75) * 0.6;
    if (y > 0) y -= 0.07 * x * x * ss(0, 1, y);      // leicht abfallende Schultern
    x *= 1 - 0.26 * ss(0.5, -1.3, y);                // Taille
    return [x * f, y * f, z * f];
  };
  function torsoGeo(inflate, maskFn) {
    const g = new T.SphereGeometry(1, 120, 80), p = g.attributes.position, mk = new Float32Array(p.count);
    for (let i = 0; i < p.count; i++) { const q = torsoPt(p.getX(i), p.getY(i), p.getZ(i), inflate); if (maskFn) mk[i] = maskFn(q[0], q[1], q[2]); p.setXYZ(i, q[0], q[1], q[2]); }
    if (maskFn) g.setAttribute("mk", new T.BufferAttribute(mk, 1));
    return smoothGeo(g);
  }
  const VT = 1.4, VB = -0.35, vw = (y) => 0.46 * Math.min(1.1, Math.max(0, (y - VB) / (VT - VB)));   // V-Ausschnitt des Sakkos
  const suitM = std(SUIT, { roughness: 0.72 }), shirtM = std(0xffffff, { roughness: 0.55, emissive: 0xffffff, emissiveIntensity: 0.12 });
  body.add(mesh(torsoGeo(-0.012), shirtM, 0, TY, 0));
  body.add(mesh(torsoGeo(0.012, (x, y, z) => (z < 0.05 ? 1 : Math.abs(x) - vw(y))), masked(suitM), 0, TY, 0));
  body.add(mesh(torsoGeo(0.03, (x, y, z) => { const d = Math.abs(x) - vw(y); return Math.min(d + 0.005, 0.14 + 0.2 * ss(VB, VT - 0.4, y) - d, y - VB - 0.02, 1.02 - y + 0.9 * (Math.abs(x) - vw(y)), z - 0.05); }), masked(std(LAPEL, { roughness: 0.55 })), 0, TY, 0));
  body.add(mesh(new T.CylinderGeometry(0.34, 0.4, 0.75, 40), std(SKIN_D, { roughness: 0.6, emissive: 0x8a2f12, emissiveIntensity: 0.08 }), 0, -1.32, -0.08));
  [-1, 1].forEach((s) => {   // Hemdkragen, offen: zwei Flügel, die vom Hals auf die Brust fallen
    const sh = new T.Shape(); sh.moveTo(0.03, 0.02); sh.lineTo(0.43, 0.0); sh.lineTo(0.47, -0.16); sh.lineTo(0.24, -0.56); sh.closePath();
    const c = mesh(new T.ExtrudeGeometry(sh, { depth: 0.04, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 3 }), shirtM, 0, TY + 1.44, 0.5); c.scale.x = s; c.rotation.x = -0.42; body.add(c);
    body.add(ball(suitM, 0.235, 0.235, 0.26, s * 1.17, TY + 0.99, 0));   // Schultergelenk, liegt fast ganz im Sakko
  });
  [0, 1].forEach((i) => body.add(ball(std(0xd9dbe2, { roughness: 0.3 }), 0.035, 0.035, 0.02, 0, TY + 0.62 - i * 0.42, 0.62)));
  const btn = ball(std(0x0c0d12, { roughness: 0.3 }), 0.06, 0.06, 0.03, 0, TY - 0.5, 0.66); body.add(btn);

  const sleeveM = std(SUIT, { roughness: 0.72 }), cuffM = shirtM;
  const arms = [-1, 1].map((s) => {
    const hand = new T.Group(); hand.add(ball(skinM, 0.2, 0.21, 0.1, 0, 0.04, 0));   // offene Hand: Handfläche, vier Finger, Daumen
    [[-0.135, 0.19, 0.2], [-0.045, 0.24, 0.07], [0.045, 0.23, -0.05], [0.13, 0.17, -0.2]].forEach(([fx, len, rot]) => { const f = mesh(new T.CapsuleGeometry(0.05, len, 4, 10), skinM, fx * 1.05 - Math.sin(rot) * 0.1, 0.2 + len / 2, 0.01); f.rotation.z = rot * 0.9; hand.add(f); });
    const th = mesh(new T.CapsuleGeometry(0.055, 0.16, 4, 10), skinM, -s * 0.22, 0.1, 0.04); th.rotation.z = s * 0.95; hand.add(th);
    const cuff = mesh(new T.CylinderGeometry(0.2, 0.2, 0.12, 28), cuffM);
    body.add(hand, cuff); return { s, hand, cuff, tube: null };
  });

  const root = new T.Group(); root.add(body, head);

  /* ---------- Bewegung ---------- */
  const POSE = {   // Hände [links im Bild, rechts im Bild], Kopfmitte = 0
    rest: [[-1.55, -3.9, 0.3], [1.55, -3.9, 0.3]],
    present: [[-2.0, -1.75, 0.9], [1.55, -3.9, 0.3]],
    explain: [[-1.55, -2.35, 1.1], [1.55, -2.35, 1.1]],
    up: [[-1.55, -3.9, 0.3], [1.5, -0.85, 0.95]],
    point: [[-1.9, -0.75, 0.8], [1.55, -3.9, 0.3]],
    wave: [[-1.55, -3.9, 0.3], [1.72, -0.5, 0.7]],
    cheer: [[-1.8, -0.2, 0.5], [1.7, -0.2, 0.5]],
  };
  const FACE = { happy: { brow: 0.0, by: 0, lid: -0.16, mouth: "smile" }, proud: { brow: -0.04, by: 0.03, lid: -0.1, mouth: "smile" }, worried: { brow: 0.34, by: 0.05, lid: -0.22, mouth: "flat" }, wow: { brow: 0.1, by: 0.1, lid: -0.34, mouth: "o" } };
  const v3 = (a) => new T.Vector3(a[0], a[1], a[2]);
  /* state: { t, hands: [Vector3, Vector3], brow, by, mouthType, open (0..1), look: [x, y], nod, tilt, turn, blink } */
  function update(st) {
    const o = st.open || 0, talking = o > 0.06, t = st.t;
    arms.forEach((a, n) => {
      const L1 = 1.15, L2 = 1.05, sh = new T.Vector3(a.s * 1.17, TY + 0.99, 0), h = st.hands[n].clone(), d0 = h.clone().sub(sh), max = L1 + L2 - 0.02;
      if (d0.length() > max) h.copy(sh).addScaledVector(d0.normalize(), max);
      const dv = h.clone().sub(sh), d = dv.length(), dirA = dv.clone().normalize(), al = (L1 * L1 - L2 * L2 + d * d) / (2 * d), hg = Math.sqrt(Math.max(0, L1 * L1 - al * al));
      const hint = new T.Vector3(a.s * 0.75, -1, -0.45), perp = hint.addScaledVector(dirA, -hint.dot(dirA)).normalize(), elbow = sh.clone().addScaledVector(dirA, al).addScaledVector(perp, hg);
      const dir = h.clone().sub(elbow).normalize(), wrist = h.clone().addScaledVector(dir, -0.2), ctrl = elbow.clone().multiplyScalar(2).addScaledVector(sh.clone().add(wrist), -0.5);
      if (a.tube) { body.remove(a.tube); a.tube.geometry.dispose(); }
      a.tube = mesh(new T.TubeGeometry(new T.QuadraticBezierCurve3(sh, ctrl, wrist), 24, 0.22, 14), sleeveM); body.add(a.tube);
      a.cuff.position.copy(wrist).addScaledVector(dir, 0.04); a.cuff.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), dir);
      a.hand.position.copy(h); a.hand.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), dir);
    });
    brows.forEach((b, n) => { const s = n ? 1 : -1; b.rotation.z = Math.PI / 2 - s * (0.1 + st.brow); b.position.y = 0.315 + st.by + (talking ? o * 0.02 : 0); });
    const blink = st.blink;
    eyes.forEach((e) => { e.userData.iris.position.set(st.look[0] * 6, st.look[1] * 6, 0); e.userData.lid.rotation.x = blink ? 1.25 : -0.52 + (st.lid || 0); });
    smile.visible = !talking && st.mouthType === "smile"; flat.visible = !talking && st.mouthType === "flat";
    mouth.visible = talking || st.mouthType === "o"; teeth.visible = talking && o > 0.25; tongue.visible = talking && o > 0.55;
    const oo = talking ? o : 0.5, mw = talking ? 0.15 + o * 0.035 : 0.09, mh = 0.028 + oo * 0.12;
    mouth.scale.set(mw, mh, 0.05); teeth.scale.set(mw * 0.74, 0.026, 0.03); teeth.position.y = MY + mh * 0.6; tongue.scale.set(mw * 0.55, 0.03, 0.03); tongue.position.y = MY - mh * 0.55;
    // Kopf: nicken, neigen, drehen – um den Halsansatz
    head.rotation.set(st.nod, st.turn, st.tilt); head.position.set(0, 1, 0).applyEuler(head.rotation).add(new T.Vector3(0, -1, 0)); head.position.y += o * 0.012;
    body.rotation.set(0, st.turn * 0.35, st.tilt * 0.25); body.position.y = Math.sin(t * 1.9) * 0.012;
  }
  return { root, update, POSE, FACE, v3 };
};
