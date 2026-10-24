# Re-running the TB data pipeline

These scripts turn the DOH FHSIS workbooks into the four files in `data/`
(`cleaned_tb_data.csv`, `tb_predictions.csv`, `model_evaluation.json`; `data_dictionary.md`
is hand-written, so update it if the inputs change). Background and decisions:
`docs/data-preparation/`.

Requires Python 3 with pandas, openpyxl, numpy and scikit-learn:

    pip install pandas openpyxl scikit-learn

Run from this folder:

    mkdir raw output && unzip Tuberculosis_DS.zip -d raw
    python3 clean.py raw output                      # -> output/cleaned_tb_data.csv
    python3 add_fhsis_2019.py FHSIS2019.pdf output   # adds 2019 (needs pdftotext from poppler)
    python3 model.py output                          # -> output/tb_predictions.csv, output/model_evaluation.json
    python3 validate.py output                       # checks all four files against the contract
    python3 verify_model.py output                   # independently recomputes metrics and predictions (numpy only)

Copy the files from `output/` into `data/` when they pass.
