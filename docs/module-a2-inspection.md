# Module A2: project files and initial inspection (Device A)

Date: 2026-10-24.

This is an inspection only. I changed no code in this step; the only file written is this report.

**How it was checked:** file and PowerShell tools on this PC, plus the Claude app's built-in browser on
`http://localhost:8000` served by `serve.ps1`. Desktop control (VS Code, File Explorer, Chrome) was
requested earlier and **denied** in the approval dialog, so nothing here was seen through the desktop.

## 1. Entry point

- **The real entry point is `SPIRO\version-5.html`.** There is no `index.html` in the active
  project. `serve.ps1` serves `version-5.html` when you open `/`.
- Other HTML files:
  - `tests\contract-tests.html`: Module 1 loader tests, test data only.
  - `backup\version-5.original.html`: untouched original, 550,636 bytes.
  - `backup\round5-2026-10-24\index.html` and `backup\round5-2026-10-24-working\index.html`: the
    earlier "Proximity" round, not used.
- `version-5.html` now differs from the original **only by the Module 1 changes** (see section 4). It
  is 3,036 lines and 549,418 bytes.

## 2. What is in version-5.html

I read the full code. The embedded data lines (one line each) were checked by their start and size,
not character by character.

| Lines | Content |
|---|---|
| 1–4 | Doctype, a minimal `<head>` with charset and viewport. **`<title>` and `<meta description>` sit inside `<body>`** (line 1 opens body). Browsers accept it, but the HTML is invalid |
| 5–8 | Google Fonts preconnect and stylesheet (Archivo, IBM Plex Mono, Public Sans); `assets/css/contract.css` (Module 1) |
| 9–672 | Inline Leaflet 1.9.4 CSS |
| 673–1131 | Inline app CSS in three blocks: base (tokens, text-size scale, buttons, forms), layout (map stage, top bar, layer bar, controls, legend, place card, menu, sheet, overview), components |
| 1136–1175 | SVG icon sprite (UI icons and six prevention icons) |
| 1177–1244 | Page skeleton: `#mapStage` (map, top bar, `#layerBar`, `#mapCtrls`, `#legend`, `#mapStatus`, `#placeCard`), menu, side sheet, overview, dialogs, toast |
| 1246–1253 | **Leaflet 1.9.4 JS, inline** (147 KB), not from a CDN |
| 1254–1258 | `window.PH_REGIONS`: Philippine regions, PSGC 2023 via faeldon/philippines-json-maps (MIT), simplified. Used to grey out areas outside NCR |
| 1259–1267 | `window.NCR_GEO`: 17 NCR city/municipality boundaries, PSGC 2023, with `id` and `psgc`; `window.CITY_LABEL_PT` label points |
| 1268–1272 | `window.VENUE_BASE`: 52 named public places (mall, market, transit, tourist) with approximate coordinates |
| 1274–1335 | Helpers (`$`, `esc`, `fmt`, `rng`, safe storage, `Emitter`, `toast`) |
| 1336–1338 | **Module 1:** `assets/js/models/contract-loader.js`, `assets/js/models/tb-data-model.js` |
| 1340–1553 | Models: `CITIES` (PSA 2020 populations), modelled venue busyness (`PLACES`), `AppModel` state; `ReportStore` (community reports in localStorage) |
| 1555–2667 | Views: `Charts`, `MapView`, `NavigationView`, `PlaceDetailsView`, `ReportsView`, `HealthGuideView`, `OverviewView` (two SDG icons as base64), `AdminView`, `LoginView` |
| 2668–2669 | **Module 1:** `assets/js/views/data-model-view.js` |
| 2671–3013 | Controllers: `MapController`, `ReportsController`, `AppController` (hash routes `#map`, `#overview`, `#guide`, `#report`, `#admin/<tab>`, `#dictionary`) |
| 3015–3034 | Entry point (async since Module 1) |

## 3. Files and dependencies

