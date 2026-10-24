"""Step 4: independently recompute model metrics and predictions (numpy only, no sklearn) and
check they match model_evaluation.json and tb_predictions.csv. Usage: python3 verify_model.py output"""
import sys, json, csv
import numpy as np, pandas as pd
OUT = sys.argv[1]
d = pd.read_csv(f"{OUT}/cleaned_tb_data.csv", dtype={"geo_code": str}); d = d[d.geo_level == "city_municipality"]
R = d.pivot(index="geo_code", columns="year", values="case_rate_per_100k")
BREAKS = {("1380300000", 2024), ("1381500000", 2024)}
rows = []
for t in R.columns:
    if t - 1 not in R.columns: continue
    l = np.log(R[t - 1]); f = l - l.mean()
    rows += [(g, t, f[g], R.loc[g, t - 1], R.loc[g, t]) for g in R.index if (g, t) not in BREAKS]
D = pd.DataFrame(rows, columns=["g", "t", "f", "prev", "act"]); D["y"] = np.log(D.act / D.prev)
fit = lambda x, y, a=5.0: (x * y).sum() / ((x * x).sum() + a)   # closed-form 1-feature ridge, no intercept
P = pd.concat([te.assign(p=te.prev * np.exp(fit(D[D.t < T].f, D[D.t < T].y) * te.f))
               for T in (2023, 2024, 2025) for te in [D[D.t == T]]])
def m(p, a): return {"mae": np.mean(np.abs(p - a)), "rmse": np.sqrt(np.mean((p - a) ** 2)),
                     "r2": 1 - ((a - p) ** 2).sum() / ((a - a.mean()) ** 2).sum()}
ev = json.load(open(f"{OUT}/model_evaluation.json"))
for mine, theirs in ((m(P.p, P.act), ev["metrics"]), (m(P.prev, P.act), ev["baseline_metrics"])):
    assert all(abs(mine[k] - theirs[k]) < 1e-3 for k in mine), (mine, theirs)
assert (len(D), len(P)) == (ev["training_rows"], ev["testing_rows"])
b = fit(D.f, D.y); l = np.log(R[2025]); f = l - l.mean()
pr = {r["geo_code"]: float(r["predicted_value"]) for r in csv.DictReader(open(f"{OUT}/tb_predictions.csv", encoding="utf-8"))}
assert set(pr) == set(R.index) and all(abs(R.loc[g, 2025] * np.exp(b * f[g]) - pr[g]) < 0.01 for g in R.index)
print("VERIFIED: metrics, row counts and all", len(pr), "predictions reproduced independently")
