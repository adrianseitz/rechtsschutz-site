# Sprecherstimme für ein Reel: Supertonic (Stimme 2), Emotion pro Satz, natürliches Klangbild
import sys, json, re, wave, random, numpy as np, sherpa_onnx as s, parselmouth
from parselmouth.praat import call
from num2words import num2words
from scipy.signal import fftconvolve, butter, sosfilt
bank, reel, out = sys.argv[1], sys.argv[2], sys.argv[3]
AMOUNT = float(sys.argv[5]) if len(sys.argv) > 5 else 1.0   # wie stark die Sprechmelodie verstärkt wird (0 = gar nicht)
SID, STEPS = 4, 32
random.seed(7); np.random.seed(7)
MOOD = {  # Tempo, Melodie-Faktor, Halbtöne, Pause davor, Pause danach, Pegel
 "aufgeregt":   (1.10, 1.45,  0.8, 0.00, 0.32, 1.00),
 "ernst":       (0.97, 1.10, -0.6, 0.08, 0.45, 0.93),
 "dramatisch":  (0.93, 1.25, -1.0, 0.20, 0.42, 0.97),
 "eindringlich":(1.00, 1.30,  0.0, 0.12, 0.38, 1.00),
 "warm":        (1.00, 1.20,  0.3, 0.16, 0.34, 0.95),
 "begeistert":  (1.10, 1.55,  1.2, 0.04, 0.38, 1.00),
 "freundlich":  (1.04, 1.30,  0.6, 0.12, 0.30, 0.97),
}
def zahl(n):
    if 1100 <= n <= 1900 and n % 100 == 0: return num2words(n//100, lang='de') + 'hundert'
    return num2words(n, lang='de')
RESPELL = [  # Aussprachehilfen: Bindestriche trennen lange Wörter, ie macht das i lang
    ('Vermieterrechtsschutz', 'Vermieter-Rechtsschutz'), ('Firmenrechtsschutz', 'Firmen-Rechtsschutz'),
    ('Mietausfallschutz', 'Mietausfall-Schutz'), ('Kündigungsschutzklage', 'Kündigungsschutz-Klage'),
    ('Räumungsverfahren', 'Räumungs-Verfahren'), ('Gerichtsvollzieher', 'Gerichts-Vollzieher'),
    ('Räumungsklage', 'Räumungs-Klage'), ('Arbeitszeugnis', 'Arbeits-Zeugnis'), ('Gutachter', 'Gut-Achter'),
    ('Tarif', 'Tarief'), ('Wartezeit', 'Warte-Zeit'),
]
def sprechtext(t):
    for a, b in RESPELL: t = t.replace(a, b)
    t = t.replace('ARAG', 'Arag')
    t = re.sub(r'(\d{1,3}(?:\.\d{3})+|\d+)', lambda m: zahl(int(m.group(1).replace('.', ''))), t)
    return t
d = bank
m = s.OfflineTtsSupertonicModelConfig(d+'/duration_predictor.int8.onnx', d+'/text_encoder.int8.onnx', d+'/vector_estimator.int8.onnx', d+'/vocoder.int8.onnx', d+'/tts.json', d+'/unicode_indexer.bin', d+'/voice.bin')
tts = s.OfflineTts(s.OfflineTtsConfig(model=s.OfflineTtsModelConfig(supertonic=m, num_threads=2))); sr = tts.sample_rate
import difflib
W = sys.argv[4]
rec = s.OfflineRecognizer.from_whisper(encoder=W+'/small-encoder.int8.onnx', decoder=W+'/small-decoder.int8.onnx', tokens=W+'/small-tokens.txt', language='de', task='transcribe', num_threads=2)
def norm(t): return re.sub(r'[^a-zäöüß0-9 ]', '', re.sub(r'(\d)\.(\d)', r'\1\2', t.lower().replace('-', ' '))).split()
def score(a, say):
    st = rec.create_stream(); st.accept_waveform(sr, np.concatenate([a, np.zeros(sr//2, np.float32)])); rec.decode_stream(st)
    hyp = st.result.text
    return difflib.SequenceMatcher(None, ' '.join(norm(hyp)), ' '.join(norm(say))).ratio(), hyp.strip()
def shape(x, k, semi):
    snd = parselmouth.Sound(x.astype(np.float64), sampling_frequency=sr)
    man = call(snd, "To Manipulation", 0.01, 65, 350); pt = call(man, "Extract pitch tier")
    pv = snd.to_pitch(pitch_floor=65, pitch_ceiling=350).selected_array['frequency']; pv = pv[pv > 0]
    if len(pv) < 5: return x
    med = float(np.median(pv)); n = call(pt, "Get number of points")
    tv = [(call(pt, "Get time from index", i), call(pt, "Get value at index", i)) for i in range(1, n+1)]
    call(pt, "Remove points between", 0, snd.duration)
    for t, v in tv: call(pt, "Add point", t, med * (v/med)**k * 2**(semi/12))
    call([pt, man], "Replace pitch tier")
    return call(man, "Get resynthesis (overlap-add)").values[0].astype(np.float32)
beats = json.load(open(reel))['beats']
parts, marks, t = [], [], 0.25
parts.append(np.zeros(int(0.25*sr), np.float32))
for b in beats:
    sp, k, semi, pre, post, vol = MOOD[b['mood']]
    k = 1 + (k - 1)*AMOUNT; semi = semi*AMOUNT
    sp *= random.uniform(0.98, 1.02); pre *= random.uniform(0.85, 1.15); post *= random.uniform(0.85, 1.15)
    if pre: parts.append(np.zeros(int(pre*sr), np.float32)); t += pre
    g = s.GenerationConfig(); g.sid = SID; g.speed = sp; g.num_steps = STEPS; g.extra = {"lang": "de"}
    best = None
    for versuch in range(6):
        a = np.clip(np.array(tts.generate(sprechtext(b['say']), g).samples, dtype=np.float32), -1, 1)
        idx = np.where(np.abs(a) > 0.002)[0]
        if len(idx): a = a[max(0, idx[0]-int(0.03*sr)): idx[-1]+int(0.22*sr)]
        sc, hyp = score(a, b['say'])
        if best is None or sc > best[0]: best = (sc, a, hyp)
        if sc >= 0.99: break
    sc, a, hyp = best
    print(f"  {b['key']}: {sc:.3f} nach {versuch+1} | {hyp}", flush=True)
    a = (shape(a, k, semi) if AMOUNT > 0 else a) * vol
    fade = int(0.012*sr); a[:fade] *= np.linspace(0, 1, fade); a[-fade:] *= np.linspace(1, 0, fade)
    marks.append({"key": b['key'], "mood": b['mood'], "start": round(t, 3), "end": round(t+len(a)/sr, 3), "say": b['say'], "spoken": sprechtext(b['say'])})
    parts.append(a); t += len(a)/sr
    parts.append(np.zeros(int(post*sr), np.float32)); t += post
dry = np.concatenate(parts + [np.zeros(int(0.3*sr), np.float32)])
# Raumklang: kurzer kleiner Raum (frühe Reflexionen + Nachhall ~0,28 s), leise beigemischt
L = int(0.35*sr); ir = np.zeros(L, np.float32); ir[0] = 1.0
for ms, g_ in [(7, .22), (11, .17), (17, .13), (23, .10), (31, .08)]: ir[int(ms/1000*sr)] += g_
tail = np.random.randn(L).astype(np.float32) * np.exp(-np.arange(L)/sr*6.9/0.28) * 0.05
tail[:int(0.012*sr)] = 0; ir += tail
wet = fftconvolve(dry, ir)[:len(dry)]
x = 0.92*dry + 0.08*wet/np.abs(wet).max()*np.abs(dry).max()
# Raumrauschen statt digitaler Stille (sehr leise)
noise = np.cumsum(np.random.randn(len(x))).astype(np.float32); noise -= np.convolve(noise, np.ones(4410)/4410, 'same')
noise = sosfilt(butter(2, [120, 6000], 'bandpass', fs=sr, output='sos'), noise).astype(np.float32)
noise = noise/np.sqrt(np.mean(noise**2)) * 10**(-62/20)
x = x/np.abs(x).max()*0.9 + noise
with wave.open(out+'.wav', 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes((np.clip(x, -1, 1)*32767).astype(np.int16).tobytes())
json.dump(marks, open(out+'.json', 'w'), ensure_ascii=False, indent=1)
print(out, round(len(x)/sr, 1), 's')
