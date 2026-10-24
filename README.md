# SPIRO

## Website description

SPIRO is a map website for Metro Manila (NCR) that brings two views together:

- **TB cases:** notified tuberculosis cases for each of the 17 cities and municipality, from DOH records for 2018 and 2020–2025. 2025 is shown first.
- **Crowding:** one heatmap that covers NCR. Its colours come from an estimated typical-week busyness pattern for 52 malls, public markets, transit stations and landmarks. You pick a date and a time (24-hour HH:MM).

Selecting a city shows its notified cases, its population and when the data were last updated. Selecting a place shows its estimated crowding for the chosen day, with an hour-by-hour chart. Both cards list simple precautions. The site also includes:

- an introduction page, which is the first page you see;
- a TB Health Guide covering symptoms, prevention and free testing;
- staff tools, reached after a log-in, with TB history, a crowding report, the data and model status, and the model's 2026 predictions.

SPIRO does not show live data. Crowding is an estimate, and a busy place is not evidence that TB is spreading there.

## Problem it solves

TB spreads through the air. Risk is higher when people spend long periods close together in crowded, poorly ventilated indoor places. Metro Manila notified 101,500 TB cases in 2025 (DOH FHSIS), yet:

- the public has no simple way to see where cases are reported, or when shared places such as malls, markets and stations are usually busiest;
- health offices have no single view that puts reported cases and crowding side by side to help them target prevention and screening.

SPIRO gives both groups that view on one map, together with plain-language guidance on what to do.

## Datasets used

| Dataset | What it holds | How SPIRO uses it |
|---|---|---|
| DOH Field Health Services Information System (FHSIS) TB tables, NCR: `ID TB 2018.xlsx`, `ID TB 2020–2023.xlsx`, `Tuberculosis_EB 2024.xlsx`, `FINAL Tuberculosis_EB_2025.xlsx` (supplied as `Tuberculosis_DS.zip`) | Notified TB cases (all forms) and population for each NCR city, 2018 and 2020–2025. There is no 2019 file. 2024 counts "new and relapse" only. | Cleaned by Device B into `data/shared/cleaned_tb_data.csv` (126 rows: NCR plus 17 cities, 7 years). This is the only source of TB numbers on the map, the cards and the staff tables. |
| DOH FHSIS Annual 2025, Table 2.F.7.1 | Projected population (all ages) for 2025, by city. The NCR total is 14,015,646. | Population shown on the city cards; the denominator for rates. |
| PSA 2020 Census of Population | City populations in 2020 | Kept for reference (`pop2020`). |
| PSGC 2023 boundaries (PSA), via faeldon/philippines-json-maps (MIT licence) | City, municipality and region polygons | City shapes, the NCR outline, and the grey mask outside NCR. |
| `data/shared/tb_predictions.csv` and `model_evaluation.json` (Device B) | 2026 predicted TB case rate per 100,000 for each city (ridge mean-reversion model), with its back-test results | Shown only in the staff tools and labelled "Prediction". |
| SPIRO public-place list (built into `SPIRO.html`) | 52 public places with approximate coordinates, each checked to fall inside its city, and an assumed typical-week busyness shape for each place type (mall, market, transit, tourist spot) | The crowding heatmap and the place cards. These patterns are a proxy: they are not measured, not live and not headcounts. |

Full field definitions: `data/shared/data_dictionary.md`. Data contract: `docs/data-contract.md`.

## Sources used

- Department of Health (Philippines), Field Health Services Information System (FHSIS) TB and population tables: https://doh.gov.ph/
- Philippine Statistics Authority (PSA): PSGC 2023 boundaries and the 2020 Census of Population: https://psa.gov.ph/
- faeldon/philippines-json-maps (PSGC 2023 GeoJSON, MIT licence): https://github.com/faeldon/philippines-json-maps
- OpenStreetMap contributors, street map tiles (© OpenStreetMap, ODbL): https://www.openstreetmap.org/copyright
- Leaflet 1.9.4, the map library (BSD-2-Clause): https://leafletjs.com
- World Health Organization, tuberculosis fact sheet: https://www.who.int/news-room/fact-sheets/detail/tuberculosis
- US Centers for Disease Control and Prevention (CDC), TB basics: https://www.cdc.gov/tb/
- Google Fonts (Archivo, Public Sans, IBM Plex Mono): https://fonts.google.com

## Run it locally

```powershell
cd "C:\Users\eau\Documents\MSEUF\SPIRO"
powershell -ExecutionPolicy Bypass -File serve.ps1
```

Then open http://localhost:8000. The site needs this local server, because it reads the files in `data/shared/` with `fetch()`, and browsers block that for pages opened straight from disk.

- Contract tests: http://localhost:8000/tests/contract-tests.html
- Test mode (localhost only): `SPIRO.html?fixtures=<case>` reads `tests/fixtures/<case>/` instead of the real data.
- Backups of earlier versions are in `backup/`.
