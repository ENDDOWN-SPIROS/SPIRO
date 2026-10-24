# Module 5.1: Map cleanup, UI refinement and geographic accuracy (full brief)

Date: 2026-10-24. Replaces the earlier partial 5.1 report.

## 1. Files
- **Modified:** `version-5.html` (all UI, map, cards, controls; community reporting and Overview code removed).
- **Created:** `docs/module-5.1-ui.md` (this report), `backup/module5.1-partial/version-5.html` (the first, partial 5.1 version).
- **Kept:** `backup/pre-module5.1/version-5.html` (the Module 5 version), all of `data/`, `assets/`, `tests/`. Nothing deleted on disk.

## 2. Map boundary and mask
- NCR outline = union of the 17 PSGC 2023 city/municipality polygons already in the file (computed with shapely, multipolygon parts kept, 2e-5° gaps between neighbours closed, [lat, lng] order checked). Embedded as `window.NCR_OUTLINE`.
- Mask = one polygon-with-holes: a box over the whole region with the NCR outline as the hole, gray at 50%. It covers land and sea outside NCR, never inside.
- NCR perimeter = white casing under a navy line, so it differs from a selected city (plain navy outline, no added fill).
- Browser focus rectangles on map shapes and card titles removed. City zoom capped at 12.5.
- Basemap: standard OpenStreetMap tiles kept (Nea's choice). **Water lines and ports cannot be removed** from these raster tiles without overlays, which the brief forbids. The only free alternative (CARTO Voyager) now needs an API key that would be visible in the page.
- Removed the "whole Philippines" map button. Zoom in/out and "Metro Manila" remain. Attribution: Leaflet, OpenStreetMap contributors, PSGC 2023 (PSA).

## 3. Population source (updated: 2025, at Nea's request)
DOH Field Health Services Information System (FHSIS) Annual 2025, Table 2.F.7.1, column "Projected Population (All Ages)". This is the same table and file as the 2025 TB counts ("FINAL Tuberculosis_EB_2025.xlsx"). The values are projections for 2025, not a census count. Rows are matched by PSGC code.

| City / municipality | 2025 projected | PSA 2020 Census |
|---|---:|---:|
| Caloocan | 1,743,812 | 1,661,584 |
| Las Piñas | 628,652 | 606,293 |
| Makati | 294,960 | 629,616 |
| Malabon | 396,996 | 380,522 |
| Mandaluyong | 442,115 | 425,758 |
| Manila | 1,911,556 | 1,846,513 |
| Marikina | 471,918 | 456,059 |
| Muntinlupa | 561,640 | 543,445 |
| Navotas | 260,395 | 247,543 |
| Parañaque | 716,560 | 689,992 |
| Pasay | 452,062 | 440,656 |
| Pasig | 842,708 | 803,159 |
| Quezon City | 3,079,478 | 2,960,048 |
| San Juan | 128,083 | 126,347 |
| Taguig | 1,271,871 | 886,722 |
| Valenzuela | 745,850 | 714,978 |
| Pateros | 66,990 | 65,227 |
| **NCR** | **14,015,646** | **13,484,462** |

The 17 rows add up exactly to the NCR row in the file. The 2025 figures follow current city limits, so the EMBO barangays count under Taguig. That is why Makati drops to 294,960 and Taguig rises to 1,271,871. The map polygons (PSGC 2023) still draw that area inside Makati. The card shows "(2025 projected)", and the TB legend shows the NCR total. The PSA 2020 values stay in the code as `pop2020` for reference.

## 4. Cards
- City heading only (no "City" label), in primary teal.
- **TB Cases mode:** TB cases for the chosen year (large), Population (smaller, "(2020)"), Last updated = month and year of `period_end` of the latest year with a valid count for that city in `cleaned_tb_data.csv`, with its period type and span. If no data: "No TB case data has been loaded yet." or "No TB case count for <city> in <year>." Busiest places and the "city-wide total" line are gone.
- **Crowding mode:** "Crowding risk level: Unavailable. Overcrowding risk cannot be assessed from the currently available data." There are no measured occupancy or headcount data, so no Low/Moderate/High is assigned to a city.
- Place cards (selected marker) remain, labelled as an estimated typical-week pattern, with the reminder.
- Precautions renamed "Take Precautionary Measures", 5 items in a compact grid. Get checked removed from cards (it stays in the TB Health Guide). New icons: double-headed arrow (distance), person covering a cough with the arm, hands under a tap with water.

## 5. Controls, Settings, popups
- Left column, in order: layer toggle (with Settings button), Find a city or public place (all 17 cities and the listed places), then the time box.
- Time box: TB mode shows Reporting year. Crowding mode shows a calendar date plus Hour, Minute and Second (24-hour). It is labelled illustrative: the date sets the weekday and the hour picks the assumed typical-week pattern, and minutes and seconds don't change it.
- On wide screens the selected card sits under the time box. On phones it sits under the map.
- The "TB Hotspot Map" box and the header Log in button were removed. A logo placeholder (the existing pin mark plus "Proximity", dashed border) sits at top right.
- Settings is an overlay popup centred over the map (a bottom sheet on phones). It contains Pages (Map, TB Health Guide), Display (theme, city labels, place markers) and one Log In entry ("Log In", for health office staff). Overview and the Data dictionary link were removed from it. The dictionary page itself and the data files are kept.
- Auto-close: switching layer closes the card and Settings. Leaving the map closes the card and Settings. Selecting a city or place closes Settings. Clicking outside or pressing Esc closes Settings. Changing the date or time updates an open place card.
- Community reporting removed: menu, cards, staff tab, form, photo viewer, storage code and styles. `#report` and `#overview` now open the map.

## 6. Tests (Playwright, Chromium, local server; OSM tiles stubbed, since they're blocked in my sandbox)
- Order of the left column is correct; the logo is top right; there is no header Log in.
- A real click on Quezon City selects it. Card text matches the fixture (6,600; 2,960,048; December 2025). Heading is teal. 5 precautions.
- Switching to Crowding closes the card. The crowding city card shows the unavailable state.
- Date 2026-10-26 with 14:30:45 sets weekday Monday. Note, legend and place card show "Mon, Oct 26, 2026, 14:30:45".
- Search finds SM Megamall. Settings opens centred, and closes on outside click and on layer switch. Opening the Guide clears the selection. `#overview` opens the map. The Log In dialog has no "LGU".
- Without fixture data (as on the laptop now), the TB card shows the empty states and no invented numbers.
- No horizontal or vertical page scroll at 1366, 820 and 390 px. `tests/contract-tests.html`: 34 of 34 passed. No console errors.

## 7. Limitations
- Water lines and ports remain on the OSM map.
- Not yet checked on the laptop with real tiles. `data/shared` on the laptop has no CSV files yet, so the live site shows the empty TB states.
- Venue coordinates are still unverified. PSGC 2023 still draws Fort Bonifacio in Makati.
- The logo is a placeholder.
- Staff-only "Data and model" text still says "LGU tools only" in one label inside `assets/js/views/data-model-view.js`, which was not edited.

## 8. Run
```
cd "C:\Users\eau\Documents\MSEUF\SPIRO"
powershell -ExecutionPolicy Bypass -File serve.ps1
```
Open http://localhost:8000/version-5.html and press Ctrl+Shift+R.

## 9. For the next Git commit
`version-5.html` (large diff), `docs/module-5.1-ui.md`, `backup/module5.1-partial/`. The localStorage key `tbmap.communityReports.v1` is no longer read. The new key `proximity.settings.v1` holds display preferences.
