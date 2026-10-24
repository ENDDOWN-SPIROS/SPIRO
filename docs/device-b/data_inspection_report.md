# Proximity — TB Data Inspection Report (Device B → Device A)

**Prepared:** 2026-10-24.

**Source:** the supplied archive `Tuberculosis_DS.zip`.
- The project brief calls it `Tuberculosis-Historical-Records.zip`; it is the same supplied archive.
- SHA-256: `3520922f884156d21e7acbe7492efe9db4ddd88d076cb0a03563b868503b6139`.
- No outside datasets were used.

## Summary for Device A

| Question | Finding |
|---|---|
| Reporting period | **Annual (calendar year) only.** No monthly or quarterly data in any workbook or sheet. |
| Years available | **2018, 2020, 2021, 2022, 2023, 2024, 2025.** **2019 is missing** because no 2019 workbook was supplied. It has not been filled in. |
| 2025 available? | **Yes**, complete for all of NCR. Use 2025 as the default display year. |
| Geographic coverage in the files | The whole Philippines: region → province → city/municipality. The older files stop at province plus major cities; the 2024 and 2025 files go down to every municipality. |
| Coverage in our outputs | **NCR (= Metro Manila) only:** the NCR region total plus its 17 LGUs (16 cities + Pateros). |
| Barangay-level data | **None** in any workbook. Barangay maps cannot show TB data. |
| Population denominators | **Available** for every NCR row in every year, from the same sheet, area and year as the case counts. |
| Coordinates / boundaries | **None** in the files. Device A must source LGU boundaries separately, keyed on PSGC `geo_code`. |
| Overcrowding / occupancy data | **None** in the files. |

## Workbook-by-workbook inventory

Sheets marked **USED** feed `cleaned_tb_data.csv`. The others measure something different from the contract's `case_count`. They were inspected and left out.

| Workbook | Sheet | Content | Period | Geographic detail | Used? |
|---|---|---|---|---|---|
| ID TB 2018.xlsx | Table 2H.1 | Notified TB, all forms; population; CNR | 2018 annual | region / province / city (no PSGC codes) | **USED** |
| | Table 2H.2 | Treatment success rate | 2018 | same | no |
| | Table 2H.3–2H.5 | Smear-positive testing and retreatment outcomes | 2018 | same | no |
| | Table 2H.6 | Cases initiated on treatment, case detection rate | 2018 | same | no |
| ID TB 2020.xlsx | TB Table 1 | Notified TB, all forms (M/F/Total); population; CNR | 2020 annual | region / province / city (no PSGC) | **USED** |
| | TB Table 2 | Drug-resistant TB notification | 2020 | same | no |
| | TB Table 3–4 | Treatment success rate (drug-susceptible and MDR-TB) | 2020 | same | no |
| ID TB 2021.xlsx | TB Table 1–4 | Same layout as 2020 | 2021 annual | same | Table 1 **USED** |
| ID TB 2022.xlsx | Copy of cnr All Forms (+3 others) | Same layout as 2020 | 2022 annual | same | cnr **USED** |
| ID TB 2023.xlsx | Copy of Copy of cnr All Forms (+3 others) | Same, plus an "Unknown" sex column | 2023 annual | same | cnr **USED** |
| Tuberculosis_EB 2024.xlsx | CNR | PSGC; population; notified TB "All Forms (New and Relapse)" (M/F/Total); CNR; drug-resistant TB | 2024 annual | region / province / city / municipality, with PSGC | **USED** |
| | TSR | Treatment success rates | 2024 | same | no |
| FINAL Tuberculosis_EB_2025.xlsx | Annual | PSGC; projected population; notified TB all forms (M/F/Total); CNR; drug-resistant TB; presumptive TB tested | 2025 annual | region → municipality, with PSGC | **USED** |
| | TB-TPT, TB-TPT query | TB preventive treatment for contacts | 2025 | province / municipality | no |
| | TSR-DSTB, TSR-MDRTB, TSR | Treatment success rates | 2025 | region → municipality | no |
| | Annual_tested | Presumptive TB tested; testing rate | 2025 | national → municipality | no |
| | Population | Projected population by age and sex | 2025 | region → municipality | used only to cross-check the denominator |

## Quality checks (NCR rows)

**Totals and missing values**
- **Sum check:** in every year, the 17 LGU case counts add up exactly to the workbook's NCR total row (2018: 51,755 … 2025: 101,500).
- **Sex totals:** male + female (+ unknown in 2023) equals the total in 2020–2025. 2018 has totals only. Unknown-sex cases in NCR 2023: 0.
- **Missing values:** none in NCR case counts or populations.
- **Asterisks:** the 2025 workbook uses an asterisk to mean "incomplete data / no data submitted". No NCR cell carries one.

**Duplicates and naming**
- **Duplicate records:** none. Each NCR LGU appears once per year.
- **Repeated names elsewhere:** municipality names repeat across other provinces in the 2024 and 2025 files (e.g. "Alcala"). These rows are outside NCR, and PSGC codes keep them distinct.
- **PSGC codes:** the 2018–2023 workbooks have names only, with inconsistent spelling ("Malabon City" vs "City of Malabon"). These were matched to the 2025 PSGC codes. All 17 LGUs matched in all 7 years.

**Denominators and rates**
- **2025 denominator cross-check:** for all 18 NCR rows, population is identical across three sheets: `Annual`, `Population` (all ages total) and `Annual_tested`.
- **Calculated vs reported rates:** case_count / population × 100k matches each workbook's own CNR column to within 0.5, with one exception. City of Manila 2024 is 764.42 calculated vs 765.49 in the source. We publish the calculated value.

