#!/usr/bin/env python3
"""Figur für die 3D-Videos vorbereiten: aus den Bildern der Bild-KI (grüner Hintergrund) wird ein Figuren-Satz.

    python3 figur/vorbereiten.py <ordner-mit-bildern> [--out figur/kit] [--vorschau vorschau.jpg]

Erwartete Dateien im Ordner (png/jpg/webp, Groß-/Kleinschreibung egal):
    basis          Grundbild: Mund zu, Augen offen          (Pflicht)
    mund-halb      dasselbe, Mund leicht offen              (Pflicht)
    mund-offen     dasselbe, Mund weit offen                (Pflicht)
    augen-zu       dasselbe, Augen geschlossen              (empfohlen)
    zeigt, daumen, erschrocken, nachdenklich, winkt         Gesten (optional)

Was passiert:
  1. Grün freistellen (Abstand zur Hintergrundfarbe, Grünstich an den Rändern entfernen, Löcher füllen).
  2. Die Varianten exakt auf das Grundbild ausrichten (die KI verschiebt Bilder oft um ein paar Pixel).
  3. Aus den Varianten nur den Bereich ausschneiden, der sich wirklich ändert (Mund, Augen), mit weichem Rand.
     So zittert die Figur beim Sprechen nicht, auch wenn die KI sonst minimal anders gezeichnet hat.
  4. Gesten am Kopf ausrichten, damit die Figur beim Wechsel nicht springt.
  5. kit.js schreiben: Bildnamen, Lage der Ausschnitte, Kopfmitte und -größe.
"""
import argparse
import json
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

SIZE = 1024
NAMES = ["basis", "mund-halb", "mund-offen", "augen-zu", "zeigt", "daumen", "erschrocken", "nachdenklich", "winkt"]
VARIANTS = {"mund-halb": "mund", "mund-offen": "mund", "augen-zu": "augen"}
POSES = ["zeigt", "daumen", "erschrocken", "nachdenklich", "winkt"]


