# TB screening facilities

The Facilities tab shows one pin per PhilHealth-accredited TB-DOTS facility in NCR.

**Source.** PhilHealth, *List of Accredited TB DOTS Clinics for CY 2026*, updated September 30, 2026 (PDF `List-Of-Accredited-TB-Clinics.pdf`, NCR section pages 23–41, list nos. 599–983). Provider page: https://www.philhealth.gov.ph/partners/providers/

**Data files.** `data/facilities/facilities.csv` (385 rows, the extracted list) and `data/facilities/facilities.json` (the same records, which the website loads). Code: `src/models/facilities-model.js` (grouping, status rule, name formatting) and `src/views/facilities-view.js` (pins, cards, panel, legend).

## How the records were built
- Extracted column by column from the PDF text: name, phone, email, street, city, accreditation end date and sector. Nothing was typed by hand.
- Duplicates: none. Nos. 831 and 863 share an address but are different facilities; both are kept.
- Emails: line breaks inside the PDF cells were removed, and every email was checked against a standard email pattern.
- Facility type comes from the name only: Hospital (37), Health center (340), Clinic (8). Sector: Government (367), Private (18).

## How pins were placed
- Each address was matched to its PSGC 2023 barangay inside the listed city. The pin sits at the barangay centre (or at an interior point when the centre falls outside the shape).
- 299 facilities are on the map. 86 are not: 54 in Manila, because Manila barangay boundaries were not available, and the rest had no clear barangay in the address. They still appear in search, with details and directions.
- Facilities matched to the same barangay share one pin with a number.
- Every card says the pin is the barangay centre, not the exact building.

## Accreditation dates
Status is computed against the visitor's current date. Six facilities have an end date of Oct 3, 2026. That date has passed, so their pins are grey, they are labelled "Expired", and their card says the list does not show a renewal.

## Card contents
Name, type and sector, accreditation status, address with a copy button, TB services ("TB-DOTS clinic, PhilHealth-accredited", the only service the list verifies), phone and email when the list has them ("Not provided in the list" otherwise), pin precision, a Google Maps directions link built from the listed name and address, and a source line with the page and list number.

## Possible next step
Street-level positions (including Manila) would need a geocoder, for example OpenStreetMap Nominatim (free, limited to 1 request per second).
