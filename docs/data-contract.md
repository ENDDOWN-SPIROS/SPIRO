# Data contract

The data preparation step (cleaning and modelling, scripts in `docs/device-b/scripts/`) produces these four files. The website only reads them and never changes them.
**Location:** `data/`, next to `SPIRO.html`. The path is set once in `src/config/app-config.js`. The site reads them over
`http://localhost:8000` (run `serve.ps1`); browsers block `fetch()` from `file://`.

## General rules (as applied by the loader)

| Rule | What the site does |
|---|---|
| UTF-8, exact headers in order | A header mismatch rejects the whole file (state "Rejected"), listing missing or unexpected columns or saying the order is wrong |
| Dates `YYYY-MM-DD`, timestamps ISO 8601 | Invalid date or timestamp → `null` and flagged; the row is kept |
| Missing CSV value = empty field; missing JSON value = `null` | Empty → `null`. Never 0 |
| `geo_code` is a string | Kept as text, leading zeros intact |
| Numbers only when valid | `2,100`, `12a` and `-5` (for counts) → `null` and flagged |
| Wrong number of fields in a row | Row skipped and counted as malformed |
| Row without a year, a level, or both code and name | Row skipped and counted as malformed |
| Missing 2025 | 2025 shows "unavailable"; another year is never used |
| Observed vs predicted | Separate files, separate models, separate panels. Predictions are always tagged "Prediction" |

File states shown to users: **Loaded**, **No usable rows** (header only, or every row malformed),
**Not yet provided** (absent), **Could not be read** (fetch failed), **Rejected** (wrong header, bad JSON).

## 1. `cleaned_tb_data.csv` (observed TB records)

Header, exact:
`record_id,year,period_start,period_end,period_type,geo_level,geo_code,geo_name,province,city_municipality,barangay,case_count,population,case_rate_per_100k,source_file,source_sheet`

| Field | Type read as | Used by |
|---|---|---|
| record_id | string | data notices (via line numbers) |
| year | integer 1900–2100 (required) | year selector, map, legend, details, Admin TB history |
| period_start, period_end | date | read and validated; not displayed yet |
| period_type | string | only `annual` / `year` / `yearly` rows go on the yearly map; other types are counted in a notice |
| geo_level | string (required) | map accepts `city`, `municipality`, `city_municipality`, `city/municipality`, `citymun`; others (region, province, barangay…) are counted in a notice |
| geo_code | string | matched to the NCR boundary PSGC codes (e.g. `1380600000` = Manila) |
| geo_name | string | used if geo_code is empty or unknown; a code and name naming different cities → row not used |
| province, city_municipality, barangay | string | read; not displayed yet |
| case_count | whole number ≥ 0 | map colours (Cases), legend, city card, Admin table and chart |
| population | number | NCR-wide rate (Per 100k for "All of NCR") |
| case_rate_per_100k | number | map colours (Per 100k), city card, Admin table, trend |
| source_file, source_sheet | string | legend "Source:" line |

Duplicates (same city and year): identical values are kept once; conflicting values make that city and year "unavailable".

## 2. `tb_predictions.csv` (model outputs)

Header, exact:
`prediction_id,generated_at,target_period_start,target_period_end,target_period_type,geo_level,geo_code,geo_name,target_variable,predicted_value,prediction_unit,model_name,model_version,training_data_end,lower_bound,upper_bound`

| Field | Type | Used by |
|---|---|---|
| prediction_id | string | — |
| generated_at | timestamp | Predictions panel ("Generated …") |
| target_period_start/end | date | "Target period" column |
| target_period_type | string | read only |
| geo_level, geo_code, geo_name | string | same matching as TB; non-city levels counted in a notice |
| target_variable | string (required) | "Target" column |
| predicted_value | number | "Predicted" column, with prediction_unit |
| prediction_unit | string | shown after the value |
| model_name, model_version | string | "Model" column |
| training_data_end | date | "trained to …" |
| lower_bound, upper_bound | number | "Bounds" column, "not given" when empty |

Shown on each city card after the Admin log-in. Never on the public map, never mixed with observed cases.

## 3. `model_evaluation.json`

Required keys: `status` (`pending` | `completed` | `insufficient_data` | `failed`), `target_variable`, `prediction_horizon`, `geographic_level`, `feature_columns` (list or null), `excluded_columns` (list or null), `model_name`, `baseline_name`, `validation_method`, `training_rows`, `testing_rows` (whole number or null), `metrics` {`mae`,`rmse`,`r2`}, `baseline_metrics` {`mae`,`rmse`,`r2`} (numbers or null), `limitations`, `notes` (text, list or null).

A missing key, an unknown status or a wrong type → rejected, with the problems listed. The website reads and checks it on load. Metrics are only presented as results when status is `completed`; otherwise they are marked "not final". Nothing is hardcoded.

## 4. `data_dictionary.md`

Shown as plain text, escaped, on the "Data dictionary" page (opened with `#dictionary`). If absent: "Data dictionary not yet provided."

## Test fixtures

`tests/fixtures/<case>/` holds TEST data only. The site reads a fixture folder only on localhost with `?fixtures=<case>`, and then shows a "Test mode" banner and "[TEST DATA]" in the tab title. Automated checks: `http://localhost:8000/tests/contract-tests.html`.
