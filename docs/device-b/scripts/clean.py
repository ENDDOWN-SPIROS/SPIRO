"""Step 1: parse supplied workbooks -> output/cleaned_tb_data.csv (observed NCR records only)."""
import sys, re, unicodedata
import pandas as pd

RAW, OUT = sys.argv[1], sys.argv[2]

HEADER = ["record_id","year","period_start","period_end","period_type","geo_level","geo_code","geo_name",
          "province","city_municipality","barangay","case_count","population","case_rate_per_100k",
          "source_file","source_sheet"]

# Canonical NCR LGUs (names/PSGC from the 2025 workbook, which carries PSGC codes)
CANON = {
 "City of Caloocan":"1380100000","City of Las Piñas":"1380200000","City of Makati":"1380300000",
 "City of Malabon":"1380400000","City of Mandaluyong":"1380500000","City of Manila":"1380600000",
 "City of Marikina":"1380700000","City of Muntinlupa":"1380800000","City of Navotas":"1380900000",
 "City of Parañaque":"1381000000","Pasay City":"1381100000","City of Pasig":"1381200000",
 "Quezon City":"1381300000","City of San Juan":"1381400000","City of Taguig":"1381500000",
 "City of Valenzuela":"1381600000","Pateros":"1381701000"}
NCR_CODE = "1300000000"

def key(s):
    s = unicodedata.normalize("NFKD", str(s)).encode("ascii","ignore").decode().lower()
    s = re.sub(r"\bcity of\b|\bcity\b", "", s)
    return re.sub(r"[^a-z]", "", s)
KEYMAP = {key(k): k for k in CANON}

# file, sheet, year, name col, pop col, cases col, source-rate col, code col
SPECS = [
 ("ID TB 2018.xlsx","Table 2H.1",2018,0,1,2,3,None),
 ("ID TB 2020.xlsx","TB Table 1",2020,0,1,4,5,None),
 ("ID TB 2021.xlsx","TB Table 1",2021,0,1,4,5,None),
 ("ID TB 2022.xlsx","Copy of cnr All Forms",2022,0,1,4,5,None),
 ("ID TB 2023.xlsx","Copy of Copy of cnr All Forms",2023,0,1,5,6,None),
 ("Tuberculosis_EB 2024.xlsx","CNR",2024,1,2,5,6,0),
 ("FINAL Tuberculosis_EB_2025.xlsx","Annual",2025,1,2,5,6,0),
]

rows, checks, counts = [], [], []
for f, sh, yr, cn, cp, cc, cr, ccode in SPECS:
    d = pd.read_excel(f"{RAW}/{f}", sheet_name=sh, header=None)
    # the sheet title must state the same year we assign (guards against mislabelled files)
    title = " ".join(str(v) for v in d.iloc[:6].values.ravel() if pd.notna(v))
    assert str(yr) in title and not any(str(y) in title for y in range(2015, 2030) if y != yr), (f, title[:200])
    n_src = int(d.notna().any(axis=1).sum())
    # locate the NCR region row within the first 40 rows
    ncr_i = next(i for i in range(5, 40) if key(d.iat[i, cn]) in ("ncr","nationalcapitalregionncr"))
    found, ncr_row = {}, d.iloc[ncr_i]
    for i in range(ncr_i+1, ncr_i+30):
        k = key(d.iat[i, cn]) if pd.notna(d.iat[i, cn]) else ""
        if k in KEYMAP and KEYMAP[k] not in found:
            found[KEYMAP[k]] = d.iloc[i]
        if len(found) == 17: break
    assert len(found) == 17, (f, sorted(set(CANON)-set(found)))
    entries = [("region", "National Capital Region (NCR)", NCR_CODE, ncr_row)] + \
              [("city_municipality", n, CANON[n], r) for n, r in found.items()]
    s_cases = 0
    for lvl, name, code, r in entries:
        cases, pop, src_rate = r.iloc[cc], r.iloc[cp], r.iloc[cr]
        cases = float(cases) if pd.notna(cases) else None
        pop = float(pop) if pd.notna(pop) else None
        if cases is not None and (cases < 0 or cases != int(cases)):
            checks.append(f"{yr} {name}: invalid case count {cases} -> left empty"); cases = None
        if pop is not None and pop <= 0:
            checks.append(f"{yr} {name}: invalid population {pop} -> left empty"); pop = None
        rate = round(cases/pop*1e5, 4) if cases is not None and pop is not None else None
        if lvl == "city_municipality": s_cases += cases
        try: sr = float(src_rate)
        except Exception: sr = None
        if rate is not None and sr is not None and abs(rate-sr) > 0.5:
            checks.append(f"{yr} {name}: calc rate {rate} != source rate {sr}")
        rows.append({
            "record_id": f"{yr}-{code}-annual", "year": yr, "period_start": f"{yr}-01-01",
            "period_end": f"{yr}-12-31", "period_type": "annual", "geo_level": lvl,
            "geo_code": code, "geo_name": name, "province": "",
            "city_municipality": name if lvl == "city_municipality" else "", "barangay": "",
            "case_count": cases, "population": pop, "case_rate_per_100k": rate,
            "source_file": f, "source_sheet": sh})
    ncr_total = float(ncr_row.iloc[cc])
    counts.append(f"{f} / {sh}: {n_src} non-empty source rows (all of PH, incl. titles, headers, notes) -> {len(entries)} NCR rows kept (1 region + {len(entries)-1} LGUs)")
    checks.append(f"{yr}: sum of 17 LGUs = {s_cases:.0f}, NCR total row = {ncr_total:.0f}, diff = {ncr_total-s_cases:.0f}")

df = pd.DataFrame(rows)[HEADER]
for c in ("case_count",):
    df[c] = df[c].map(lambda v: "" if pd.isna(v) else int(round(v)))
df["population"] = df["population"].map(lambda v: "" if pd.isna(v) else (str(int(v)) if float(v).is_integer() else f"{v:.2f}".rstrip("0").rstrip(".")))
df["case_rate_per_100k"] = df["case_rate_per_100k"].map(lambda v: "" if pd.isna(v) else v)
assert not df.duplicated(["year", "geo_code"]).any() and df.record_id.is_unique, "duplicate records"
df.to_csv(f"{OUT}/cleaned_tb_data.csv", index=False, encoding="utf-8")
print(df.shape); print("\n".join(counts + checks))
open(f"{OUT}/cleaning_log.txt", "w", encoding="utf-8").write("\n".join([f"output rows: {len(df)}"] + counts + checks) + "\n")
