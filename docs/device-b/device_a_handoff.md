# Device B → Device A: final handoff

All four contract files are final and validated against the shared contract: exact headers and field order, UTF-8, YYYY-MM-DD dates, ISO 8601 timestamps, empty cells for missing values, and 10-digit string PSGC codes. No field was renamed.

## File locations
Project folder `proximity_device_b/`, also bundled as `proximity_device_b_outputs.zip`:

| File | Content |
|---|---|
| `cleaned_tb_data.csv` | 126 observed rows: NCR total + 17 LGUs × 2018, 2020–2025 |
| `tb_predictions.csv` | 17 model predictions: 2026 case rate per 100k for each NCR LGU |
| `model_evaluation.json` | `status: completed`; the model ties the "same as last year" baseline |
| `data_dictionary.md` | every field in both CSVs: type, meaning, source, missing values |

Supporting files: `data_inspection_report.md`, `model_task_decision.md`, `cleaning_log.txt` and `scripts/`.

## Field summary
- **Join key:** `geo_code`, a 10-digit PSGC code. Read it as a string. NCR = `1300000000`.
- **Observed data:** `case_count` (notified TB cases), `population`, and the calculated `case_rate_per_100k`.
- **Predicted data:** `predicted_value`, `lower_bound` and `upper_bound`, all in cases per 100,000. These live only in `tb_predictions.csv`.
- **Levels:** `geo_level` is `region` or `city_municipality`. Never sum both levels together.
- **Always empty:** `province` and `barangay` (no source data).
- **2025:** present for all 18 units, from `FINAL Tuberculosis_EB_2025.xlsx` / `Annual`. Use it as the default year.
- **2019:** absent. Show it as a gap.
- **Parsing:** use a quote-aware CSV parser, because `prediction_unit` contains a comma.

## Genuine sample (first rows of the actual files, unedited)

`cleaned_tb_data.csv`:
```
record_id,year,period_start,period_end,period_type,geo_level,geo_code,geo_name,province,city_municipality,barangay,case_count,population,case_rate_per_100k,source_file,source_sheet
2018-1300000000-annual,2018,2018-01-01,2018-12-31,annual,region,1300000000,National Capital Region (NCR),,,,51755,13481036,383.9097,ID TB 2018.xlsx,Table 2H.1
2018-1380400000-annual,2018,2018-01-01,2018-12-31,annual,city_municipality,1380400000,City of Malabon,,City of Malabon,,1896,382664,495.4738,ID TB 2018.xlsx,Table 2H.1
2025-1300000000-annual,2025,2025-01-01,2025-12-31,annual,region,1300000000,National Capital Region (NCR),,,,101500,14015646,724.1907,FINAL Tuberculosis_EB_2025.xlsx,Annual
2025-1380100000-annual,2025,2025-01-01,2025-12-31,annual,city_municipality,1380100000,City of Caloocan,,City of Caloocan,,13241,1743812,759.3135,FINAL Tuberculosis_EB_2025.xlsx,Annual
```

`tb_predictions.csv`:
```
prediction_id,generated_at,target_period_start,target_period_end,target_period_type,geo_level,geo_code,geo_name,target_variable,predicted_value,prediction_unit,model_name,model_version,training_data_end,lower_bound,upper_bound
2026-1380100000-case_rate_per_100k,2026-10-24T02:44:52+00:00,2026-01-01,2026-12-31,annual,city_municipality,1380100000,City of Caloocan,case_rate_per_100k,758.75,"cases per 100,000 population",ridge_mean_reversion_log_ratio,1.0.0,2025-12-31,631.73,906.51
2026-1380200000-case_rate_per_100k,2026-10-24T02:44:52+00:00,2026-01-01,2026-12-31,annual,city_municipality,1380200000,City of Las Piñas,case_rate_per_100k,666.12,"cases per 100,000 population",ridge_mean_reversion_log_ratio,1.0.0,2025-12-31,554.61,795.84
```

## Caveats to display
- Label values as **notified** cases and case notification rates, not incidence.
- Predictions are model output: show them separately from observed data, and note that the model performs about the same as "same as last year".
- 2020–21 counts are low because of COVID service disruption.
- The 2024 workbook labels its counts "New and Relapse".
- Makati and Taguig rates aren't comparable across 2023→2024, because of the EMBO boundary transfer.
- There is no overcrowding data, and no barangay data.
