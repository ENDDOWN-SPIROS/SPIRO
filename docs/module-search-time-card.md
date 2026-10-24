# Date/time, search and card update (2026-10-24)

Nea's request: remove the long date/time note, make the date field match the app, use HH:MM 24-hour time, list cities then places with full addresses, give suggestions while typing, rename the search to "Search Location", and show the pop-up card in the top-right corner with an animation.

## Changes in SPIRO.html
- **Date and time box:** the note ("Sat, Oct 24, 2026, 16:31:37. Illustrative only: ...") is removed. The date field now uses the app's border, corner radius, font and a teal calendar icon. Time is one field, "Time (24-hour)", with a clock icon and HH : MM selects (00–23 : 00–59). Seconds are gone, and every time label in the app now shows HH:MM (for example "Crowding, Sat, Oct 24, 2026, 17:05").
- **Search:** the label is now "Search Location", with the placeholder "Type a city or place". The browser's datalist was replaced by a suggestion list that opens on focus and updates as you type (accent-insensitive, matches the start of words first). Cities and the municipality come first, then public places. Each row shows the name and, under it, the address: cities as "Metro Manila (NCR), Philippines"; places as "Category · City, Metro Manila (NCR), Philippines". Arrow keys, Enter and Esc work, and it is a proper ARIA combobox.
- **Card:** on screens 900 px or wider, the city or place card now floats in the top-right corner, under the logo and above the map controls and legend. It slides in from the right when a new city or place opens, not on every time change. On phones and tablets it stays under the map and slides up. Reduced-motion settings turn the animation off.

## Limits
- The place list has no street addresses, so the "full address" stops at the city. Street addresses can be added if a source is provided.
- On phones the card stays at the bottom, because a top-right card would cover the controls on a 390 px screen.

## Checks (sandbox copy served by serve.ps1)
- Hour and minute set the state; seconds stay at 0.
- Typing "sm" lists SM malls with addresses; "quezon" lists Quezon City first, then Quezon Memorial Circle; Enter opens the card.
- Card animation plays (pcIn on desktop, pcUp on phones). On desktop the card's top is 68 px and it ends above the map controls.
- Full regression suite passed, contract tests 34 of 34, no horizontal scroll at 1366 px or 390 px, no console errors.
- Not yet checked on the laptop itself.

Backup: backup/pre-search-time/SPIRO.html
