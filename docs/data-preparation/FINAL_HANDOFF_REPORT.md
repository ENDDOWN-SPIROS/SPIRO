# SPIRO — Device B final handoff report (Module B6)

QA run on 2026-10-24. The whole pipeline was re-run end to end in a fresh folder, from the supplied `Tuberculosis_DS.zip` (SHA-256 `3520922f…`, identical to the copy in the owner's Downloads). The re-run output matches the delivered files exactly, apart from run timestamps.

## 1. Source files and worksheets used
| Year | Workbook | Worksheet |
|---|---|---|
| 2018 | ID TB 2018.xlsx | Table 2H.1 |
| 2020 | ID TB 2020.xlsx | TB Table 1 |
| 2021 | ID TB 2021.xlsx | TB Table 1 |
| 2022 | ID TB 2022.xlsx | Copy of cnr All Forms |
| 2023 | ID TB 2023.xlsx | Copy of Copy of cnr All Forms |
| 2024 | Tuberculosis_EB 2024.xlsx | CNR |
| 2025 | FINAL Tuberculosis_EB_2025.xlsx | Annual |

The other 24 sheets (treatment success, drug-resistant TB, preventive treatment, testing, population by age) were inspected and not used. See `data_inspection_report.md`.

## 2. Scripts and supporting files (`proximity_device_b/`)
- **`tools/data-pipeline/clean.py`:** workbooks → `cleaned_tb_data.csv` and `cleaning_log.txt`.
- **`tools/data-pipeline/model.py`:** trains, evaluates and predicts → `tb_predictions.csv` and `model_evaluation.json`.
- **`tools/data-pipeline/validate.py`:** checks all four files against the contract.
- **`tools/data-pipeline/verify_model.py`:** recomputes the metrics and predictions in plain numpy.
- **`tools/data-pipeline/RUN.md`:** run instructions.
- **Supporting documents:** `data_inspection_report.md`, `model_task_decision.md`, `device_a_handoff.md` and this report.

## 3. The four required outputs
| File | Path | Status |
|---|---|---|
| cleaned_tb_data.csv | `proximity_device_b/cleaned_tb_data.csv` | Ready: 126 rows |
| tb_predictions.csv | `proximity_device_b/tb_predictions.csv` | Ready: 17 rows |
| data_dictionary.md | `proximity_device_b/data_dictionary.md` | Ready: all 32 fields |
| model_evaluation.json | `proximity_device_b/model_evaluation.json` | Ready: `completed` |

The same files are bundled in `proximity_device_b_outputs.zip`, and a copy of the zip is in the owner's Downloads folder.

## 4. Observed records
- **Count:** 126 valid observed records = 18 units (the NCR total plus 17 LGUs) × 7 years.
- **How they were counted:** for each source sheet, `clean.py` locates the NCR row and its 17 LGU rows and drops every other row (other regions, titles, headers, notes). Source rows in versus rows kept are logged in `cleaning_log.txt`, e.g. 2025: 1,753 non-empty rows → 18 kept.
- **No NCR row was dropped.** There are no duplicate (year, geo_code) pairs.

## 5. What the data supports
- **Years:** 2018, 2020, 2021, 2022, 2023, 2024 and 2025. 2019 is not supplied. 2025 is present and is the default year.
- **Period:** annual (calendar year) only.
- **Geographic levels:** `region` (the NCR total, PSGC 1300000000) and `city_municipality` (16 cities plus Pateros).
- **Not available:** province (NCR has none), barangay, coordinates and boundaries, and overcrowding or occupancy data.

## 6. Missing data and key cleaning decisions
- **No missing values** in NCR case counts or populations. No source asterisks ("no report") appear in NCR rows.
- **PSGC codes for 2018–2023:** those workbooks have names only, so names were matched to the 2025 PSGC codes. All 17 LGUs matched in all 7 years.
- **Rates:** calculated as case_count / population × 100,000. The calculated rates match the source's own rates within 0.5, except City of Manila 2024 (764.42 vs 765.49). The calculated value is kept.
- **Validity rules:** invalid counts, invalid populations and duplicates are blocked or blanked; none occurred. The run stops if a sheet's title year doesn't match.
- **Source anomaly:** the 2024 workbook gives the Philippines row the NCR code. NCR is selected by its label, so the outputs are unaffected.
- **Caveats carried to Device A:**
  - The 2024 workbook labels its counts "New and Relapse".
  - The Makati and Taguig denominators break in 2024 (the EMBO transfer).
  - 2020–21 counts are depressed by COVID.
  - These are notified cases, not incidence.

## 7. Model specification
- **Target:** `case_rate_per_100k`, the notified TB rate per 100,000 population.
- **Horizon:** one year ahead (2026). Training data ends 2025-12-31.
- **Geographic level:** `city_municipality` (the 17 NCR LGUs).
- **Features:** each LGU's log rate in year t−1 minus the NCR mean log rate in t−1. Last year's rate is used as the fixed starting point.
- **Excluded columns:** record_id, geo_code, geo_name (identifiers); source_file, source_sheet (provenance); period_* (constant); province and barangay (empty); target-year case_count and population (target-derived).
- **Excluded transitions:** Makati and Taguig 2023→2024, because of the denominator break.
- **Algorithm:** Ridge regression (scikit-learn, alpha = 5, no intercept) on log(rate_t / rate_t−1). The fitted coefficient is −0.1744, a slight pull toward the NCR average.
- **Baseline:** persistence, meaning next year's rate equals this year's.

## 8. Evaluation (actual run)
- **Training rows:** 83, i.e. all usable year-to-year transitions with target years 2021–2025.
- **Testing rows:** 49, i.e. 17 + 15 + 17 out-of-sample predictions.
- **Validation:** rolling-origin by year. The model is tested on 2023, 2024 and 2025 in turn, each time trained only on earlier years.

| Pooled 2023–2025 | MAE | RMSE | R² |
|---|---|---|---|
| Model | 96.912 | 135.782 | 0.2508 |
| Persistence baseline | 95.493 | 136.161 | 0.2466 |

**Did the model beat the baseline? No.** Its MAE is slightly worse and its RMSE slightly better; in effect it ties. Per test year, it was better in 2023 and 2024 and worse in 2025. The metrics are also somewhat optimistic, because this configuration was chosen after comparing variants on the same test years. `verify_model.py` reproduces every metric and prediction independently.

## 9. Predictions
- **Generated:** yes. There are 17 rows: the 2026 notified-TB rate for each NCR LGU.
- **Intervals:** each prediction has an approximate 80% interval, taken from the 10th and 90th percentiles of the out-of-sample errors. These are empirical, not calibrated.
- **Not predicted:** 2026 case counts (no 2026 population was supplied), the NCR total, barangays, and any other period or region.

## 10. QA checks performed (all passed)
- **Loading:** both CSVs parse as UTF-8, both in pandas and in a headless browser using PapaParse (0 errors, `geo_code` kept as a string). The JSON is valid.
- **Structure:** the headers and field order match the contract exactly. All record IDs and prediction IDs are unique, and there are no duplicate observations.
- **Formats:** dates are YYYY-MM-DD and timestamps are ISO 8601. Numbers are well-formed, and there are no NaN, None or placeholder-zero values. Missing cells are empty.
- **Allowed values only:** period_type is annual; geo_level is region or city_municipality; and prediction geo_codes all appear in the observed data.
- **Prediction consistency:** every prediction's model_name, version and target match the evaluation file. The training cutoff (2025-12-31) falls before the target period (2026-01-01 to 2026-12-31).
- **Metrics:** they match the evaluation run, and an independent re-implementation reproduces them.
- **Nothing fabricated:** there are no invented geographic allocations, occupancy measures, population values or results.

## 11. Limitations and unresolved issues
- **Small dataset:** 17 units × 7 years, with 2019 missing and the COVID shock. The model only ties the baseline.
- **Notified, not incidence:** the target reflects case-finding effort as well as disease burden.
- **Inconsistent source labels:** the 2024 workbook labels its counts "New and Relapse", and the Makati and Taguig boundary change makes their rates incomparable across 2023→2024.
- **Integration not yet verified with Device A (unresolved).** The outputs load correctly in a generic browser test, but Device A's actual frontend has not loaded them yet, because Device B cannot reach Device A. That final contract check is still open.
- **Map boundaries:** Device A must supply its own NCR LGU boundary file, joined on `geo_code`.

## 12. Rerun command
```
pip install pandas openpyxl scikit-learn
mkdir raw output && unzip Tuberculosis_DS.zip -d raw
cp proximity_device_b/data_dictionary.md output/
python3 tools/data-pipeline/clean.py raw output && python3 tools/data-pipeline/model.py output && python3 tools/data-pipeline/validate.py output && python3 tools/data-pipeline/verify_model.py output
```
