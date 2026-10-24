# Module A5: Final integration, testing and handoff (2026-10-24)

## Verdict
**The final application was started with the real startup command (`serve.ps1`) and verified in a browser.** It loads all four of Device B's files with real data and passed every test listed below.
Two caveats:
1. `serve.ps1` was run under PowerShell 7 in my Linux sandbox, using an exact copy of the SPIRO folder. It has not been run on the laptop's Windows PowerShell by me.
2. Real OpenStreetMap tiles were blocked in the sandbox, so a plain stand-in was used. Their failure handling was tested.

## 1. Files created and changed (Device A, this session)
- **Created:**
  - `SPIRO.html` (main page, renamed from version-5.html).
  - `docs/module-5-map.md`, `docs/module-5.1-ui.md`, `docs/module-a1-baseline.md`, `docs/module-a2-interface.md`, `docs/final-handoff-report.md`.
  - `docs/device-b/` (Device B's reports and scripts, kept as received).
  - Backups: `backup/pre-module5`, `pre-module5.1`, `module5.1-partial`, `pre-a2`, `pre-a5`.
- **Changed:**
  - `version-5.html` (now a redirect to SPIRO.html).
  - `serve.ps1` ("/" opens SPIRO.html).
  - `README.md`, `data/shared/README.md` (file name).
  - `assets/js/models/tb-data-model.js` (skips NCR region rows quietly).
  - `assets/js/views/data-model-view.js` ("staff tools" wording).
- **Copied in from Device B, unedited:** `data/shared/cleaned_tb_data.csv`, `tb_predictions.csv`, `model_evaluation.json`, `data_dictionary.md`.
- **Structure:** unchanged (same folders; one HTML entry page plus `assets/`, `tests/`, `data/shared/`).

## 2. Features
- **TB map:** city choropleth of notified TB cases, years 2018 and 2020–2025, with 2019 shown as "no records" and 2025 as the default. Legend with counts per class and the NCR population.
- **City card:**
  - Notified cases, plus the population for that year from the file.
  - Last updated, taken from `period_end`.
  - Source line, and precautions.
- **Staff view:** rate, rank and trend; the 2026 prediction labelled "Prediction" with its bounds; TB history; Data and model status (model vs. baseline metrics); data dictionary.
- **Crowding layer:** assumed typical-week pattern for 52 listed places. It's labelled illustrative or estimated, and city risk is shown as unavailable.
- **Controls:**
  - Search for any of the 17 cities or listed places.
  - Calendar date with hour, minute and second.
  - Settings overlay (theme, labels, markers, Log In, front-end only).
  - Bottom-right zoom and Metro Manila buttons.
- **Map:** precise gray mask outside NCR, NCR outline, OSM attribution. If the map library is missing, a table is shown instead; if tiles fail, a notice is shown.

## 3. Tests performed (Playwright/Chromium against `serve.ps1` on http://localhost:8000)
| Test | Result |
|---|---|
| Device B headers vs contract (both CSVs exact; JSON keys complete) | Pass |
| `/` opens SPIRO.html; title "SPIRO"; all 4 files "ok"; no test banner on real data | Pass |
| Default year 2025; year list 2018, 2019 (no records), 2020–2025 | Pass |
| 2019 shows an honest "no annual city rows" message; 2018 QC = 11,947 | Pass |
| Search "Pateros" selects it; card shows 575 cases, 66,990 population (2025) | Pass |
| Public card has no predictions; staff card shows the prediction separately, after the observed data | Pass |
| Staff TB history, Data and model (status completed), dictionary page | Pass |
| Settings opens; TB Health Guide opens and closes back to the map | Pass |
| Crowding layer, date 2026-11-01 (Sunday) with 18:15:09 sets the state correctly; zoom buttons work | Pass |
| `version-5.html#guide` forwards to `SPIRO.html#guide` | Pass |
| Fixtures: valid, empty, malformed, wrong-header, pending, no-2025, missing folder each show the right file states, a test banner, and no invented values | Pass |
| Leaflet blocked: a notice plus the TB table appears | Pass |
| Tiles blocked: "Street map tiles could not load" notice; the layers still work | Pass |
| 1366×800 and 390×844 with a card open: no page scroll, no overlaps | Pass |
| `tests/contract-tests.html` | 34 of 34 passed |
| Console on real data | No errors. The only errors came from the deliberate missing-file and blocked-tile tests |
| Server output (`serve-output.log`) | All 200, except the expected 404s: the missing-fixture test, and `/backup/` (blocked on purpose) |

## 4. Run
```
cd "C:\Users\eau\Documents\MSEUF\SPIRO"
powershell -ExecutionPolicy Bypass -File serve.ps1
```
Open http://localhost:8000 (opens SPIRO.html). Alternative: `python -m http.server 8000`, then http://localhost:8000/SPIRO.html.

## 5. Paths used for Device B's outputs
`data/shared/cleaned_tb_data.csv`, `data/shared/tb_predictions.csv`, `data/shared/model_evaluation.json`, `data/shared/data_dictionary.md`. They're relative to SPIRO.html and loaded with fetch on page load. Test data is read only with `?fixtures=<case>` on localhost, which always shows a test banner.

## 6. UI differences from version-5.html
See `docs/module-a2-interface.md`. In short:
- The title box was removed and a logo placeholder added.
- Log In moved into Settings, which is now a popup.
- Search and date/time are in a left column.
- The Philippines button was removed; the map controls are at the bottom right.
- The mask is precise.
- Cards are shorter.
- Community reports and Overview were removed.

## 7. Limitations
- **Model:** a 2026 case-rate prediction per city. Its error is about the same as "same as last year" (MAE 96.9 vs 95.5). It's very small data (17 cities × 7 years), and it's shown to staff only.
- **Data:**
  - No 2019 data.
  - 2020–21 counts are low because of COVID.
  - The 2024 workbook counts "new and relapse" cases.
  - The EMBO transfer breaks Makati/Taguig comparisons from 2023 to 2024.
  - There's no barangay data, and no measured crowding data.
- **Map:**
  - PSGC 2023 boundaries still draw EMBO in Makati.
  - Venue coordinates are not verified.
  - OSM water lines and ports remain.
  - Tiles are unverified from the sandbox.
- **Log-in:** front end only, not secure.
- **Not done by me:** running serve.ps1 on the laptop itself. Nea, please run it once to confirm.
