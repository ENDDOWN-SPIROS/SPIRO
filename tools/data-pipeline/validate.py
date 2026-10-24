"""Step 3: validate the four outputs against the shared data contract."""
import sys, csv, json, re, datetime as dt
OUT = sys.argv[1]
H1 = "record_id,year,period_start,period_end,period_type,geo_level,geo_code,geo_name,province,city_municipality,barangay,case_count,population,case_rate_per_100k,source_file,source_sheet".split(",")
H2 = "prediction_id,generated_at,target_period_start,target_period_end,target_period_type,geo_level,geo_code,geo_name,target_variable,predicted_value,prediction_unit,model_name,model_version,training_data_end,lower_bound,upper_bound".split(",")
EV_KEYS = ["status","target_variable","prediction_horizon","geographic_level","feature_columns","excluded_columns",
           "model_name","baseline_name","validation_method","training_rows","testing_rows","metrics","baseline_metrics","limitations","notes"]
errs = []
def chk(c, m):
    if not c: errs.append(m)
def date(s): return re.fullmatch(r"\d{4}-\d{2}-\d{2}", s) and dt.date.fromisoformat(s)
def num(s, allow_empty=True):
    if s == "": return allow_empty
    try: float(s); return True
    except ValueError: return False

for fn, H, idk in (("cleaned_tb_data.csv", H1, "record_id"), ("tb_predictions.csv", H2, "prediction_id")):
    raw = open(f"{OUT}/{fn}", "rb").read()
    raw.decode("utf-8"); chk(not raw.startswith(b"\xef\xbb\xbf"), f"{fn}: has BOM")
    r = list(csv.reader(open(f"{OUT}/{fn}", encoding="utf-8")))
    chk(r[0] == H, f"{fn}: header mismatch {r[0]}")
    rows = [dict(zip(r[0], x)) for x in r[1:]]
    chk(all(len(x) == len(H) for x in r), f"{fn}: ragged rows")
    ids = [x[idk] for x in rows]; chk(len(ids) == len(set(ids)), f"{fn}: duplicate ids")
    for x in rows:
        chk(re.fullmatch(r"\d{10}", x["geo_code"]), f"{fn}: bad geo_code {x['geo_code']}")
        for k in H:
            if k.endswith(("period_start", "period_end")) or k == "training_data_end":
                chk(date(x[k]), f"{fn}: bad date {k}={x[k]}")
        if fn.startswith("cleaned"):
            for k in ("case_count", "population", "case_rate_per_100k"): chk(num(x[k]), f"bad num {k}")
            chk(x["case_count"] == "" or x["case_count"].isdigit(), "case_count not integer")
            chk(x["period_start"][:4] == x["year"] == x["period_end"][:4], "year/period mismatch")
        else:
            dt.datetime.fromisoformat(x["generated_at"])
            for k in ("predicted_value", "lower_bound", "upper_bound"): chk(num(x[k]), f"bad num {k}")
            chk(float(x["lower_bound"]) <= float(x["predicted_value"]) <= float(x["upper_bound"]), "bounds order")
    print(fn, len(rows), "rows")
    if fn.startswith("cleaned"): cleaned = rows
    else: preds = rows

years = sorted({x["year"] for x in cleaned}); print("years:", years)
chk("2025" in years, "2025 missing")
chk({p["geo_code"] for p in preds} <= {c["geo_code"] for c in cleaned if c["geo_level"] == "city_municipality"}, "pred codes not in cleaned")
ev = json.load(open(f"{OUT}/model_evaluation.json", encoding="utf-8"))
chk(list(ev.keys()) == EV_KEYS, f"json keys {list(ev.keys())}")
chk(ev["status"] in ("pending", "completed", "insufficient_data", "failed"), "bad status")
for k in ("metrics", "baseline_metrics"): chk(list(ev[k].keys()) == ["mae", "rmse", "r2"], f"{k} keys")
chk(ev["target_variable"] == preds[0]["target_variable"] and ev["model_name"] == preds[0]["model_name"], "json/csv mismatch")
import os; chk(os.path.exists(f"{OUT}/data_dictionary.md"), "dictionary missing")
print("ERRORS:" if errs else "ALL CHECKS PASSED", *sorted(set(errs))[:20], sep="\n")
sys.exit(1 if errs else 0)
