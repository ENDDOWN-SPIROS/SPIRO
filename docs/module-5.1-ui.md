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

## 3. Population source
Philippine Statistics Authority, 2020 Census of Population and Housing, made official by Proclamation No. 1179, s. 2021. Reference date 1 May 2020. Coverage: total population of each NCR city and the municipality of Pateros, matched to the city ids that carry PSGC codes.

| City / municipality | Population (1 May 2020) |
|---|---:|
| Caloocan | 1,661,584 |
| Las Piñas | 606,293 |
| Makati | 629,616 |
| Malabon | 380,522 |
| Mandaluyong | 425,758 |
| Manila | 1,846,513 |
| Marikina | 456,059 |
| Muntinlupa | 543,445 |
| Navotas | 247,543 |
| Parañaque | 689,992 |
| Pasay | 440,656 |
| Pasig | 803,159 |
| Quezon City | 2,960,048 |
| San Juan | 126,347 |
| Taguig | 886,722 |
| Valenzuela | 714,978 |
| Pateros | 65,227 |
| **NCR total** | **13,484,462** |

Note: the 2020 census counted the EMBO barangays under Makati (before the 2023 Supreme Court ruling). Population is never shown as zero; it is not mixed with TB counts. A case rate is shown only to staff, and only when the cleaned file gives one.

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
