# Module 3: compliance with the non-negotiable requirements (Device A)

Date: 2026-10-24. I audited the current PROXIMITY work (`version-5.html` plus the Module 1 files) and
fixed only small gaps. I didn't restructure anything or touch `data\shared\`.

**How it was checked:** file and PowerShell tools, plus the Claude app's built-in browser on
`http://localhost:8000` through `serve.ps1`. Desktop control was not available: access was denied
earlier.

| # | Rule | Status | Evidence |
|---|---|---|---|
| 1 | Copy version-5.html's UI closely | **Met** | The working page *is* version-5.html. All 5 inline CSS blocks are byte-identical to `backup\version-5.original.html`, and so is every colour (Module A colour check). Legend position, size, swatches and labels are unchanged. The only visible additions: an LGU tab "Data and model", a menu item "Data dictionary", a status pill when data rows are skipped, and a test-mode banner (test mode only) |
| 2 | Preserve components and interactions | **Met** | Kept, as listed in `docs\module-a2-inspection.md` §5: TB and crowding layers, year selector, Cases \| Per 100k (LGU), place cards, prevention row, community reports (form, pick on map, photo, review), health guide, overview, menu and search, LGU tools, text size, keyboard and ARIA behaviour. All seen working on localhost |
| 3 | ML must be on tabular data | **Not yet applicable to Device A** | Device A trains no model. The site only reads Device B's tabular outputs (`tb_predictions.csv`, `model_evaluation.json`) through the contract loader. Training is Device B's work |
| 4 | Clearly distinguish observed records from predictions | **Met** | Separate files and separate models: `TbData` from `cleaned_tb_data.csv`, `PredData` from `tb_predictions.csv`. Predictions appear only in LGU tools and city cards for LGU users, tagged "Prediction" with model, version, training end and bounds. They never appear on the public map or legend. Checked with `?fixtures=valid` |
| 5 | Never fabricate data, distributions, real-time crowding, training results or accuracy | **Met after fix** | (a) v5's generated TB "reference series" was removed in Module 1; TB comes only from Device B's file, and missing stays missing. (b) Model metrics are only rendered from `model_evaluation.json`, never hardcoded. (c) **Fixed now:** every crowding label says modelled, not live, and that place locations are approximate (see below) |
| 6 | Default year 2025 if supported; never substitute silently | **Met** | `AppModel.year = DEFAULT_YEAR` (2025). With no 2025 rows, 2025 stays selected, shows "(no records)", and the legend says no other year is used in its place. Checked with the `no-2025` fixture and the no-files state |
| 7 | Practical, about 3 hours | **Met** | Small, targeted changes only: three external JS files and one CSS file for Module 1, plus wording fixes. No rewrite |
| 8 | Practical MVC without a rewrite | **Met** | v5's existing inline model/view/controller classes are kept in place. Module 1 code sits in `assets\js\models\` (contract-loader, tb-data-model) and `assets\js\views\` (data-model-view), loaded before the matching inline blocks |
| 9 | Don't edit Device B's files | **Met** | `data\shared\` contains only `README.md` (written in Module 1, 2026-10-24 09:09, unchanged since). No contract files were created or edited. Test fixtures live only in `tests\fixtures\` |
| 10 | Don't claim anything not implemented and verified | **Met** | Reports list what was tested and what wasn't. Desktop access was denied and is reported. `file://` behaviour, other browsers and real Device B files are marked "not verified" |

## Rule 5 fixes made in this module (wording only, in v5's style)

| Where | Before | After |
|---|---|---|
| Crowd marker tooltip | "High: 72% of its busiest hour" | Adds a second line: "Typical week, modelled. Not live." |
| Crowd marker accessible label | "…on Wednesday at 6 PM, typical week." | "…, modelled typical week." |
| City card, busiest places note | "Typical week. Select a place…" | "Typical week, modelled. Not live. Select a place…" |
| Place card busy % | "29% of its busiest hour" | "29% of its busiest hour (modelled)" |
| Place card note | "Typical week, modelled. Not a headcount or live reading." | Adds: "Map location is approximate." |
| Overview, "What the numbers mean": Crowding | "…It is not a headcount and not a live reading." | Adds: "the weekly patterns are modelled, not measured" and "Place locations are approximate." |
| Overview feature card "Crowding heatmap" | "…from green to red." | Adds: "Modelled typical week, not live." |
| TB Health Guide, commuters | "The crowding layer on the map shows when places are usually busy" | "…shows a modelled estimate of when places are usually busy; it is not live…" |

Already correct in v5 and unchanged:
- legend: "Typical week, modelled. Not live." and "Not a headcount";
- LGU crowding report: "Modelled pattern, not a headcount or live reading";
- the community report form: reports "are not measurements".

## Tests run (localhost, serve.ps1, built-in browser)

- Crowding layer, Wed 6 PM: the marker tooltip and label show the new wording.
- City card (Quezon City) and place card (Rizal Park) show the new wording.
- Overview definition and feature card, and Health Guide sentence: new wording confirmed.
- `tests/contract-tests.html`: **34/34 pass**.
- Console errors: none.
- Colours and legend layout: unchanged (only text was edited).

## Known limits, not gaps in these rules

- Venue busyness curves are still modelled placeholders, now labelled everywhere. Measured data would
  need a source such as BestTime, through a free tier and a key from Nea.
- `CITIES` still carries v5's PSA 2020 populations. They are no longer used for any TB number (rates
  come from `case_rate_per_100k`, and the NCR rate from the file's `population`).
