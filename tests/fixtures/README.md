# Test fixtures (TEST DATA, NOT REAL)

Every file under tests/fixtures/ is made-up data for testing the shared-data loaders and the
missing/invalid states. Values, record_ids (TEST-...) and source_file ("TEST FIXTURE - not real data")
are invented. The live site never reads these folders.

Open a case only in test mode, on localhost:  http://localhost:8000/version-5.html?fixtures=<case>

| Case | What it checks |
|---|---|
| valid | All four files valid: 17 cities for 2025, 5 for 2024, one region row (not mappable), 3 predictions (one at region level), completed evaluation, dictionary with an HTML tag that must show as text |
| empty | Header-only CSVs, blank dictionary, evaluation file missing |
| malformed | Quoted commas and a quoted line break, invalid numbers ("2,100", "12a", "-5"), a bad date, a short row, a missing year, an unknown city, duplicate conflicting rows, a quarterly row, a barangay row, a code/name conflict; evaluation JSON missing keys |
| wrong-header | Columns in the wrong order, a missing prediction column, broken JSON |
| pending | Only model_evaluation.json, with status "pending"; the other three files are missing |
| no-2025 | Valid TB rows for 2024 only, so 2025 must show as unavailable |

The automated checks in tests/contract-tests.html use the same folders.