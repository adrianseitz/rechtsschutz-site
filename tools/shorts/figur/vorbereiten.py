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
  5. kit.js und kit.json schreiben: Bildnamen, Lage der Ausschnitte, Kopfmitte und -größe.

Braucht nur numpy, scipy und Pillow (auf dem Server: python3-numpy, python3-scipy, python3-pil).
"""
import argparse
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
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


def ycc(rgb):
    """RGB → (Y, Cr, Cb) wie in der Videotechnik"""
    y = rgb[..., 0] * 0.299 + rgb[..., 1] * 0.587 + rgb[..., 2] * 0.114
    return np.stack([y, (rgb[..., 0] - y) * 0.713 + 128, (rgb[..., 2] - y) * 0.564 + 128], axis=-1)


def key_green(rgb):
    """Grünen Hintergrund entfernen → (RGB ohne Grünstich, Alpha 0..1)"""
    h, w, _ = rgb.shape
    b = max(4, h // 50)
    border = np.concatenate([rgb[:b].reshape(-1, 3), rgb[-b:].reshape(-1, 3), rgb[:, :b].reshape(-1, 3), rgb[:, -b:].reshape(-1, 3)])
    bg = np.median(border, axis=0)
    bg_ycc = ycc(bg.reshape(1, 3))[0]
    c = ycc(rgb)
    dist = np.hypot(c[..., 1] - bg_ycc[1], c[..., 2] - bg_ycc[2])          # Farbabstand ohne Helligkeit
    # Streuung des Hintergrunds nur aus Randpixeln, die wirklich Hintergrund sind (die Figur berührt meist den unteren Rand)
    bc = ycc(border)
    bd = np.hypot(bc[:, 1] - bg_ycc[1], bc[:, 2] - bg_ycc[2])
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
    alpha = ndi.gaussian_filter(alpha, 0.7)
    # Grünstich entfernen (Haut, Anzug und Hemd haben kein dominantes Grün)
    out = rgb.copy()
    lim = np.maximum(out[..., 0], out[..., 2])
    out[..., 1] = np.minimum(out[..., 1], lim + 6)
    return out, np.clip(alpha, 0, 1)


def head_width(alpha):
    """Oberkante und Kopfbreite (Mittel der Zeilen 8–20 % unter dem Scheitel) – unabhängig vom Mund"""
    solid = alpha > 0.5
    rows = np.where(solid.any(axis=1))[0]
    top, span = rows[0], rows[-1] - rows[0]
    return int(top), float(np.median(solid.sum(axis=1)[top + int(span * 0.08): top + int(span * 0.2)]))


def phase_shift(a, b, window=None):
    """Verschiebung d (dy, dx), um die b gegenüber a verschoben ist (Phasenkorrelation, auf Subpixel genau)"""
    h, w = a.shape
    win = np.outer(np.hanning(h), np.hanning(w)) if window is None else window
    A, B = np.fft.fft2((a - a.mean()) * win), np.fft.fft2((b - b.mean()) * win)
    R = np.conj(A) * B
    r = np.fft.ifft2(R / (np.abs(R) + 1e-9)).real
    py, px = np.unravel_index(np.argmax(r), r.shape)
    def sub(c, l, rr):
        d = l - 2 * c + rr
        return 0.0 if abs(d) < 1e-12 else 0.5 * (l - rr) / d
    dy = py + sub(r[py, px], r[py - 1, px], r[(py + 1) % h, px])
    dx = px + sub(r[py, px], r[py, px - 1], r[py, (px + 1) % w])
    if dy > h / 2: dy -= h
    if dx > w / 2: dx -= w
    return float(dy), float(dx)


def align(base_gray, base_a, img_gray, img_a, region=None, scale=True):
    """Ausrichtung (Maßstab aus der Kopfbreite, Verschiebung per Phasenkorrelation) → (s, dy, dx)"""
    s = 1.0
    if scale:
        _, wb = head_width(base_a)
        _, wi = head_width(img_a)
        s = float(np.clip(wb / max(wi, 1), 0.9, 1.1))
        if abs(s - 1) < 0.006:
            s = 1.0
    g = warp_img(img_gray, (s, 0.0, 0.0))
    f = 0.5                                          # auf halber Größe rechnen
    small = lambda x: ndi.zoom(x, f, order=1)
    win = None
    if region is not None:
        win = ndi.gaussian_filter(small(region.astype(np.float32)), 6)
    dy, dx = phase_shift(small(base_gray), small(g), win)
    return s, dy / f, dx / f


def warp_img(arr, t):
    """Bild so verschieben/skalieren, dass es aufs Grundbild passt: aligned(out) = img(c + (out + d − c) / s)"""
    s, dy, dx = t
    c = SIZE / 2
    off = [c * (1 - 1 / s) + dy / s, c * (1 - 1 / s) + dx / s]
    one = lambda ch: ndi.affine_transform(ch, [1 / s, 1 / s], offset=off, order=1, mode="nearest")
    if arr.ndim == 2:
        return one(arr)
    return np.stack([one(arr[..., i]) for i in range(arr.shape[2])], axis=-1)


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
    soft = ndi.gaussian_filter(soft, 6)
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
    gray = lambda rgb, a: ((rgb[..., 0] * 0.299 + rgb[..., 1] * 0.587 + rgb[..., 2] * 0.114) / 255) * a + (1 - a) * 0.5
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
        warp = align(base_gray, base_a, gray(rgb, a), a)
        rgb_w, a_w = warp_img(rgb, warp), np.clip(warp_img(a, warp), 0, 1)
        res = patch(base_rgb, base_a, rgb_w, a_w, head, kind)
        if res is None:
            kit["hinweise"].append(f"{name}: kein Unterschied zum Grundbild gefunden")
            continue
        rgba, box = res
        Image.fromarray(rgba, "RGBA").save(args.out / f"{name}.png", optimize=True)
        kit["ausschnitte"][name] = {"datei": f"{name}.png", **box, "ausrichtung": {"massstab": round(warp[0], 4), "dy": round(warp[1], 1), "dx": round(warp[2], 1)}}
        if box["anteil"] > 0.08:
            kit["hinweise"].append(f"{name}: die KI hat mehr als Mund/Augen geändert ({box['anteil']:.0%} der Figur) – Bild evtl. neu erzeugen")

    head_zone = np.zeros((SIZE, SIZE), np.float32)
    head_zone[max(0, head["top"] - 20):head["kinn"] + 10, max(0, head["x"] - head["r"] * 2):min(SIZE, head["x"] + head["r"] * 2)] = 1
    for name in POSES:
        if name not in keyed:
            continue
        rgb, a = keyed[name]
        warp = align(base_gray, base_a, gray(rgb, a), a, region=head_zone)
        save_rgba(args.out / f"{name}.png", warp_img(rgb, warp), np.clip(warp_img(a, warp), 0, 1))
        kit["bilder"][name] = f"{name}.png"

    (args.out / "kit.json").write_text(json.dumps(kit, ensure_ascii=False, indent=1), encoding="utf-8")
    (args.out / "kit.js").write_text("// erzeugt von figur/vorbereiten.py – nicht von Hand ändern\nwindow.FIGUR = " + json.dumps(kit, ensure_ascii=False, indent=1) + ";\n", encoding="utf-8")
    print(json.dumps({k: v for k, v in kit.items() if k != "bilder"} | {"bilder": list(kit["bilder"])}, ensure_ascii=False, indent=1))

    if args.vorschau:                                # Kontrollbild: alles auf Schachbrett, Ausschnitte rot umrandet
        tiles = []
        check = ((np.indices((SIZE, SIZE)).sum(axis=0) // 32) % 2 * 40 + 200).astype(np.float32)[..., None].repeat(3, axis=2)
        for name in ["basis", *VARIANTS, *POSES]:
            box = None
            if name in kit["bilder"]:
                im = np.asarray(Image.open(args.out / kit["bilder"][name]).convert("RGBA")).astype(np.float32)
            elif name in kit["ausschnitte"]:
                box = kit["ausschnitte"][name]
                im = np.dstack([base_rgb, base_a * 255]).astype(np.float32)
                p = np.asarray(Image.open(args.out / box["datei"])).astype(np.float32)
                al = p[..., 3:] / 255
                sl = (slice(box["y"], box["y"] + box["h"]), slice(box["x"], box["x"] + box["w"]))
                im[sl][..., :3] = im[sl][..., :3] * (1 - al) + p[..., :3] * al
            else:
                continue
            a = im[..., 3:] / 255
            tile = Image.fromarray((check * (1 - a) + im[..., :3] * a).clip(0, 255).astype(np.uint8))
            d = ImageDraw.Draw(tile)
            if box:
                d.rectangle([box["x"], box["y"], box["x"] + box["w"], box["y"] + box["h"]], outline=(255, 0, 0), width=3)
            d.ellipse([head["x"] - head["r"], head["y"] - head["r"], head["x"] + head["r"], head["y"] + head["r"]], outline=(0, 120, 255), width=2)
            tiles.append(tile.resize((320, 320), Image.LANCZOS))
        sheet = Image.new("RGB", (320 * len(tiles), 320))
        for i, t in enumerate(tiles):
            sheet.paste(t, (i * 320, 0))
        sheet.save(args.vorschau, quality=88)


if __name__ == "__main__":
    main()
