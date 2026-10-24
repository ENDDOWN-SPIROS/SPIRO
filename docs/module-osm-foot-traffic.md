# Module: foot traffic from OpenStreetMap (2026-10-24)

**What changed.** The Crowding heatmap now uses a foot-traffic indicator built from OpenStreetMap (OSM). Before, it blended the typical-week estimates of 52 listed places.

**Why it's a proxy.** OSM does not record how many people visit a place. It does record where the places that draw foot traffic are. SPIRO uses those places, weights each one by its type and the typical busyness of that type at the chosen day and hour, and spreads the result over about 350 m around each place.

## Data
- Download: the browser asks the free Overpass API (`https://overpass-api.de/api/interpreter`, no key, no cost) for Metro Manila places tagged:
  - `shop=mall|department_store|supermarket`
  - `amenity=marketplace|bus_station|university|college|school|place_of_worship`
  - `railway=station` or `public_transport=station`
- Only points inside the NCR city boundaries are kept. A place mapped twice (as a point and as an area) counts once.
- The result is cached in the browser (`localStorage`, key `spiro.osm.foot.v1`) for 7 days, so Overpass is asked at most once a week per browser.
- Source shown on screen: "© OpenStreetMap contributors (ODbL), N places downloaded <date> via the Overpass API", in the legend and on each place card.

## Assumed weights (relative pull at a type's busiest hour)
Malls and department stores 10 · train stations 9 · public markets 7 · bus terminals and other stations 5 · universities and colleges 5 · supermarkets 2 · schools 2 · places of worship 1.5.
The hourly shapes for malls, markets and stations are the same ones SPIRO already used. Schools, universities, supermarkets and places of worship have simple stated shapes (for example, schools peak at 7:00 and 16:30 on weekdays and are closed on weekends).

## Scale
100% is the 95th percentile of the indicator at the downloaded places, each type at its busiest hour, so roughly "the busiest 5% of NCR". Bands: Low under 40%, Moderate 40–69%, High 70–89%, Very high 90% and above.

## If the download fails
The legend says OSM places could not be downloaded, shows a "Try again" button, and the map falls back to the old 52-place estimate. Place cards keep their typical-week chart either way.

## Limits
- This is not a headcount and not live. OSM coverage varies by area, and the weights are assumptions.
- A busy place is not evidence that TB is spreading there.
- It was tested with fake Overpass answers only, because Overpass is blocked from the build machine. The first real download happens when you open the Crowding tab on the laptop.

Backup of the previous page: `backup/pre-osm/SPIRO.html`.