**Active project tree (excluding `backup\`):**

```
version-5.html               entry point (single file, everything else inline)
serve.ps1                    local server (PowerShell HttpListener, port 8000)
README.md
.claude\launch.json          launch config for the app's preview browser
assets\css\contract.css                 Module 1
assets\js\models\contract-loader.js     Module 1
assets\js\models\tb-data-model.js       Module 1
assets\js\views\data-model-view.js      Module 1
data\shared\README.md                   Device B's folder (no contract files yet)
docs\data-contract.md, docs\module-a2-inspection.md
tests\contract-tests.html, tests\fixtures\{valid,empty,malformed,wrong-header,pending,no-2025}\  (TEST DATA)
```

| Dependency | Source | Version or notes |
|---|---|---|
| Leaflet JS and CSS | **Local, inline in version-5.html** | 1.9.4 (confirmed `L.version` = "1.9.4" in the browser) |
| Map tiles | `https://tile.openstreetmap.org/{z}/{x}/{y}.png` | One `tileLayer`, maxZoom 19, OSM attribution bottom-right |
| Fonts | Google Fonts CDN | Archivo, IBM Plex Mono, Public Sans; falls back to system fonts offline |
| Boundaries | Inline JSON | PSGC 2023 via faeldon/philippines-json-maps (MIT) |
| Venues | Inline JSON | 52 places, approximate coordinates |
| Crowding values | Generated in the browser | Seeded-random typical-week curves; **modelled, not measured** |
| SDG icons | Inline base64 PNG | UN SDG 3 and 11 |
| Outbound links only | doh.gov.ph, who.int, cdc.gov, leafletjs.com, openstreetmap.org | — |

There is no npm `package.json`, no build step and no framework.

## 4. How the app starts and how the map is built

**Start-up order:**

1. `serve.ps1` serves the folder at `http://localhost:8000`. `/` opens `version-5.html`.
   - Only `data/shared` and `tests/fixtures/<case>` can be listed.
   - `backup\`, hidden files and `.env` are never served.
2. Inline CSS, then scripts in order: Leaflet → `PH_REGIONS` → `NCR_GEO` → `VENUE_BASE` → helpers →
   **contract-loader.js → tb-data-model.js** → models → views → **data-model-view.js** → controllers.
3. The entry point runs `ContractLoader.loadAll()`:
   - It reads the `data/shared/` listing, so absent files are known without failing requests.
   - It fetches and validates the four contract files.
4. Then `TbData.setData()` fills `YEARS`, `TB`, `yStatus` and `tbVal` from `cleaned_tb_data.csv`, and
   `PredData.setData()` loads the predictions.
5. Then `new AppController().start()` runs. Default state: layer TB, **year 2025**, measure count.
6. Test mode: on localhost only, `?fixtures=<case>` reads `tests/fixtures/<case>/` and shows a banner.

**Map (MapView.init):**
- `L.map("map")` with zoomControl off, `minZoom` 5, `maxZoom` 18 and `maxBounds` around the
  Philippines. The attribution sits bottom-right, with a Leaflet prefix.
- One OSM `tileLayer`. `tileload` and `tileerror` update a status pill.
- Panes:
  - `mask` (grey regions outside NCR);
  - `heat` (canvas crowd heat, crowding layer only);
  - city GeoJSON polygons (TB choropleth: count or rate classes, a tooltip, click to select);
  - `labels` (city names and values, zoom ≥ 11);
  - venue markers (crowding layer and pick mode).
- Custom zoom, NCR and Philippines buttons in `#mapCtrls`, top right under the bars.
- The legend is in `#legend`, **bottom right**.
- The top bar and layer bar float over the map. Their offsets are measured by JS (`watchBars`).

**Checked just now:** the page loads, Leaflet 1.9.4, 36 OSM tiles loaded, year 2025, all four contract
files "missing", no console errors.

## 5. Working features to keep

- TB layer by city with a year selector (2025 default), and the Cases | Per 100k switch (LGU only).
  Missing data is shown as missing.
- Crowding layer: modelled typical-week heat and markers by day and hour.
- City and place detail card: TB figures, busiest places, prevention row, community reports.
- Community reporting:
  - form with place picker, pick on map, photo upload or camera with downscale;
  - stored in localStorage only;
  - LGU review, dismiss, undo and delete;
  - photo lightbox.
- TB Health Guide, Overview page (features, definitions, SDGs), hamburger menu, and "Find a city or
  public place".
- LGU tools (front-end login only): TB history (chart and table, trend), crowding report, community
  reports dashboard, and **Data and model** (Module 1).
- Text size control (Small / Default / Large), still present because no module has asked to remove it.
- Accessibility: skip link, ARIA roles, focus handling, Escape to close.
- Module 1: contract loaders, missing and invalid states, data dictionary page, predictions and model
  status from Device B files only.

## 6. Installed tools (checked, nothing added)

| Tool | State |
|---|---|
| Python | Official python.org **3.12.10 embeddable** at `%LOCALAPPDATA%\Programs\Python\Python312-embed\python.exe`. Not on PATH, and has no pip, `ensurepip` or venv. `python` on PATH is the Microsoft Store stub |
| Node / npm / npx | Not installed |
| Git | Not installed; the project is not a git repository. A Git installer was seen in Downloads during Step 0, but it is not installed |
| VS Code | 1.143.0 installed (`code` on PATH). **No extensions installed** (`%USERPROFILE%\.vscode\extensions` contains only `extensions.json`) |
| PowerShell | Windows PowerShell 5.1, which runs `serve.ps1` |

## 7. File ownership plan

| Owner | Files |
|---|---|
| **Device A** (frontend, integration) | `version-5.html` and any HTML/CSS/JS split from it; `assets\**`; `serve.ps1`; `tests\**` (fixtures are test data only); `docs\data-contract.md`, `docs\module-a*.md`; `README.md`; `.claude\launch.json` |
| **Device B** (data, ML) | `data\shared\cleaned_tb_data.csv`, `tb_predictions.csv`, `model_evaluation.json`, `data_dictionary.md`; their cleaning and ML code and notebooks, in their own folder (suggested `device-b\` or `ml\`, their choice); the raw source data, including `Tuberculosis-Historical-Records.zip` |
| **Shared** (change only after agreeing) | The contract itself: file names, headers, types and state rules (`docs\data-contract.md` is Device A's copy of the agreed contract); `data\shared\README.md`; the `geo_level`, `period_type` and `geo_code` vocabularies; the meaning of `case_count` and `case_rate_per_100k` |

**Rules:**
- Device A never writes into `data\shared\`.
- Device B never edits the site files.
- A header change is a contract change: both sides agree, then Device A updates the loader and
  `docs\data-contract.md` in the same step.

## 8. Device B data paths and source data

- **Agreed drop folder:** `SPIRO\data\shared\`.
- **The four files:** `cleaned_tb_data.csv`, `tb_predictions.csv`, `model_evaluation.json`,
  `data_dictionary.md`.
- **Format:** UTF-8; exact headers in order; `YYYY-MM-DD` dates; ISO 8601 timestamps; empty CSV field
  or JSON `null` means missing; `geo_code` is a string. Full checklist in `docs\data-contract.md`.
- **Current state:** none of the four files is present. Only `data\shared\README.md` is there.

`Tuberculosis-Historical-Records.zip`, searched inside the PROXIMITY folder only:
- `backup\round5-2026-10-24\data\raw\Tuberculosis-Historical-Records.zip`
- `backup\round5-2026-10-24-working\data\raw\Tuberculosis-Historical-Records.zip`

Both are 3,881,328 bytes with the same SHA-256 (starting `3520922F884156D2`). It is **not** in the
active tree. It was originally copied from `C:\Users\eau\Downloads\` in an earlier round. I didn't
unzip, clean or model it in this module. It belongs to Device B, who should take it from one of those
paths or from Downloads.

## 9. Missing, broken or worth fixing (not fixed in this module)

1. `<title>` and `<meta description>` are inside `<body>` (invalid HTML; works in browsers).
2. The inline Leaflet ends with `//# sourceMappingURL=leaflet.js.map`. That file doesn't exist, so
   DevTools may request it and get a 404, but only while DevTools is open.
3. The Leaflet CSS points at `images/layers.png` and `images/marker-icon.png`, which don't exist. They
   are unused (no layers control, no default markers), so this is harmless.
4. The map-library fallback message says "Check that the vendor folder is next to index.html". That is
   misleading, because Leaflet is inline.
5. There is no favicon, so the browser's `/favicon.ico` request returns 404 (harmless).
6. Opening the file directly (`file://`):
   - fetch of the contract files fails;
   - OSM tiles are sent without a Referer, which is what triggered the "Access blocked" message.

   Use `serve.ps1`. The page doesn't yet tell users this when opened from a file.
7. The "Per 100k" classes stop at "600 or more". Real NCR rates are about 560–1,240 per 100k, so almost
   all cities would be in the top class.
8. The first map fit can be wrong when the page opens in a background tab (zero-size container).
9. Crowding curves are generated placeholders, and venue coordinates are approximate.
10. Login is front-end only; community reports stay in one browser.
11. There is no version control (no git), and Python has no pip, so a Python venv workflow isn't
    available without a new install. Ask first.

## 10. Implementation plan for the next modules (Device A)

This is a proposal; it follows Nea's master prompt and waits for each module's instructions.

1. **UI and map** (top priority):
   - rename to Proximity;
   - working city selector with "Back to all Metro Manila";
   - indoor/outdoor building and tree icons;
   - three-colour crowding with documented, provisional thresholds;
   - legend top-right with counts;
   - controls bottom-right;
   - compliant OSM setup with a `file://` notice;
   - remove the Cases | Per 100k switch, and decide on "Measures";
   - align the brand and layer containers with CSS grid or flex;
   - replace the text-size control with responsive type.

   Keep every feature in section 5.
2. **MVC split where practical:** move the inline CSS and JS into `assets\css` and
   `assets\js\{models,views,controllers}` without changing behaviour. Keep `version-5.html` working
   throughout.
3. **2025 default:** already done through Module 1. Keep it.
4. **Device B integration:** once real files arrive, check matching, the notices, and the rate classes
   (item 9.7) against real values.
5. **BestTime:**
   - only if a genuinely free tier exists and Nea provides a key;
   - the key goes in a server-side `.env` through a small local proxy, never in frontend code.
6. **Testing:** desktop, tablet and phone widths, console, tile failure, the fixture cases, and
   `tests\contract-tests.html`.

## 11. Open questions for Device B

1. `geo_level` values (`city` / `municipality`?) and `period_type` values (`annual`?).
2. `geo_code`: 10-digit PSGC as text (e.g. `1380600000` Manila, `1381701000` Pateros)?
3. Will region- or barangay-level rows be included in `cleaned_tb_data.csv`?
4. Is `case_rate_per_100k` always computed from the same row's `population`? Which population source?
5. Should `limitations` and `notes` in `model_evaluation.json` be a string or a list?
6. Where will Device B keep its cleaning and ML code, and will it share it with Device A?

## 12. Not verified

- Anything on the desktop: VS Code, File Explorer and Chrome access was denied.
- Real Device B files: none exist yet.
- Behaviour when opened as `file://`. The app's browser turns local files into static snapshots.
- Browsers other than the Claude app's built-in Chromium-based browser.
