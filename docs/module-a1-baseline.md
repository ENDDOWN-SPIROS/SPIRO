# Module A1: Project inventory and safe baseline (rechecked 2026-10-24)

State checked: after Module 5.1, Device B integration and the rename to `SPIRO.html`.

## 1. Project inventory
- **Folder:** `C:\Users\eau\Documents\MSEUF\SPIRO`, a Git repository (`.git` present).
- **Entry point:** `SPIRO.html`, renamed from `version-5.html`. `version-5.html` is now only a redirect to SPIRO.html.
- **Framework:** none. It's plain HTML, CSS and JavaScript, with Leaflet 1.9.4 inlined in the page and no build step. A local server is required because the page fetches the data files.
- **SPIRO.html** (2,601 lines) contains:
  - Inline data: NCR city boundaries (PSGC 2023), the NCR outline, Philippine regions, 52 listed public places, and city populations (2025 projected, DOH FHSIS).
  - Model: `AppModel`, which holds the state (layer, year, date and time, selection, settings, staff flag).
  - Views:
    - `MapView`: map, mask, layers, legend, and the left control column.
    - `NavigationView`: the Settings overlay and search.
    - `PlaceDetailsView`: city and place cards, and precautions.
    - `HealthGuideView`, `AdminView` (staff tools) and `LoginView` (front-end only).
  - Controllers: `MapController`, `AppController` (routes `#map`, `#guide`, `#dictionary`, `#admin/<tab>`).
- **Layout:**
  - Left column: TB cases/Crowding toggle and Settings button, "Find a city or public place", and Reporting year (TB) or Date and time (Crowding). The selected card sits below these.
  - Right side: logo placeholder, zoom and "Metro Manila" buttons, and the legend at the bottom right.
  - Map: OpenStreetMap tiles, with a gray mask outside NCR and the NCR outline.
- **External files:**
  - `assets/js/models/contract-loader.js`: reads and validates the 4 contract files.
  - `assets/js/models/tb-data-model.js`: turns cleaned_tb_data.csv into per-city, per-year values.
  - `assets/js/views/data-model-view.js`: Data and model tab, predictions, dictionary.
  - `assets/css/contract.css`.
  - `tests/contract-tests.html` with `tests/fixtures/` (6 cases).
  - `serve.ps1`, `README.md`, `docs/`, `backup/`.

## 2. What works (checked in a browser, Playwright/Chromium, local server)
- With Device B's real files, all four are "Loaded" and no rows are rejected. Years 2018 and 2020–2025 are available, 2019 shows as "no records", and 2025 is the default.
- Working: TB map and legend; city cards (notified cases, population, last updated); crowding layer with place cards; search; date/time; Settings overlay; TB Health Guide; data dictionary; staff tabs; front-end log-in.
- `tests/contract-tests.html`: 34 of 34 passed. No console errors. No page scrollbars at 1366, 820 or 390 px.

## 3. File ownership
- **Device A (frontend):** `SPIRO.html`, `version-5.html` (redirect), `assets/`, `tests/`, `docs/` (except `docs/device-b/`), `serve.ps1`, `README.md`.
- **Device B (data and ML):** `data/shared/` (the 4 contract files). Device B's supporting reports and scripts are kept read-only in `docs/device-b/`.

## 4. Frontend files to modify in later modules
`SPIRO.html` (most changes), `assets/js/models/tb-data-model.js`, `assets/js/views/data-model-view.js`, `assets/css/contract.css`, `tests/contract-tests.html`, `README.md`, `docs/`.
Never edit: `data/shared/*`, `docs/device-b/*`.

## 5. Data-integration plan (agreed: it matches Device B's `device_a_handoff.md`)
| File | Path | Used for |
|---|---|---|
| cleaned_tb_data.csv | `data/shared/` | TB map, city cards, staff TB history (observed only) |
| tb_predictions.csv | `data/shared/` | 2026 predictions, staff only, labelled "Prediction" |
| model_evaluation.json | `data/shared/` | Model status and metrics (Data and model tab) |
| data_dictionary.md | `data/shared/` | Data dictionary page |

- Loaded with `fetch` on page start and checked against the exact headers.
- Join key: `geo_code`, the 10-digit PSGC code, read as a string. Region rows (NCR total) are skipped on the map; city_municipality rows are drawn.
- Observed and predicted data are kept apart. A missing file or year shows an empty state, never a substitute value.
- Test data only through `?fixtures=<case>` on localhost.
- To update data: Device B replaces the files in `data/shared/` and the page is refreshed. No code change is needed.

## 6. Startup status and errors
- **Command:** `cd "C:\Users\eau\Documents\MSEUF\SPIRO"` then `powershell -ExecutionPolicy Bypass -File serve.ps1`, then open http://localhost:8000 (opens SPIRO.html). Alternative: `python -m http.server 8000`.
- **Started by me:** yes, in my own sandbox, with a Python local server and the same files: no errors.
- **Not run by me:** `serve.ps1` on the laptop itself. That needs a Remote Control session, or Nea running it.
- **Known issues:**
  - OpenStreetMap tiles were blocked in my sandbox, so tiles are unverified there.
  - Opening the file directly from disk (file://) blocks the data and tiles; the page shows a notice saying so.

## 7. Backups
`backup/` has a copy before each module (pre-module4, pre-module5, pre-module5.1, module5.1-partial, round5, version-5.original.html), plus Git.
