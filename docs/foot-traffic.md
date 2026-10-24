# Foot traffic from OpenStreetMap

The Crowding tab shows one heatmap over Metro Manila. Its indicator is foot traffic, built from OpenStreetMap (OSM).

**Why it is a proxy.** OSM does not record how many people visit a place. It does record where the places that draw foot traffic are. SPIRO uses those places, weights each one by its type and by how busy that type usually is at the chosen day and hour, and spreads the result over about 350 m around each place.

## Data
- The browser asks the free Overpass API (`https://overpass-api.de/api/interpreter`, no key, no cost) for Metro Manila places tagged:
  - `shop=mall|department_store|supermarket`
  - `amenity=marketplace|bus_station|university|college|school|place_of_worship`
  - `railway=station` or `public_transport=station`
- Only points inside the NCR city boundaries are kept. A place mapped twice (as a point and as an area) counts once.
- The result is cached in the browser (`localStorage`, key `spiro.osm.foot.v1`) for 7 days, so Overpass is asked at most once a week per browser.
- The legend and each place card show the source: "© OpenStreetMap contributors (ODbL), N places downloaded <date> via the Overpass API".

Code: `src/models/foot-traffic-model.js` (download, cache, indicator) and `src/views/map-view.js` (heatmap drawing).

## Assumed weights (relative pull at a type's busiest hour)
Malls and department stores 10 · train stations 9 · public markets 7 · bus terminals and other stations 5 · universities and colleges 5 · supermarkets 2 · schools 2 · places of worship 1.5.

Malls, markets and stations use the same hourly shapes as the 52 listed places. Schools, universities, supermarkets and places of worship have simple stated shapes (for example, schools peak at 7:00 and 16:30 on weekdays and are closed on weekends).

## Scale
100% is the 95th percentile of the indicator at the downloaded places, each type at its busiest hour, so roughly "the busiest 5% of NCR". Bands: Low under 40%, Moderate 40–69%, High 70–89%, Very high 90% and above.

## If the download fails
The legend says the OSM places could not be downloaded and shows a "Try again" button. The map then falls back to an estimate blended from the 52 listed places (`data/places/public-places.json`): each point takes the inverse-distance average of their typical-week values, and a closed place counts as 0%. Place cards keep their typical-week chart either way.

## Limits
- This is not a headcount and not live. OSM coverage varies by area, and the weights are assumptions.
- A busy place is not evidence that TB is spreading there.
