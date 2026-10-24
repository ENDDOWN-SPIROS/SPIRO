# data/shared: files from Device B

Put exactly these four files here (names and headers are fixed by the contract in
docs/data-contract.md):

- cleaned_tb_data.csv
- tb_predictions.csv
- model_evaluation.json
- data_dictionary.md

The website (SPIRO.html, served by serve.ps1) reads them on page load. Until a file is here,
the site shows "not yet provided" for it; nothing is filled in. Do not put test data in this folder;
test fixtures live in tests/fixtures/.
