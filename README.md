# SPIRO

## Website description

SPIRO is a map website for Metro Manila (NCR) that brings three views together:

- **TB cases:** notified tuberculosis cases for each of the 17 cities and municipality, from DOH records for 2018 and 2020–2025. 2025 is shown first.
- **Crowding:** one heatmap that covers NCR, using foot traffic as the indicator. It is built from OpenStreetMap places that draw foot traffic (malls, markets, train and bus stations, schools, places of worship), each weighted by its type and how busy that type usually is at the date and time you pick (24-hour HH:MM). It is an estimate, not a headcount.
- **Facilities:** pins for the 385 PhilHealth-accredited TB-DOTS facilities in NCR, coloured by government or private and marked as hospital, health center or clinic. Each pin sits at the centre of the facility's barangay, not the exact building. 86 facilities whose barangay could not be matched are listed in the tab but have no pin. Facilities whose accreditation date has passed show grey.

Selecting a city shows its notified cases, its population and when the data were last updated. Selecting a place shows its estimated crowding for the chosen day, with an hour-by-hour chart. Both cards list simple precautions. Selecting a facility shows its address, its TB-DOTS accreditation and end date, its phone and email when the list has them, and a directions link. The site also includes:

- an introduction page, which is the first page you see;
- a TB Health Guide covering symptoms, prevention and free testing;
- Admin tools, reached after a log-in, with TB history and a crowding report. When logged in, city cards also show the model's 2026 prediction.

SPIRO does not show live data. Crowding is an estimate, and a busy place is not evidence that TB is spreading there.

## Problem it solves

TB spreads through the air. Risk is higher when people spend long periods close together in crowded, poorly ventilated indoor places. Metro Manila notified 101,500 TB cases in 2025 (DOH FHSIS), yet:

- the public has no simple way to see where cases are reported, or when shared places such as malls, markets and stations are usually busiest;
- people who need a check-up have no simple way to find the nearest accredited TB-DOTS facility;
- health offices have no single view that puts reported cases and crowding side by side to help them target prevention and screening.

SPIRO gives both groups that view on one map, together with plain-language guidance on what to do.

## Datasets used

| Dataset | What it holds | How SPIRO uses it |
|---|---|---|
| DOH Field Health Services Information System (FHSIS) TB tables, NCR: `ID TB 2018.xlsx`, `ID TB 2020–2023.xlsx`, `Tuberculosis_EB 2024.xlsx`, `FINAL Tuberculosis_EB_2025.xlsx` (supplied as `Tuberculosis_DS.zip`) | Notified TB cases (all forms) and population for each NCR city, 2018 and 2020–2025. There is no 2019 file. 2024 counts "new and relapse" only. | Cleaned by Device B into `data/shared/cleaned_tb_data.csv` (126 rows: NCR plus 17 cities, 7 years). This is the only source of TB numbers on the map, the cards and the Admin tables. |
| DOH FHSIS Annual 2025, Table 2.F.7.1 | Projected population (all ages) for 2025, by city. The NCR total is 14,015,646. | Population shown on the city cards; the denominator for rates. |
| PSA 2020 Census of Population | City populations in 2020 | Kept for reference (`pop2020`). |
| PSGC 2023 boundaries (PSA), via faeldon/philippines-json-maps (MIT licence) | City, municipality and region polygons | City shapes, the NCR outline, and the grey mask outside NCR. |
| `data/shared/tb_predictions.csv` and `model_evaluation.json` (Device B) | 2026 predicted TB case rate per 100,000 for each city (ridge mean-reversion model), with its back-test results | Shown only on city cards after the Admin log-in, labelled "Prediction". |
| OpenStreetMap places that draw foot traffic, downloaded in the browser from the Overpass API (cached for 7 days) | Locations and types of malls, supermarkets, public markets, train and bus stations, schools, universities and places of worship in NCR | The foot-traffic heatmap on the Crowding tab, and the "Foot traffic around here" line on place cards. Method: `docs/module-osm-foot-traffic.md`. |
| SPIRO public-place list (built into `SPIRO.html`) | 52 public places with approximate coordinates, each checked to fall inside its city, and an assumed typical-week busyness shape for each place type (mall, market, transit, tourist spot) | The crowding heatmap and the place cards. These patterns are a proxy: they are not measured, not live and not headcounts. |
| PhilHealth, *List of Accredited TB DOTS Clinics for CY 2026* (updated September 30, 2026), NCR section, list nos. 599–983 | Name, phone, email, street address, city, accreditation end date and sector (government or private) of each accredited TB-DOTS facility | Extracted into `data/facilities/facilities.csv` (385 rows, no duplicates). Each address was matched to its PSGC 2023 barangay to place the pin. The Facilities tab, facility cards and search. |

Full field definitions: `data/shared/data_dictionary.md`. Data contract: `docs/data-contract.md`. How the facility list was built: `docs/module-tb-facilities.md`.

## Sources used

- PhilHealth, accredited health care providers (TB-DOTS clinics): https://www.philhealth.gov.ph/partners/providers/
- Department of Health (Philippines), Field Health Services Information System (FHSIS) TB and population tables: https://doh.gov.ph/
- Philippine Statistics Authority (PSA): PSGC 2023 boundaries and the 2020 Census of Population: https://psa.gov.ph/
- faeldon/philippines-json-maps (PSGC 2023 GeoJSON, MIT licence): https://github.com/faeldon/philippines-json-maps
- OpenStreetMap contributors, street map tiles and foot-traffic places (© OpenStreetMap, ODbL): https://www.openstreetmap.org/copyright
- Overpass API, used to download OpenStreetMap places: https://wiki.openstreetmap.org/wiki/Overpass_API
- Leaflet 1.9.4, the map library (BSD-2-Clause): https://leafletjs.com
- World Health Organization, tuberculosis fact sheet: https://www.who.int/news-room/fact-sheets/detail/tuberculosis
- US Centers for Disease Control and Prevention (CDC), TB basics: https://www.cdc.gov/tb/
- Google Fonts (Archivo, Public Sans, IBM Plex Mono): https://fonts.google.com
