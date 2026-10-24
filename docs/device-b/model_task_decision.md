# Module B3 — Prediction task decision (Device B)

Based on `data_inspection_report.md` and `cleaned_tb_data.csv` (126 observed rows).

| Item | Decision |
|---|---|
| Target variable | `case_rate_per_100k`: notified TB cases (all forms) per 100,000 projected population |
| Reporting frequency | Annual (calendar year). There is no monthly or quarterly data. |
| Geographic level | `city_municipality`: the 17 NCR LGUs. No barangay predictions and no NCR-total prediction. |
| Prediction horizon | 1 year ahead: 2026, from data through 2025 |
| Features | Last year's rate for the LGU, and how far that rate sits from the NCR average that year. Both use year t-1 data only. |
| Baseline | Persistence: next year's rate equals this year's observed rate |
| Validation | Rolling-origin by year. Test on 2023, 2024 and 2025 in turn, training each time only on earlier years. |
| Schema change needed | None. This fits the existing `tb_predictions.csv` and `model_evaluation.json`. |

## Why the data supports this (modestly)
- **Comparable repeated observations:** the same 17 LGUs, with the same definition and PSGC codes, are observed every year from 2018 to 2025 except 2019.
- **Matched denominators:** every row has a population from the same sheet, area and year, so rates are comparable across LGUs of very different size.
- **Enough for a small honest test:** 5 consecutive-year transitions give 83 usable rows after exclusions, and 49 out-of-sample test predictions across 3 test years.

## Why rate rather than case count
- **Comparability:** rates compare across LGUs whose populations range from about 65k (Pateros) to about 3M (Quezon City).
- **Trade-off:** no 2026 population figure was supplied, so a predicted rate cannot be turned into a predicted count. Counts are therefore not exported.
- **Alternative:** a direct count forecast is possible if Device A needs counts. Switching is a target change and would be agreed with Device A first.

## Leakage and excluded fields
- **No future data:** features use only year t-1 data. The NCR average is computed from the same t-1 year. No test-year values enter training.
- **Excluded as identifiers or provenance:** `record_id`, `geo_code`, `geo_name`, `source_file` and `source_sheet`.
- **Excluded because they are constant or empty:** `period_*`, `province` and `barangay`.
- **Excluded as target-derived:** `case_count` and `population` for the target year.
- **Makati and Taguig:** their 2023→2024 transitions are excluded because of the denominator break from the EMBO boundary transfer.
- **Rows that are not observations of the same level:** the NCR total row is not used as a training row.

## Overcrowding
No overcrowding or occupancy data exists in the supplied files, so the model does not use it. No proxy was created.

## Known limitations
- **Small dataset:** only 17 units × 7 years, and the 2019 gap removes the 2018→2020 transition.
- **COVID disruption:** the 2020–2022 drop and rebound distorts the trend.
- **Notified, not true incidence:** the target reflects case-finding effort as well as disease burden.
- **2024 label:** the 2024 counts are labelled "New and Relapse".
- **Weak result:** the model is expected to be at best marginally better than persistence. The earlier run confirmed it ties persistence.
