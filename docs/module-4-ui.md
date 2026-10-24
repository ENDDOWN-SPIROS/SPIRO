# Module 4: design reference and UI requirements (Device A)

Date: 2026-10-24. Source of truth: `backup\version-5.original.html`. Backup taken before editing:
`backup\pre-module4\` (version-5.html and assets\).

## What changed

| # | Requirement | Result |
|---|---|---|
| 1 | Keep v5 arrangement | Unchanged. A line diff against the original shows only the Module 1/3 data and wording changes plus this module's changes |
| 2 | Selector lists only cities in the data | "Find a city or public place" (menu) now lists only cities with at least one valid `case_count` in `cleaned_tb_data.csv` (`TbData.citiesWithData()`). With no file: no cities are listed and a note says "No cities listed: Cleaned TB data not yet available." If only some cities are present it says "N of 17 cities have TB records". Public places stay listed, labelled "(modelled crowding)". v5's selector **did** work: selecting a city selects it, zooms to it and opens its card (tested with Pasig). It focuses rather than hides other cities; that is v5 behaviour and was kept |
| 3 | Default 2025 | Verified: 2025 selected in no-data, valid and no-2025 cases; no-2025 shows "2025 (no records)" and an explicit legend message |
| 4 | Dynamic legend, one indicator | The map shows **case_count only** (`MAP_MEASURE`). Legend rows are generated from the same `TB_BREAKS.count.edges` that colour the map, and show how many of the 17 cities fall in each class for the selected year (desktop/tablet). Breaks are v5's fixed classes (1,000 / 2,500 / 5,000 / 10,000) |
| 5 | Crowding colours and icons | Kept v5's continuous green→yellow→orange→red ramp and 4 marker levels (see thresholds). Not converted to 3 levels: v5 uses 4. **Building/tree icons not added**: venues only have `cat` = mall, market, transit, tourist; markets, stations and tourist sites (e.g. Rizal Park vs museums) mix indoor and outdoor, so indoor/outdoor would be a guess |
| 6 | Remove Cases \| Per 100k switch | Removed from the map layer bar and from app state. LGU tools → TB history keeps its own Cases / Per 100,000 table toggle; the LGU city card still shows the rate |
| 7 | Remove text-size control | Removed (top bar button, menu section, state, localStorage use, Escape handler, CSS). Root size is `clamp(0.9375rem, 0.85rem + 0.3vw, 1rem)`: 15px on phones, v5's 16px from ~820px. All sizes stay rem, so browser text settings still apply |
| 8 | Flex/Grid alignment | Containers were already flex/grid; no layout change needed. Fixed one overlap: in test mode the banner covered the brand at 820/390px; the top bar now sits under it (test mode only) |
| 9 | Overlap at 1366/820/390 | Checked (see evidence) |
| 10 | Map controls | Kept where v5 puts them: **top-right, under the top bars** (zoom in/out, Metro Manila, Philippines). Legend bottom-right. On touch phones v5 hides +/- (pinch zoom) |
| 11 | Preserve features | All kept; only the text-size control and map measure switch were removed, as asked |
| 12 | No show features | None added beyond the legend class counts and one threshold line in the crowding legend |

## Palette mapping

| Spec | v5 token | Decision |
|---|---|---|
| #122D40 Dark Navy | `--heading`, `--navy` | already used |
| #1C4055 Deep Blue | — | not needed anywhere; not added |
| #087F78 / #0B9990 Teal | `--primary` / `--primary-2` | already used |
| #E7F4EF Soft Mint | `--tint` | already used |
| #F4F7F8 Background | `--bg` | already used |
| #203B4C Dark Text | `--ink` | already used |
| #627585 Muted Gray | `--muted` is #5A6E7D | **kept #5A6E7D**: #627585 fails 4.5:1 on v5's light surfaces (4.43 on #F4F7F8, 4.29 on #EEF4F5, 4.22 on #E7F4EF, 4.15–4.2 on status backgrounds; 4.77 on white only). #5A6E7D passes on all (4.61–5.30) |
| #DFE8EB Border | `--line` | already used |
| #AD5B20 / #FFF1E3 Orange | test banner, "Prediction" tag (Module 1) | #AD5B20 on #FFF1E3 is 4.41:1, too low for the small tag text. Tag is now #AD5B20 on white with an orange border (4.89:1). White on #AD5B20 banner: 4.89:1 |
| #FFFFFF | `--surface` | already used |

Dark-mode tokens are v5's and unchanged.

## Crowding thresholds (unchanged from v5, now documented)

Values are each place's **modelled** typical-week busyness as a % of **its own busiest hour** (not occupancy,
not live, not a headcount). Levels: Low < 40%, Moderate 40–69%, High 70–89%, Very high ≥ 90%, Closed outside
opening hours. Colour ramp stops: 0 green #2E9D4F, 0.4 yellow #F2D43D, 0.7 orange #F28A1E, 1.0 red #D42A1F.
Rationale: relative-to-peak bands follow how popular-times services report busyness; the 40/70/90 cuts are v5's
and are provisional, not validated against measured crowding. The legend's "More about this layer" now lists them.

## Test evidence (localhost:8000, built-in browser, 2026-10-24)

- No data (`/`): year 2025; legend "Cleaned TB data not yet available."; no cities in Find list, note shown.
- `?fixtures=valid`: 17 cities listed; legend counts 1/3/5/8/0/0 = 17; Find → Pasig zooms and opens the card.
- `?fixtures=no-2025`: 2025 "(no records)" with explicit message; 3 cities listed; 2024 shows only when chosen.
- TB and crowding layers at 1366, 820 and 390 px, with and without a city card: script check found no overlap
  between top bar, layer bar, controls, legend, status pill and card, nothing outside the viewport, no horizontal
  scroll, no control under 24px. Root font 16px at 1366/820, 15px at 390.
- `tests/contract-tests.html`: 34 of 34 passed. No console errors on any page tested.

## Not verified

- 1366 px overlap script with the card open (visual check only at 1366); dark mode beyond a first look.
- LGU tools after login (TB history toggle, prediction tag rendering) were not re-clicked in this module.
- Real Device B files (none yet), other browsers, real phones.

## Files changed

`version-5.html`, `assets\js\models\tb-data-model.js` (`citiesWithData`), `assets\js\views\data-model-view.js`
(test-banner offset), `assets\css\contract.css` (banner offset, tag contrast), this document.
