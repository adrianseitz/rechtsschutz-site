# Rendert ein Reel: Drehbuch + Stimme + Wort-Zeiten -> HTML-Animation -> MP4 mit Ton
import sys, os, json, re, subprocess, wave, numpy as np
from scipy.signal import butter, sosfilt, resample_poly
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from storyboards import BOARDS
try:
    from storyboards30 import BOARDS30; BOARDS.update(BOARDS30)
except ImportError: pass
try:
    from storyboardsP import BOARDSP; BOARDS.update(BOARDSP)
except ImportError: pass

HERE = os.path.dirname(os.path.abspath(__file__))
S = os.path.abspath(os.path.join(HERE, '..', '..'))
REELS = os.environ.get('REELS_DIR', os.path.join(S, 'gh', 'tools', 'shorts', 'reels'))
VOICE = os.environ.get('VOICE_DIR', os.path.join(S, 'reels', 'voice'))
OUT = os.environ.get('OUT_DIR', os.path.join(S, 'reels', 'out'))
FPS, SR = 30, 48000

def norm(w): return re.sub(r'[^a-zäöüß0-9]', '', w.lower())

def prepare(name):
    script = json.load(open(os.path.join(REELS, name + '.json')))
    marks = json.load(open(os.path.join(VOICE, name + '.json')))
    board = BOARDS[name]
    emph = {k: {norm(x) for x in re.findall(r'\*([^*]+)\*', b.get('voice', '')) for x in x.split()} for k, b in [(b['key'], b) for b in script['beats']]}
    beats = []
    for m in marks:
        sc = dict(board['scenes'][m['key']])
        if 'from_' in sc: sc['from'] = sc.pop('from_')
        words = [dict(w, emph=norm(w['w']) in emph.get(m['key'], set())) for w in m['words']]
        beats.append({'key': m['key'], 'mood': m['mood'], 'start': m['start'], 'end': m['end'], 'say': m['say'], 'words': words, 'scene': sc})
    duration = round(beats[-1]['words'][-1]['e'] + 1.9, 2)
    light = next(b['start'] for b in beats if b['key'] == board['lightAt']) - 0.05
    return {'badge': board['badge'], 'hookTitle': board['hookTitle'], 'lightAt': light, 'beats': beats, 'duration': duration}

# ---------- Soundeffekte (synthetisch, leise) ----------
rng = np.random.default_rng(3)
def env(n, a, d):  # Anstieg/Abfall in Samples
    e = np.ones(n); a = max(1, a); e[:a] = np.linspace(0, 1, a); e[-d:] *= np.linspace(1, 0, d) if d > 0 else 1; return e
def bp(x, lo, hi): return sosfilt(butter(2, [lo, hi], 'bandpass', fs=SR, output='sos'), x)
def lp(x, f): return sosfilt(butter(2, f, 'lowpass', fs=SR, output='sos'), x)
def hp(x, f): return sosfilt(butter(2, f, 'highpass', fs=SR, output='sos'), x)
def sine(f0, f1, dur, decay):
    n = int(dur*SR); t = np.arange(n)/SR; f = np.geomspace(f0, f1, n); ph = 2*np.pi*np.cumsum(f)/SR
    return np.sin(ph) * np.exp(-t*decay)
def sfx(kind):
    if kind == 'whoosh':
        n = int(.38*SR); x = rng.standard_normal(n); a = bp(x, 400, 1800); b = bp(x, 1800, 6000); k = np.linspace(0, 1, n)
        y = (a*(1-k) + b*k) * np.sin(np.pi*np.linspace(0, 1, n))**2; return y*.5
    if kind == 'pop': return sine(900, 380, .09, 38)*.9 + hp(rng.standard_normal(int(.09*SR)), 3000)*np.exp(-np.arange(int(.09*SR))/SR*120)*.15
    if kind == 'tick':
        n = int(.03*SR); return (sine(3200, 2800, .03, 220)*.6 + hp(rng.standard_normal(n), 4000)*np.exp(-np.arange(n)/SR*400)*.4)
    if kind in ('stamp', 'thud'):
        n = int(.22*SR); t = np.arange(n)/SR; body = sine(140 if kind == 'stamp' else 90, 55, .22, 22)
        hit = lp(rng.standard_normal(n), 1800)*np.exp(-t*60)*.6; return (body + hit)*(.9 if kind == 'thud' else .7)
    if kind == 'switch':
        c = lambda: hp(rng.standard_normal(int(.012*SR)), 2500)*np.exp(-np.arange(int(.012*SR))/SR*500)
        y = np.zeros(int(.07*SR)); y[:len(c())] += c(); y[int(.035*SR):int(.035*SR)+len(c())] += c()*.7; return y*.9
    if kind == 'ding':
        return (sine(1046, 1046, 1.1, 4.5)*.5 + sine(1568, 1568, 1.1, 6)*.3 + sine(2093, 2093, 1.1, 9)*.15)*env(int(1.1*SR), 60, 2000)*.55
    if kind == 'alert': y = np.concatenate([sine(660, 640, .12, 18), np.zeros(int(.05*SR)), sine(520, 500, .16, 14)]); return y*.45
    if kind == 'paper':
        n = int(.45*SR); x = bp(rng.standard_normal(n), 2000, 7000); m = np.abs(np.sin(np.linspace(0, 9, n)))*np.sin(np.pi*np.linspace(0, 1, n)); return x*m*.35
    if kind == 'marker':
        n = int(.4*SR); x = bp(rng.standard_normal(n), 1200, 3800); m = (0.6 + 0.4*np.sin(np.linspace(0, 60, n)))*np.sin(np.pi*np.linspace(0, 1, n)); return x*m*.3
    if kind == 'rewind':
        n = int(.6*SR); x = rng.standard_normal(n); k = np.linspace(1, 0, n); y = (bp(x, 300, 1500)*k + bp(x, 1500, 5000)*(1-k))*np.sin(np.pi*np.linspace(0, 1, n))
        return y*.45 + sine(300, 1200, .6, 2)*np.sin(np.pi*np.linspace(0, 1, n))*.12
    if kind == 'click':
        c = sfx('tick'); y = np.zeros(int(.09*SR)); y[:len(c)] += c*1.2; y[int(.05*SR):int(.05*SR)+len(c)] += c; return lp(y, 5000)*1.1
    return np.zeros(10)