def load(folder: Path):
    found = {}
    for f in sorted(folder.iterdir()):
        stem = f.stem.lower().replace("_", "-").replace(" ", "-")
        if f.suffix.lower() in (".png", ".jpg", ".jpeg", ".webp") and stem in NAMES:
            im = Image.open(f).convert("RGB")
            w, h = im.size                      # auf ein Quadrat bringen (mittig zuschneiden), dann 1024 px
            s = min(w, h)
            im = im.crop(((w - s) // 2, (h - s) // 2, (w - s) // 2 + s, (h - s) // 2 + s)).resize((SIZE, SIZE), Image.LANCZOS)
            found[stem] = np.asarray(im).astype(np.float32)
    return found


def key_green(rgb):
    """Grünen Hintergrund entfernen → (RGB ohne Grünstich, Alpha 0..1)"""
    h, w, _ = rgb.shape
    b = max(4, h // 50)
    border = np.concatenate([rgb[:b].reshape(-1, 3), rgb[-b:].reshape(-1, 3), rgb[:, :b].reshape(-1, 3), rgb[:, -b:].reshape(-1, 3)])
    bg = np.median(border, axis=0)
    ycc = cv2.cvtColor(rgb.astype(np.uint8), cv2.COLOR_RGB2YCrCb).astype(np.float32)
    bg_ycc = cv2.cvtColor(bg.reshape(1, 1, 3).astype(np.uint8), cv2.COLOR_RGB2YCrCb).astype(np.float32)[0, 0]
    dist = np.hypot(ycc[..., 1] - bg_ycc[1], ycc[..., 2] - bg_ycc[2])          # Farbabstand ohne Helligkeit
    # Streuung des Hintergrunds nur aus Randpixeln, die wirklich Hintergrund sind (die Figur berührt meist den unteren Rand)
    bd = np.hypot(*(cv2.cvtColor(border.reshape(-1, 1, 3).astype(np.uint8), cv2.COLOR_RGB2YCrCb).astype(np.float32)[:, 0, 1:] - bg_ycc[1:]).T)
    near = bd[bd < 30]
    spread = float(np.percentile(near, 99)) if near.size else 8.0
    t0, t1 = spread + 6, spread + 30
    alpha = np.clip((dist - t0) / (t1 - t0), 0, 1)
    # nur die Figur behalten (größte zusammenhängende Fläche + alles Größere, das daran hängt)
    solid = alpha > 0.5
    lab, n = ndi.label(solid)
    if n:
        sizes = ndi.sum(solid, lab, range(1, n + 1))
        keep = np.isin(lab, [i + 1 for i, s in enumerate(sizes) if s >= sizes.max() * 0.004])
        alpha = alpha * ndi.binary_dilation(keep, iterations=3)
        # kleine Löcher füllen (grüne Spiegelungen im Hemd), große Lücken (z. B. zwischen Arm und Körper) bleiben frei
        holes = ndi.binary_fill_holes(keep) & ~keep
        hl, hn = ndi.label(holes)
        if hn:
            hs = ndi.sum(holes, hl, range(1, hn + 1))
            small = np.isin(hl, [i + 1 for i, s in enumerate(hs) if s < SIZE * SIZE * 0.002])
            alpha = np.maximum(alpha, small.astype(np.float32))
    alpha = cv2.GaussianBlur(alpha, (0, 0), 0.7)
    # Grünstich entfernen (Haut, Anzug und Hemd haben kein dominantes Grün)
    out = rgb.copy()
    lim = np.maximum(out[..., 0], out[..., 2])
    out[..., 1] = np.minimum(out[..., 1], lim + 6)
    return out, np.clip(alpha, 0, 1)


def align(ref_gray, img_gray, region=None, motion=cv2.MOTION_AFFINE):
    """Verschiebung/Skalierung von img auf ref schätzen (ECC), Rückgabe 2x3-Matrix"""
    scale = 0.5
    r = cv2.resize(ref_gray, None, fx=scale, fy=scale)
    i = cv2.resize(img_gray, None, fx=scale, fy=scale)
    mask = None
    if region is not None:
        mask = cv2.resize(region.astype(np.uint8), None, fx=scale, fy=scale, interpolation=cv2.INTER_NEAREST)
    warp = np.eye(2, 3, dtype=np.float32)
    try:
        _, warp = cv2.findTransformECC(r, i, warp, motion, (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 200, 1e-6), mask, 5)
    except cv2.error:
        (dx, dy), _ = cv2.phaseCorrelate(r, i)
        warp = np.array([[1, 0, dx], [0, 1, dy]], np.float32)
    warp[:, 2] /= scale
    return warp


def warp_img(arr, warp):
    flags = cv2.INTER_LINEAR | cv2.WARP_INVERSE_MAP
    return cv2.warpAffine(arr, warp, (SIZE, SIZE), flags=flags, borderMode=cv2.BORDER_REPLICATE)


def head_of(alpha):
    """Kopfmitte und Kopfradius aus dem Umriss: oben schmal (Kopf), dann breit (Schultern)."""
    solid = alpha > 0.5
    rows = np.where(solid.any(axis=1))[0]
    top = rows[0]
    widths = solid.sum(axis=1)
    span = rows[-1] - top
    head_w = np.median(widths[top + int(span * 0.08): top + int(span * 0.2)])
    shoulder = top + int(span * 0.2)
    while shoulder < rows[-1] and widths[shoulder] < head_w * 1.55:
        shoulder += 1
    neck_band = range(top + int(span * 0.15), max(top + int(span * 0.16), shoulder))
    chin = min(neck_band, key=lambda y: widths[y]) if len(neck_band) else shoulder
    cols = np.where(solid[top:chin].any(axis=0))[0]
    cx = float((cols[0] + cols[-1]) / 2) if len(cols) else SIZE / 2
    return {"x": round(cx), "y": round((top + chin) / 2), "r": round(max(chin - top, head_w) / 2), "top": int(top), "kinn": int(chin)}


def patch(base_rgb, base_a, var_rgb, var_a, head, kind):
    """Bereich, in dem sich die Variante unterscheidet, mit weichem Rand ausschneiden"""
    diff = np.abs(var_rgb - base_rgb).sum(axis=2) * np.minimum(base_a, var_a)
    zone = np.zeros_like(diff, bool)                 # nur im Kopf suchen; Mund: untere Gesichtshälfte, Augen: mittleres Drittel
    y0, y1 = (head["y"] - head["r"] * 0.05, head["kinn"] + head["r"] * 0.05) if kind == "mund" else (head["y"] - head["r"] * 0.65, head["y"] + head["r"] * 0.3)
    zone[int(max(0, y0)):int(min(SIZE, y1)), int(max(0, head["x"] - head["r"] * 1.1)):int(min(SIZE, head["x"] + head["r"] * 1.1))] = True
    m = (diff > 55) & zone
    m = ndi.binary_opening(m, iterations=2)
    lab, n = ndi.label(m)
    if not n:
        return None
    sizes = ndi.sum(m, lab, range(1, n + 1))
    m = np.isin(lab, [i + 1 for i, s in enumerate(sizes) if s >= max(40, sizes.max() * 0.05)])
    soft = ndi.binary_dilation(m, iterations=10).astype(np.float32)
    soft = cv2.GaussianBlur(soft, (0, 0), 6)
    soft = np.clip(soft * 1.4, 0, 1)
    ys, xs = np.where(soft > 0.01)
    x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    a = (soft * var_a)[y0:y1, x0:x1]
    rgba = np.dstack([var_rgb[y0:y1, x0:x1], a * 255]).clip(0, 255).astype(np.uint8)
    share = float(m.sum()) / max(1, float((base_a > 0.5).sum()))
    return rgba, {"x": int(x0), "y": int(y0), "w": int(x1 - x0), "h": int(y1 - y0), "anteil": round(share, 4)}


def save_rgba(path, rgb, alpha):
    Image.fromarray(np.dstack([rgb, alpha * 255]).clip(0, 255).astype(np.uint8), "RGBA").save(path, optimize=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("ordner", type=Path)
    ap.add_argument("--out", type=Path, default=Path(__file__).resolve().parent / "kit")
    ap.add_argument("--vorschau", type=Path)
    args = ap.parse_args()
    imgs = load(args.ordner)
    missing = [n for n in ("basis", "mund-halb", "mund-offen") if n not in imgs]
    if missing:
        sys.exit(f"Es fehlen: {', '.join(missing)}")
    args.out.mkdir(parents=True, exist_ok=True)
    for f in args.out.glob("*.png"):
        f.unlink()

    keyed = {n: key_green(rgb) for n, rgb in imgs.items()}
    base_rgb, base_a = keyed["basis"]
    head = head_of(base_a)
    gray = lambda rgb, a: (cv2.cvtColor(rgb.astype(np.uint8), cv2.COLOR_RGB2GRAY).astype(np.float32) / 255) * a + (1 - a) * 0.5
    base_gray = gray(base_rgb, base_a)
    kit = {"size": SIZE, "kopf": head, "bilder": {}, "ausschnitte": {}, "hinweise": []}
    save_rgba(args.out / "basis.png", base_rgb, base_a)
    kit["bilder"]["basis"] = "basis.png"
    bottom = int(np.where((base_a > 0.5).any(axis=1))[0][-1])
    kit["unten"] = bottom

    for name, kind in VARIANTS.items():
        if name not in keyed:
            continue
        rgb, a = keyed[name]
        warp = align(base_gray, gray(rgb, a))
        rgb_w, a_w = warp_img(rgb, warp), warp_img(a, warp)
        res = patch(base_rgb, base_a, rgb_w, a_w, head, kind)
        if res is None:
            kit["hinweise"].append(f"{name}: kein Unterschied zum Grundbild gefunden")
            continue
        rgba, box = res
        Image.fromarray(rgba, "RGBA").save(args.out / f"{name}.png", optimize=True)
        kit["ausschnitte"][name] = {"datei": f"{name}.png", **box, "verschiebung": [round(float(warp[0, 2]), 1), round(float(warp[1, 2]), 1)]}
        if box["anteil"] > 0.08:
            kit["hinweise"].append(f"{name}: die KI hat mehr als Mund/Augen geändert ({box['anteil']:.0%} der Figur) – Bild evtl. neu erzeugen")

    head_zone = np.zeros((SIZE, SIZE), np.uint8)
    head_zone[max(0, head["top"] - 20):head["kinn"] + 10, max(0, head["x"] - head["r"] * 2):min(SIZE, head["x"] + head["r"] * 2)] = 1
    for name in POSES:
        if name not in keyed:
            continue
        rgb, a = keyed[name]
        warp = align(base_gray, gray(rgb, a), region=head_zone, motion=cv2.MOTION_TRANSLATION)
        save_rgba(args.out / f"{name}.png", warp_img(rgb, warp), np.clip(warp_img(a, warp), 0, 1))
        kit["bilder"][name] = f"{name}.png"

    (args.out / "kit.js").write_text("// erzeugt von figur/vorbereiten.py – nicht von Hand ändern\nwindow.FIGUR = " + json.dumps(kit, ensure_ascii=False, indent=1) + ";\n", encoding="utf-8")
    print(json.dumps({k: v for k, v in kit.items() if k != "bilder"} | {"bilder": list(kit["bilder"])}, ensure_ascii=False, indent=1))

    if args.vorschau:                                # Kontrollbild: alles auf Schachbrett, Ausschnitte rot umrandet
        tiles = []
        check = ((np.indices((SIZE, SIZE)).sum(axis=0) // 32) % 2 * 40 + 200).astype(np.float32)[..., None].repeat(3, axis=2)
        for name in ["basis", *VARIANTS, *POSES]:
            if name in kit["bilder"]:
                im = np.asarray(Image.open(args.out / kit["bilder"][name]).convert("RGBA")).astype(np.float32)
            elif name in kit["ausschnitte"]:
                b = kit["ausschnitte"][name]
                im = np.dstack([base_rgb, base_a * 255]).astype(np.float32)
                p = np.asarray(Image.open(args.out / b["datei"])).astype(np.float32)
                al = p[..., 3:] / 255
                im[b["y"]:b["y"] + b["h"], b["x"]:b["x"] + b["w"], :3] = im[b["y"]:b["y"] + b["h"], b["x"]:b["x"] + b["w"], :3] * (1 - al) + p[..., :3] * al
                cv2.rectangle(im, (b["x"], b["y"]), (b["x"] + b["w"], b["y"] + b["h"]), (255, 0, 0, 255), 3)
            else:
                continue
            a = im[..., 3:] / 255
            comp = check * (1 - a) + im[..., :3] * a
            cv2.circle(comp, (head["x"], head["y"]), head["r"], (0, 120, 255), 2)
            tiles.append(cv2.resize(comp, (320, 320)))
        Image.fromarray(np.hstack(tiles).clip(0, 255).astype(np.uint8)).save(args.vorschau, quality=88)


if __name__ == "__main__":
    main()
