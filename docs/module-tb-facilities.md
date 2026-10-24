# Module: TB screening facilities layer (2026-10-24)

**What it shows.** A third map tab, **Facilities**, with one pin per PhilHealth-accredited TB-DOTS facility in NCR.

**Source.** PhilHealth, *List of Accredited TB DOTS Clinics for CY 2026*, updated September 30, 2026 (uploaded PDF `List-Of-Accredited-TB-Clinics.pdf`, NCR section pages 23–41, list nos. 599–983). Provider page: https://www.philhealth.gov.ph/partners/providers/

**Data file.** `data/facilities/facilities.csv` (385 rows). The same records are inlined in SPIRO.html as `window.TB_FACILITIES`.

## How records were built
- Extracted column by column from the PDF text (name, phone, email, street, city, accreditation end date, sector). Nothing typed by hand.
- Duplicates: none. Nos. 831 and 863 share an address but are different facilities; both are kept.
- Emails: line breaks inside the PDF cells were removed; every email was checked against a standard email pattern.
- Facility type comes from the name only: Hospital (37), Health center (340), Clinic or other facility (8). Sector G = Government (367), P = Private (18).

## How pins were placed
- Street-level geocoding services are blocked from the build machine, so each address was matched to its **PSGC 2023 barangay** inside the listed city, and the pin sits at the barangay centre (or an interior point when the centre falls outside the shape).
- 299 facilities are on the map. 86 are not (Manila 54, because Manila barangay boundaries were not available; the rest had no clear barangay in the address). They are listed in the app under "listed facilities are not on the map", with details and directions.
- Facilities matched to the same barangay share one pin with a number.
- Every card says the pin is the barangay centre, not the exact building.

## Accreditation dates
- Status is computed against the visitor's current date. 6 facilities have an end date of Oct 3, 2026, which has passed; their pins are grey and their card says the list does not show a renewal.

## Card contents
Name, type and sector, accreditation status, address, TB services ("TB-DOTS clinic, PhilHealth-accredited", the only service the list verifies), phone and email when the list has them ("Not provided in the list" otherwise), pin precision, a Google Maps directions link built from the listed name and address, and a small source line with page and list number.

## Possible next step
Street-level positions (and Manila) need a geocoder run on the laptop, e.g. OpenStreetMap Nominatim (free, rate-limited to 1 request per second). Not done without approval.

Backup of the previous page: `backup/pre-facilities/SPIRO.html`.
