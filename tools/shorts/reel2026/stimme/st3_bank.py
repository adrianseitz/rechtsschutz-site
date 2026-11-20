import sys, json, numpy as np
src, dst, spec = sys.argv[1], sys.argv[2], json.load(open(sys.argv[3]))
b = open(src, 'rb').read()
h = np.frombuffer(b[:48], dtype=np.int64); n, a1, a2, n2, d1, d2 = [int(v) for v in h]
ttl = np.frombuffer(b[48:48+n*a1*a2*4], dtype=np.float32).reshape(n, a1, a2)
dp = np.frombuffer(b[48+n*a1*a2*4:], dtype=np.float32).reshape(n, d1, d2)
mean_ttl, mean_dp = ttl.mean(0), dp.mean(0)
out_t, out_d = [], []
for v in spec:
    # v = {"mix": {"5":0.5,"7":0.5}, "exag": 0.0, "dp_from": null}
    w = {int(k): float(x) for k, x in v["mix"].items()}; tot = sum(w.values())
    t = sum(ttl[k]*x for k, x in w.items())/tot; dd = sum(dp[k]*x for k, x in w.items())/tot
    e = float(v.get("exag", 0)); t = t + e*(t - mean_ttl)
    ed = float(v.get("exag_dp", 0)); dd = dd + ed*(dd - mean_dp)
    out_t.append(t.astype(np.float32)); out_d.append(dd.astype(np.float32))
m = len(spec)
with open(dst, 'wb') as f:
    f.write(np.array([m, a1, a2, m, d1, d2], dtype=np.int64).tobytes())
    f.write(np.stack(out_t).tobytes()); f.write(np.stack(out_d).tobytes())
print('wrote', m, 'voices', dst)
