"""Tonspur für die Shorts: leichte Ukulele-artige Hintergrundmusik + Geräusche an den Szenen-Zeitpunkten + Stimme.
Musik und Geräusche werden hier synthetisch erzeugt – keine fremden Musikrechte. Unter der Stimme wird die Musik leiser.
Aufruf: python3 audio.py job.json out.wav
job.json: { duration, sfx: [{time, kind, dur?, gain?}], voice: [{time, file}], seed }"""
import json, sys, subprocess, zlib
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

SR = 44100
rng = np.random.default_rng(7)

def env(n, a=0.005, d=0.3):
    t = np.arange(n) / SR
    e = np.minimum(1, t / a) * np.exp(-t / d)
    return e

def pluck(freq, dur=0.6, bright=0.5):
    """Karplus-Strong: klingt wie eine gezupfte Saite."""
    n = int(SR * dur); p = max(2, int(SR / freq))
    buf = rng.uniform(-1, 1, p) * bright + (1 - bright) * np.sin(np.linspace(0, 2 * np.pi, p))
    out = np.zeros(n)
    for i in range(n):
        out[i] = buf[i % p]
        buf[i % p] = 0.5 * (buf[i % p] + buf[(i + 1) % p]) * 0.996
    return out * env(n, 0.002, dur * 0.6)

def note(m):  # MIDI -> Hz
    return 440 * 2 ** ((m - 69) / 12)

# drei Varianten, damit nicht jedes Video gleich klingt (Auswahl über die Episode)
VARIANTS = [
    (104, [[60, 64, 67, 72], [59, 62, 67, 71], [57, 60, 64, 69], [57, 60, 65, 69]], [48, 43, 45, 41]),   # C – G – Am – F
    (96, [[57, 60, 65, 69], [55, 60, 64, 67], [57, 62, 65, 69], [58, 62, 65, 70]], [41, 48, 50, 46]),    # F – C – Dm – B
    (112, [[59, 62, 67, 71], [57, 62, 66, 69], [59, 64, 67, 71], [60, 64, 67, 72]], [43, 50, 52, 48]),   # G – D – Em – C
]

def music(dur, variant=0):
    bpm, chords, bass = VARIANTS[variant % len(VARIANTS)]
    beat = 60 / bpm; eighth = beat / 2
    out = np.zeros(int(SR * (dur + 2)))
    cache = {}
    def place(sig, t, g):
        i = int(t * SR); j = min(len(out), i + len(sig)); out[i:j] += sig[: j - i] * g
    t = 0.0; step = 0
    while t < dur:
        bar = int(step // 8) % 4
        ch = chords[bar]
        m = ch[[0, 2, 1, 3, 2, 1, 3, 2][step % 8]] + 12
        key = (m,)
        if key not in cache: cache[key] = pluck(note(m), 0.7, 0.35)
        place(cache[key], t, 0.32 if step % 2 == 0 else 0.22)
        if step % 8 == 0:
            bk = ("b", bass[bar])
            if bk not in cache: cache[bk] = pluck(note(bass[bar]), 1.6, 0.15)
            place(cache[bk], t, 0.45)
        if step % 4 == 0:  # weicher Kick
            n = int(0.18 * SR); tt = np.arange(n) / SR
            kick = np.sin(2 * np.pi * (55 + 90 * np.exp(-tt * 30)) * tt) * env(n, 0.002, 0.08)
            place(kick, t, 0.5)
        if step % 2 == 1:  # Shaker
            n = int(0.06 * SR); sh = rng.normal(0, 1, n) * env(n, 0.003, 0.02)
            place(sosfilt(butter(4, 6000, "hp", fs=SR, output="sos"), sh), t, 0.08)
        t += eighth; step += 1
    out = out[: int(SR * dur)]
    fade = int(SR * 1.2); out[-fade:] *= np.linspace(1, 0, fade)
    out[: int(SR * 0.3)] *= np.linspace(0, 1, int(SR * 0.3))
    return out

def sfx(kind, dur=0.5):
    if kind == "marker":   # Filzstift auf Whiteboard: gefiltertes Rauschen im Strich-Rhythmus
        n = int(dur * SR); t = np.arange(n) / SR
        noise = sosfilt(butter(2, [1800, 6500], "bp", fs=SR, output="sos"), rng.normal(0, 1, n))
        rate = 6.5 + rng.uniform(-1, 1)
        am = np.clip(np.sin(2 * np.pi * rate * t + rng.uniform(0, 6)), 0, 1) ** .6 * (0.6 + 0.4 * np.sin(2 * np.pi * 1.3 * t) ** 2)
        edge = np.minimum(1, np.minimum(t / .03, (dur - t) / .05))
        return noise * am * edge * 0.28
    if kind == "erase":    # Tafelwischer
        n = int(dur * SR); t = np.arange(n) / SR
        noise = sosfilt(butter(2, [300, 2500], "bp", fs=SR, output="sos"), rng.normal(0, 1, n))
        am = 0.5 + 0.5 * np.abs(np.sin(2 * np.pi * 2.8 * t))
        edge = np.minimum(1, np.minimum(t / .05, (dur - t) / .1))
        return noise * am * edge * 0.3
    if kind == "pop":
        n = int(0.09 * SR); t = np.arange(n) / SR
        return np.sin(2 * np.pi * (380 + 2600 * t) * t) * env(n, 0.002, 0.03) * 0.9
    if kind == "stamp":
        n = int(0.25 * SR); t = np.arange(n) / SR
        thump = np.sin(2 * np.pi * (90 + 60 * np.exp(-t * 40)) * t) * env(n, 0.001, 0.06)
        noise = sosfilt(butter(2, [400, 3000], "bp", fs=SR, output="sos"), rng.normal(0, 1, n)) * env(n, 0.001, 0.02)
        return thump * 1.2 + noise * 0.5
    if kind == "coin":
        n = int(0.35 * SR); t = np.arange(n) / SR
        a = np.sin(2 * np.pi * 1975 * t) * env(n, 0.001, 0.05)
        b = np.sin(2 * np.pi * 2637 * t) * env(n, 0.001, 0.12)
        b[: int(0.06 * SR)] = 0
        return (a + b) * 0.35
    if kind == "ching":
        n = int(1.2 * SR); t = np.arange(n) / SR
        s = sum(np.sin(2 * np.pi * f * t) * env(n, 0.002, d) * g for f, d, g in [(1568, 0.5, 0.5), (2349, 0.35, 0.3), (3136, 0.25, 0.2), (4186, 0.15, 0.15)])
        return s * 0.6
    if kind == "boing":
        n = int(0.45 * SR); t = np.arange(n) / SR
        f = 260 + 140 * np.sin(2 * np.pi * 9 * t) * np.exp(-t * 4) - 60 * t
        return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.005, 0.18) * 0.7
    if kind == "whoosh":
        n = int(0.4 * SR); t = np.arange(n) / SR
        noise = rng.normal(0, 1, n)
        out = np.zeros(n); seg = n // 8
        for i in range(8):
            fc = 500 + i * 450
            part = sosfilt(butter(2, [fc, fc * 1.8], "bp", fs=SR, output="sos"), noise[i * seg:(i + 1) * seg])
            out[i * seg:(i + 1) * seg] = part
        return out * np.sin(np.pi * t / t[-1]) * 0.35
    return np.zeros(1)

