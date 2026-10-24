# SPIRO: Metro Manila TB hotspot map (version 5 + modules)

The working page is `SPIRO.html` (renamed from `version-5.html` on 2026-10-24). Module 1 adds the shared data contract on top of it;
nothing else from earlier rounds is applied.

## Run

```powershell
cd "C:\Users\eau\Documents\MSEUF\SPIRO"
powershell -ExecutionPolicy Bypass -File serve.ps1
```

Then open <http://localhost:8000> (it serves `SPIRO.html`). A server is required: the page
reads its data files with `fetch()`, which browsers block for pages opened as files.

## Shared data (Device B → Device A)

Device B puts four files in **`data/shared/`**:

| File | What the site does with it |
|---|---|
| `cleaned_tb_data.csv` | The only TB source for the map, city details and LGU TB history. 2025 is shown first |
| `tb_predictions.csv` | Predictions, labelled "Prediction", in LGU tools only |
| `model_evaluation.json` | Model status panel in LGU tools → Data and model |
| `data_dictionary.md` | "Data dictionary" page (menu and overview) |

Headers, types and every missing or invalid state are listed in `docs/data-contract.md`. While a
file is absent, the site says so ("Cleaned TB data not yet available", "not yet provided"). It never
falls back to built-in numbers; the generated reference series from version 5 was removed.

## Files added for Module 1

```
assets/js/models/contract-loader.js   fetch, CSV parsing, header checks, safe types, file states
assets/js/models/tb-data-model.js     TB values and predictions from the contract files (keeps v5's names)
assets/js/views/data-model-view.js    file status, notices, model status, predictions, dictionary page
assets/css/contract.css               styles for the above
data/shared/                          Device B's files go here (only a README for now)
docs/data-contract.md                 contract checklist and questions for Device B
tests/fixtures/                       TEST DATA ONLY (valid, empty, malformed, wrong-header, pending, no-2025)
tests/contract-tests.html             automated loader checks
serve.ps1                             local server
```

## Test mode

On localhost only, `SPIRO.html?fixtures=<case>` reads `tests/fixtures/<case>/` instead of
`data/shared/`. A "Test mode" banner appears and the tab title starts with `[TEST DATA]`.
Automated checks: <http://localhost:8000/tests/contract-tests.html>.

## Backups

- `backup/version-5.original.html`: the original, byte-identical.
- `backup/round5-2026-10-24/` and `backup/round5-2026-10-24-working/`: the earlier "Proximity" (now SPIRO)
  round, kept but not used.