**Layout quirk**
- The 2020 sheet's header sits one row lower than in 2021–2022, and it has a national "No Location" row (304 cases, outside NCR). The parser locates rows by the NCR row and LGU names, not fixed row numbers.

## Module B1 audit: additional checks

**Layout, merged cells and footnotes**
- **Merged cells:** every used sheet has merged cells (7 to 16), but all of them sit in the title and header rows. None fall inside the NCR data block, so no values are hidden or shifted by merging.
- **Footnotes and legends:** the sheets carry "Source: DOH-ITIS", "Legend: * = No Report" (2018–2023) and "Asterisk (*) - incomplete data/no data submitted" (2025). No NCR cell carries an asterisk in any year.
- **Data types:** NCR case counts and populations are stored as numbers in every used sheet. Region, province and LGU names are text. In 2025 the PSGC codes are text, so leading zeros are preserved.

**Observations vs summaries**
- **Observed counts (used):** notified TB cases, all forms, per LGU per year.
- **Denominators (used):** projected population from the same row.
- **Derived, not used as observations:** the sheets' own CNR columns (rates per 100k, used only to cross-check our calculation), "%" testing rates, and treatment success rates.
- **Administrative totals:** the PHILIPPINES, region and province rows are sums of the rows beneath them. Only the NCR region row is kept, labelled `geo_level = region`.
- **Targets:** no sheet contains program targets.

**Overlap and double-counting**
- **One year per workbook:** each workbook covers exactly one calendar year (2018, 2020, …, 2025), as stated in its title. No year appears in two workbooks, so no records repeat across files.
- **Within 2025:** the same NCR populations appear in `Annual`, `Population` and `Annual_tested`. Only `Annual` is used, so nothing is counted twice.
- **Region vs LGU rows:** `cleaned_tb_data.csv` has both the NCR total and its 17 LGUs for each year. **Never add all rows together**; filter on `geo_level` first, or the total is doubled.

**Source code anomaly (2024)**
- In `Tuberculosis_EB 2024.xlsx` / `CNR`, the national PHILIPPINES row carries PSGC `1300000000`, which is the NCR code. The NCR row also carries `1300000000`. The pipeline identifies NCR by its row label, not by code, so this does not affect the outputs.

**Other candidate explanatory variables in the files**
- Sex breakdown of notifications (2020–2025), drug-resistant TB notifications, presumptive TB tested (2025 only), treatment success rates and TB preventive treatment (2025 only).
- None of these covers enough consistent years at LGU level to serve as model features without leakage or large gaps, so the model does not use them.

**Feasibility verdict**
- **Structured prediction:** feasible but weak. The most defensible target is the next-year annual case notification rate per NCR LGU. There are only 17 LGUs × 7 years, with 2019 missing and 2020–21 distorted by COVID.
- **Geographic mapping:** feasible at city/municipality level only, joined on the PSGC `geo_code`. The files contain no boundaries or coordinates, so Device A needs a separate NCR LGU boundary file. Barangay-level mapping of TB data is not feasible.

## Caveats Device A should show to users

1. **Definition label changes.**
   - 2024 labels counts as "Notified TB, All Forms (New and Relapse)".
   - 2018–2023 and 2025 say "all forms".
   - The files don't say whether 2024 counted differently. Comparisons involving 2024 should carry this note.
2. **Makati and Taguig boundary change.** Population falls in Makati from about 638k (2023) to about 298k (2024) and rises in Taguig from about 917k to about 1.27M. This is consistent with the EMBO barangays moving from Makati to Taguig. Rates for these two cities are **not comparable across 2023→2024**.
3. **COVID-19 disruption.** NCR notifications dropped in 2020 (34,554) and recovered by 2022–2023 (99k–111k). Trend charts should not present 2020–2021 as low TB burden.
4. **Notified is not incidence.** Counts reflect case-finding effort as well as disease burden. Labels should say "notified TB cases" and "case notification rate".
5. **Projected population.** Denominators are DOH projections. Some older years are fractional values, kept as supplied.
6. **2019 gap.** Trend charts must show a gap for 2019, not a line or bar drawn through it.

## What the data supports and does not support

| Supported | Not supported |
|---|---|
| Annual observed cases and rates for NCR and its 17 LGUs, 2018 and 2020–2025 | Monthly or quarterly views; any 2019 values |
| City/municipality choropleth for NCR | Barangay-level choropleth or hotspots |
| 1-year-ahead **rate** prediction for 2026 per LGU (see `model_evaluation.json`) | 2026 case-count predictions (no 2026 population supplied); NCR-total or barangay predictions |
| Sex breakdown (2020–2025): available in the source but not in the contract schema | Age breakdowns of notifications (not in the CNR sheets) |
| — | Overcrowding / occupancy measures (no source data; any such layer must be labelled a proxy or left unavailable) |

## Output files and paths

All Device B outputs are in `output/`. The bundled copy is `proximity_device_b_outputs.zip` → `proximity_device_b/`.

| File | Rows | Content |
|---|---|---|
| `cleaned_tb_data.csv` | 126 | observed records: 18 units × 7 years |
| `tb_predictions.csv` | 17 | 2026 predicted `case_rate_per_100k`, one per NCR LGU |
| `model_evaluation.json` | — | `status: completed`; the model performs about the same as the persistence baseline |
| `data_dictionary.md` | — | definitions of every field |
| `data_inspection_report.md` | — | this report |

**Join key:** `geo_code`, a 10-digit PSGC string; keep it as text. The NCR region is `1300000000`; LGUs are `13801…` to `1381701000`.

**Original data:** the supplied zip is untouched (the SHA-256 above matches the attachment). The extracted workbooks are kept as-is in `raw/`. All cleaned outputs are written separately to `output/`.
