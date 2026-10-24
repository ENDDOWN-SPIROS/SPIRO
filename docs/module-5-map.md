# Module 5: map and geographic integrity (Device A), 24 Oct 2026

The only file changed is `version-5.html`. The copy from before Module 5 is in `backup/pre-module5/version-5.html`.

I tested in headless Chromium on a cloud machine, against a copy of the SPIRO files. I did not test on the laptop (the laptop session was declined), so this needs a check on localhost there.

## Rule-by-rule

| Rule | Status | Evidence / change |
|---|---|---|
| Leaflet with compliant OSM tiles | Met | Leaflet 1.9.4 inline; tiles from tile.openstreetmap.org. The site is served from localhost (`serve.ps1`), which sends the Referer header that OSM requires. Added an explicit `referrerPolicy`. No bulk downloads, no prefetching, no paid provider. |
| Attribution | Met | Bottom-right: "Leaflet \| © OpenStreetMap contributors · Boundaries: PSGC 2023", with a link to the OSM copyright page. |
| Tile / map failures handled | Fixed | 1. If tiles fail, a notice says so, and the boundaries and layers still work. Tested: tiles are blocked in the test sandbox. 2. **New:** if the page is opened from disk (file://), a notice says to run `serve.ps1`. 3. **New:** if Leaflet itself fails, the map area shows a city × TB cases table instead of a blank panel. The old text pointed at a "vendor folder" that doesn't exist. |
| No paid services | Met | None used. |
| Tile limits not bypassed | Met | There's no proxying, caching or scraping of tiles. Note: OSM's public tiles suit light use only. A public deployment with real traffic would need a provider whose terms allow it, and that needs Nea's approval if it costs money. |
| No invented coordinates | Partly met; flagged | 1. City boundaries are PSGC 2023 polygons. 2. City labels sit at fixed label points and carry no data. 3. The 52 venue points were hand-placed approximate coordinates from the earlier prototype, and I could not verify them: the OSM geocoder is blocked from this machine. They are labelled "approximate and not verified". I checked each one against the city polygons: 49 of 52 fall in their stated city. The 3 that don't (Market! Market!, SM Aura Premier, Bonifacio High Street) are in BGC. The venues are correct as Taguig, but the PSGC 2023 boundary still draws Fort Bonifacio inside Makati (see below). |
| No city values at points labelled barangay | Met | TB data appears only as whole-city shading and city tables. Barangay or other non-city rows are already kept off the map by the Module 1 loader. Nothing is labelled barangay. |
| No false impression of verified occupancy | Fixed | 1. The crowd profiles used to add random per-place variation, which made each place look individually measured. **Removed:** every place of one type (mall, market, transit, tourist) now shares one assumed weekly pattern. 2. The heat surface used to smear colour across ~1 km per place, colouring areas with no listed place. **Now it's a ~300 m halo around each listed place.** The legend says "Colour appears only around the listed places; elsewhere there is no crowd data." |
| Proxy labelled as proxy | Fixed | These now say "Proxy … not measured, not live": the legend, marker tooltip, marker accessible label, place card, city card, overview definitions and feature card, and the LGU crowding report. |
| Busy ≠ TB spread | Met | "Reminder: A busy place is not evidence that TB is spreading there." is kept in the legend, place cards, guide and overview. |
| Only the supported geographic level | Met | City or municipality only. A legend note says so. |

## Boundary caveat (Makati / Taguig)
The PSGC 2023 boundary file still draws Fort Bonifacio and the EMBO barangays inside Makati. The 2023 Supreme Court ruling placed them in Taguig, and DOH figures from 2024 on follow that, so the Makati/Taguig counts shift. The TB legend's "More about this layer" note now says this. A newer boundary file would fix it. I didn't make one up.

## Crowding thresholds (unchanged from Module 4)
Each value is a share of that place's own busiest hour, under the assumed pattern for its type:
- Low: under 40%
- Moderate: 40–69%
- High: 70–89%
- Very high: 90% or more

These are relative levels, not occupancy or headcounts.

## Tests (headless Chromium, 1366 / 820 / 390 px)
- Attribution present.
- With tiles blocked, the tile-failure notice shows.
- With Leaflet blocked, the fallback table shows the 17 cities from the fixture data.
- All places of the same type now have identical patterns.
- The marker tooltip and legend show the proxy wording.
- No sideways scrolling at any of the three widths.
- `tests/contract-tests.html`: 34 of 34 passed.
- No console errors other than the blocked tile requests.

## Not verified
- On the laptop itself.
- With real street tiles: blocked in the test sandbox.
- The file:// notice: written, but not exercised in the test.
- Venue coordinates against a geocoder.