def mix_audio(name, events, duration, out_wav):
    with wave.open(os.path.join(VOICE, name + '.wav')) as w:
        vsr = w.getframerate(); v = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float64)/32768
    v = resample_poly(v, SR, vsr) if vsr != SR else v
    n = int(duration*SR); voice = np.zeros(n); voice[:min(n, len(v))] = v[:n]
    fx = np.zeros(n)
    for e in events:
        y = sfx(e['type'])*e.get('gain', 1.0); i = int(e['t']*SR)
        if i < 0 or i >= n: continue
        j = min(n, i+len(y)); fx[i:j] += y[:j-i]
    voice = voice/np.abs(voice).max()*0.89
    fx = fx*10**(-17/20)                       # Effekte deutlich unter der Stimme
    out = voice + fx
    fade = int(.4*SR); out[-fade:] *= np.linspace(1, 0, fade)
    out = out/max(1, np.abs(out).max()/0.97)
    with wave.open(out_wav, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((out*32767).astype(np.int16).tobytes())

def open_page(p, data):
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1080, 'height': 1920}, device_scale_factor=1)
    pg.goto('file://' + os.path.join(HERE, 'reel.html'))
    pg.evaluate("Promise.all([document.fonts.load('900 100px Archivo'), document.fonts.load('600 40px Archivo'), document.fonts.load('700 40px Hand'), document.fonts.load('30px Typed')])")
    pg.wait_for_function("document.fonts.status === 'loaded'")
    res = pg.evaluate('d => build(d)', data)
    # 3D-Figuren: erst rendern, wenn alle Bilder dekodiert sind
    pg.evaluate("Promise.all([...document.images].map(i => i.decode().catch(() => 0)))")
    return b, pg, res

def stills(name, times):
    data = prepare(name); os.makedirs(OUT, exist_ok=True)
    with sync_playwright() as p:
        b, pg, res = open_page(p, data)
        for t in times:
            pg.evaluate(f'renderAt({t})'); f = os.path.join(OUT, f'{name}_t{t:05.2f}.jpg'); pg.screenshot(path=f, type='jpeg', quality=85); print(f)
        b.close()

def full(name):
    data = prepare(name); os.makedirs(OUT, exist_ok=True)
    tmp_v = os.path.join(OUT, name + '.video.tmp.mp4'); tmp_a = os.path.join(OUT, name + '.wav'); final = os.path.join(OUT, name + '.mp4')
    nfr = int(round(data['duration']*FPS))
    ff = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', str(FPS), '-c:v', 'mjpeg', '-i', '-',
                           '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', str(FPS), tmp_v], stdin=subprocess.PIPE)
    with sync_playwright() as p:
        b, pg, res = open_page(p, data)
        for i in range(nfr):
            pg.evaluate(f'renderAt({i/FPS})'); ff.stdin.write(pg.screenshot(type='jpeg', quality=92))
            if i % 150 == 0: print(f'{name}: Bild {i}/{nfr}', flush=True)
        b.close()
    ff.stdin.close(); assert ff.wait() == 0
    mix_audio(name, res['events'], data['duration'], tmp_a)
    tmp_f = final.replace('.mp4', '.tmp.mp4')
    r = subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', tmp_v, '-i', tmp_a, '-map', '0:v', '-map', '1:a', '-c:v', 'copy',
                        '-af', 'loudnorm=I=-14:TP=-1.5:LRA=9', '-ar', '48000', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', '-shortest', tmp_f])
    assert r.returncode == 0; os.replace(tmp_f, final); os.remove(tmp_v)
    print('fertig', final, data['duration'], 's')

if __name__ == '__main__':
    name, mode = sys.argv[1], sys.argv[2]
    if mode == 'stills': stills(name, [float(x) for x in sys.argv[3].split(',')])
    else: full(name)
