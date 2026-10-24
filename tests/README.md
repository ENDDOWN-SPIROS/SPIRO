# Tests

Both test pages run in the browser, so nothing needs to be installed. Start the local server first, from the SPIRO folder:

```
powershell -ExecutionPolicy Bypass -File serve.ps1
```

| Page | What it checks |
|---|---|
| http://localhost:8000/tests/unit-tests.html | The map's calculations with the real data files (TB classes and totals, 2025 default, crowding levels, foot-traffic shares, accreditation status, facility records, formatting and HTML escaping), and error cases: missing or broken JSON files, unsafe fixture names, files the server must not serve |
| http://localhost:8000/tests/contract-tests.html | The data loader against the test data sets in `fixtures/` (valid, empty, malformed, wrong headers, pending, no 2025) and the live `data/` folder |

Each page shows "N of N passed" at the top and lists any failure in red.

`fixtures/` holds made-up TEST data only (see `fixtures/README.md`). The site reads it only on localhost with `?fixtures=<case>`.
