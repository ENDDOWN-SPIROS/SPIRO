# Crowding heatmap (2026-10-24)

Nea's request: "instead of circles make it a whole heatmap that covers the ncr and the color will be based on the number of overcrowding."

## What changed in SPIRO.html
- The Crowding layer no longer draws a circle for every place. It draws one continuous colour surface over all of NCR, clipped to the NCR outline.
- Each point's colour is the distance-weighted average (inverse distance, power 4, 400 m smoothing) of the estimated crowding at all 52 listed places for the chosen day and hour. A place that is usually closed counts as 0%.
- Colours use the same scale as before: green Low (under 40%), yellow Moderate (40–69%), orange High (70–89%), red Very high (90%+), as a share of each place's busiest hour.
- Areas between places are interpolated, not measured. The legend says so ("blended between 52 listed places"), and still says "Typical week, not live."
- A place picked from search still gets one small marker so you can see where it is.
- The "Place markers" switch was removed from Settings, since there are no place circles any more.
- Legend: gradient bar with 0/40/70/90% ticks plus the four levels.

## Limits
- The values are the same assumed typical-week pattern per place type as before, not counts of people.
- Far from any listed place the colour mostly reflects the nearest places, so it should be read as an estimate.
- A busy place is not evidence that TB is spreading there.

## Checks (sandbox copy served by serve.ps1)
- No place circles on the crowding layer; one marker for a selected place.
- Redraw about 30 ms on desktop, 12 ms on a phone-size screen.
- Full regression suite passed, contract tests 34 of 34, no horizontal scroll at 1366 px or 390 px, no page errors.
- Not yet checked on the laptop itself.

Backup of the previous page: backup/pre-heatmap/SPIRO.html
