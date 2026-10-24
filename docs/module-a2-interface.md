# Module A2: Version 5 interface, compared with the running SPIRO.html (2026-10-24)

I compared screenshots of the original `backup/version-5.original.html` and the current `SPIRO.html`, both loaded in Chromium at 1366 px and 390 px.

## Change made in this module
- Map controls (zoom in, zoom out, Metro Manila) moved to the **bottom-right**. They sit directly above the legend on desktop, and beside it on phones. The two are grouped in one flexbox container, so they can't overlap at any width.

## Matches version-5
- Same palette, fonts, white rounded panels with soft shadows, TB colour classes, legend style, city value labels, map area and the crowding colour ramp.
- Same TB cases / Crowding toggle and year select, now in the left column.
- `Cases | Per 100k` switch: removed (Module 4). Text size control: removed (Module 4). Neither appears anywhere.
- Flexbox/Grid layout. No horizontal or vertical page scroll at 1366, 820 or 390 px. No panels overlap in the tested states (map only, city card open, Settings open).

## Differences that remain (all on purpose, from Module 5.1 or Nea's later requests)
| version-5 | SPIRO.html now | Why |
|---|---|---|
| "TB Hotspot Map / Metro Manila" box at top left | Removed. Logo placeholder "SPIRO" at top right | 5.1 §11–12 |
| "Log in" button at top right | "Log In" inside Settings | 5.1 §12 |
| Hamburger menu as a side drawer | Gear button opens a centred Settings popup | 5.1 §14 |
| Toggle and year bar under the title box | Left column: toggle, then search, then year or date/time | 5.1 §9, §13 |
| Map controls at mid right, with a "whole Philippines" button | Bottom right, no Philippines button | A2 §5; 5.1 §2.4 |
| Gray regions outside NCR, with slivers | One precise mask outside NCR, plus an NCR outline | 5.1 §2.3 |
| Long city card with community reports | Short card: notified cases, population, last updated, precautions | 5.1 §3, §6 |
| Generated reference TB numbers | Device B's real FHSIS data, labelled "Notified TB cases" | Device B integration |

## Not verified
- Real OpenStreetMap tiles (blocked in my sandbox; a plain stand-in was used).
- Running on the laptop through serve.ps1.
