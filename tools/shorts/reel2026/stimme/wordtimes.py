# Wort-Zeitmarken je Satz: Parakeet erkennt Tokens mit Zeit; die Wörter des Skripts werden darauf abgebildet
import sys, json, wave, re, difflib, numpy as np, sherpa_onnx as s
P, wav, marks_p = sys.argv[1], sys.argv[2], sys.argv[3]
rec = s.OfflineRecognizer.from_transducer(encoder=P+'/encoder.int8.onnx', decoder=P+'/decoder.int8.onnx', joiner=P+'/joiner.int8.onnx', tokens=P+'/tokens.txt', model_type='nemo_transducer', num_threads=2)
with wave.open(wav) as w:
    sr = w.getframerate(); x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32)/32768
marks = json.load(open(marks_p))
def key(t): return re.sub(r'[^a-zäöüß0-9]', '', t.lower())
for m in marks:
    a0, a1 = m['start'], m['end']
    seg = np.concatenate([x[int(a0*sr):int(a1*sr)], np.zeros(sr//2, np.float32)])
    st = rec.create_stream(); st.accept_waveform(sr, seg); rec.decode_stream(st)
    toks, ts = st.result.tokens, st.result.timestamps
    # Erkannte Wörter mit Startzeit bilden (Token mit führendem Leerzeichen/▁ beginnt ein Wort)
    hw = []
    for tk, t in zip(toks, ts):
        if tk.startswith(' ') or tk.startswith('▁') or not hw: hw.append([tk.strip('▁ '), t])
        else: hw[-1][0] += tk
    for i, h in enumerate(hw): h.append(hw[i+1][1] if i+1 < len(hw) else (a1-a0-0.15))
    words = m['say'].split()
    # Abbildung Skriptwörter -> erkannte Wörter über Zeichen-Ausrichtung
    hs = ''.join(key(h[0]) for h in hw); ss = ''.join(key(w) for w in words)
    hpos = []; [hpos.extend([(i)]*len(key(h[0]))) for i, h in enumerate(hw)]
    sm = difflib.SequenceMatcher(None, ss, hs, autojunk=False)
    cmap = {}
    for blk in sm.get_matching_blocks():
        for k in range(blk.size): cmap[blk.a+k] = blk.b+k
    out = []; c = 0
    for w in words:
        n = len(key(w)); idxs = [cmap[i] for i in range(c, c+n) if i in cmap]; c += n
        if idxs:
            hi0, hi1 = hpos[idxs[0]], hpos[idxs[-1]]
            out.append({"w": w, "s": round(a0+hw[hi0][1], 3), "e": round(a0+hw[hi1][2], 3)})
        else: out.append({"w": w, "s": None, "e": None})
    # Lücken auffüllen (Wörter ohne Treffer, z. B. Zahlen) durch Interpolation
    for i, o in enumerate(out):
        if o['s'] is None:
            prev = next((out[j]['e'] for j in range(i-1, -1, -1) if out[j]['e'] is not None), a0)
            nxt = next((out[j]['s'] for j in range(i+1, len(out)) if out[j]['s'] is not None), a1)
            gap = [j for j in range(i, len(out)) if out[j]['s'] is None]
            k = len([j for j in range(i, len(out)) if out[j]['s'] is None and all(out[q]['s'] is None for q in range(i, j+1))])
            step = (nxt-prev)/max(1, k)
            o['s'] = round(prev, 3); o['e'] = round(prev+step, 3)
    for i in range(len(out)-1): out[i]['e'] = min(out[i]['e'], out[i+1]['s']) if out[i+1]['s'] > out[i]['s'] else out[i]['e']
    m['words'] = out
    m['heard'] = st.result.text
json.dump(marks, open(marks_p, 'w'), ensure_ascii=False, indent=1)
for m in marks: print(m['key'], ' '.join(f"{o['w']}@{o['s']}" for o in m['words']))