def load_voice(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"], capture_output=True, check=True).stdout
    v = np.frombuffer(raw, dtype=np.int16).astype(np.float64) / 32768
    return v / (np.max(np.abs(v)) + 1e-9) * 0.9

def smooth(x, attack, release):
    """Hüllkurve: schnell hoch, langsam runter"""
    out = np.empty_like(x); a = np.exp(-1 / (attack * SR)); r = np.exp(-1 / (release * SR)); y = 0.0
    for i in range(0, len(x), 64):  # blockweise reicht für eine Ducking-Kurve
        v = x[i]; y = a * y + (1 - a) * v if v > y else r * y + (1 - r) * v
        out[i:i + 64] = y
    return out

def main():
    job = json.load(open(sys.argv[1])); dur = job["duration"]; n = int(SR * dur)
    variant = zlib.crc32(str(job.get("seed", "")).encode()) % len(VARIANTS)
    mus = music(dur, variant)[:n]; mus = np.pad(mus, (0, n - len(mus)))
    fx = np.zeros(n)
    for e in job.get("sfx", []):
        sg = sfx(e["kind"], e.get("dur", 0.5)) * e.get("gain", 1)
        i = int(e["time"] * SR); j = min(n, i + len(sg))
        if 0 <= i < n: fx[i:j] += sg[: j - i]
    voice = np.zeros(n)
    for v in job.get("voice", []):
        sg = load_voice(v["file"]); i = int(v["time"] * SR); j = min(n, i + len(sg))
        if 0 <= i < n: voice[i:j] += sg[: j - i]
    if np.any(voice):
        talk = smooth((np.abs(voice) > 0.02).astype(np.float64), 0.05, 0.45)
        mix = mus * 0.42 * (1 - 0.68 * talk) + fx * (1 - 0.45 * talk) + voice * 1.0
    else:
        mix = mus * 0.55 + fx
    mix = np.tanh(mix * 1.1)  # sanft begrenzen
    mix = mix / (np.max(np.abs(mix)) + 1e-9) * 0.89
    stereo = np.stack([mix, mix], axis=1)
    wavfile.write(sys.argv[2], SR, (stereo * 32767).astype(np.int16))

main()
