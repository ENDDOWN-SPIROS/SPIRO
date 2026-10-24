/* =====================================================================
   DataModelView (Module 1): shows the shared contract files as they are.
     - file status for the four Device B files
     - notices about rows that could not be used
     - model_evaluation.json (status, metrics, limitations), never hardcoded
     - predictions from tb_predictions.csv, always labelled "Prediction"
     - data_dictionary.md as plain text, or "not yet provided"
   It only reads ContractData, TbData and PredData; it changes nothing.
   ===================================================================== */
"use strict";

const DataModelView = {
  /* ---------- whole "Data and model" tab in LGU tools ---------- */
  html() {
    return `${this.sourceHTML()}${this.filesHTML()}${this.noticesHTML()}${this.evaluationHTML()}${this.predictionsHTML()}
      <div class="card"><h3>Data dictionary</h3><p class="small">${ContractData.dict?.state === "ok" ? `Provided. <a href="#dictionary" data-dict-link>Open the data dictionary</a>.` : "Not yet provided."}</p></div>`;
  },

  sourceHTML() {
    const s = ContractData.source;
    return s.test
      ? `<p class="notice warn">${icon("i-info")}<span><b>Test mode.</b> Files are read from ${esc(s.base)}. These are test fixtures, not real data.</span></p>`
      : `<p class="notice">${icon("i-info")}<span>Files are read from <b>${esc(s.base)}</b>, where Device B puts them. Nothing here is computed by the website.</span></p>`;
  },

  filesHTML() {
    const row = (res, use) => {
      const st = res?.state || "missing";
      const extra = res?.rows ? `${res.rows.length} usable row(s)` + (res.malformed?.length ? `, ${res.malformed.length} skipped` : "") + (res.flagged?.length ? `, ${res.flagged.length} invalid value(s)` : "") : "";
      return `<tr><th scope="row"><code>${esc(res?.file || "")}</code><small class="muted" style="display:block">${esc(use)}</small></th><td><span class="cs cs-${st}">${esc(FILE_STATE_LABEL[st] || st)}</span></td><td class="small">${esc([res?.message, extra].filter(Boolean).join(" "))}</td></tr>`;
    };
    return `<div class="card"><h3>Shared data files</h3>
      <div class="table-wrap"><table class="data cs-table"><thead><tr><th scope="col">File</th><th scope="col">Status</th><th scope="col">Details</th></tr></thead><tbody>
        ${row(ContractData.tb, "TB map, place details, TB history")}
        ${row(ContractData.pred, "Predictions (LGU tools only)")}
        ${row(ContractData.eval, "Model status below")}
        ${row(ContractData.dict, "Data dictionary page")}
      </tbody></table></div></div>`;
  },

  noticesHTML() {
    const list = [...TbData.notices.map(n => "cleaned_tb_data.csv: " + n), ...PredData.notices.map(n => "tb_predictions.csv: " + n)];
    if (!list.length) return "";
    return `<div class="card"><h3>Rows that could not be used</h3><ul class="small cs-list">${list.map(n => `<li>${esc(n)}</li>`).join("")}</ul></div>`;
  },

  /* ---------- model_evaluation.json ---------- */
  evaluationHTML() {
    const e = ContractData.eval;
    const head = `<div class="card"><h3>Model status</h3>`;
    if (!e || e.state !== "ok") return `${head}<p class="small"><b>${esc(FILE_STATE_LABEL[e?.state || "missing"])}.</b> ${esc(e?.message || "model_evaluation.json has not been provided, so there is no model status to show.")}</p></div>`;
    const j = e.data;
    const msg = {
      completed: "Training and evaluation are reported as completed.",
      pending: "Model training or evaluation has not finished yet. There are no final results.",
      insufficient_data: "Device B reports that the data is not sufficient for a defensible model. No model results should be relied on.",
      failed: "Device B reports that model training or evaluation failed. No model results should be relied on."
    }[j.status];
    const v = x => x === null || x === undefined || x === "" ? `<span class="muted">not given</span>` : Array.isArray(x) ? (x.length ? x.map(esc).join(", ") : `<span class="muted">none</span>`) : esc(String(x));
    const num = x => x === null || x === undefined ? "–" : fmt(x, Math.abs(x) < 10 ? 3 : 1);
    const metricsRows = (["mae", "rmse", "r2"]).map(m => `<tr><th scope="row">${m.toUpperCase()}</th><td class="num">${num(j.metrics?.[m])}</td><td class="num">${num(j.baseline_metrics?.[m])}</td></tr>`).join("");
    const hasMetrics = [j.metrics, j.baseline_metrics].some(o => o && Object.values(o).some(x => x !== null));
    const text = x => x === null || x === undefined ? `<span class="muted">not given</span>` : Array.isArray(x) ? `<ul class="cs-list">${x.map(i => `<li>${esc(String(i))}</li>`).join("")}</ul>` : esc(String(x));
    return `${head}
      <p class="cs-status cs-ev-${esc(j.status)}"><b>Status: ${esc(j.status)}.</b> ${esc(msg)}</p>
      <dl class="kv">
        <div><dt>Target variable</dt><dd>${v(j.target_variable)}</dd></div>
        <div><dt>Prediction horizon</dt><dd>${v(j.prediction_horizon)}</dd></div>
        <div><dt>Geographic level</dt><dd>${v(j.geographic_level)}</dd></div>
        <div><dt>Model</dt><dd>${v(j.model_name)}</dd></div>
        <div><dt>Baseline</dt><dd>${v(j.baseline_name)}</dd></div>
        <div><dt>Validation</dt><dd>${v(j.validation_method)}</dd></div>
        <div><dt>Training rows</dt><dd>${v(j.training_rows)}</dd></div>
        <div><dt>Testing rows</dt><dd>${v(j.testing_rows)}</dd></div>
      </dl>
      <p class="small"><b>Features:</b> ${v(j.feature_columns)}<br><b>Excluded columns:</b> ${v(j.excluded_columns)}</p>
      ${hasMetrics ? `${j.status !== "completed" ? `<p class="small muted">Metrics are present in the file, but the status is "${esc(j.status)}", so treat them as not final.</p>` : ""}
        <div class="table-wrap"><table class="data"><thead><tr><th scope="col">Metric</th><th scope="col" class="num">Model</th><th scope="col" class="num">Baseline</th></tr></thead><tbody>${metricsRows}</tbody></table></div>`
        : `<p class="small muted">No metrics reported.</p>`}
      <p class="small"><b>Limitations:</b> ${text(j.limitations)}</p>
      <p class="small"><b>Notes:</b> ${text(j.notes)}</p>
      <p class="xs muted">Shown exactly as given in model_evaluation.json; the website does not compute or adjust these values.</p></div>`;
  },

  /* ---------- tb_predictions.csv ---------- */
  predRow(p, withPlace) {
    const val = p.predicted_value == null ? `<span class="muted">invalid or missing</span>` : `${fmt(p.predicted_value, p.predicted_value % 1 ? 1 : 0)}${p.prediction_unit ? " " + esc(p.prediction_unit) : ""}`;
    const bounds = p.lower_bound != null || p.upper_bound != null ? `${p.lower_bound != null ? fmt(p.lower_bound, p.lower_bound % 1 ? 1 : 0) : "?"} to ${p.upper_bound != null ? fmt(p.upper_bound, p.upper_bound % 1 ? 1 : 0) : "?"}` : `<span class="muted">not given</span>`;
    return `<tr>${withPlace ? `<th scope="row">${esc(CITY[p.cityId].name)}</th>` : ""}<td>${esc(PredData.periodLabel(p))}</td><td>${esc(p.target_variable)}</td><td class="num">${val}</td><td>${bounds}</td><td class="small">${esc([p.model_name, p.model_version].filter(Boolean).join(" ") || "model not named")}<br><span class="muted">trained to ${esc(p.training_data_end || "date not given")}</span></td></tr>`;
  },
  predHead(withPlace) { return `<thead><tr>${withPlace ? `<th scope="col">City</th>` : ""}<th scope="col">Target period</th><th scope="col">Target</th><th scope="col" class="num">Predicted</th><th scope="col">Bounds</th><th scope="col">Model</th></tr></thead>`; },

  predictionsHTML() {
    const head = `<div class="card"><h3>Predictions <span class="pred-tag">Prediction</span></h3>`;
    if (PredData.state !== "ok") return `${head}<p class="small"><b>${esc(FILE_STATE_LABEL[PredData.state])}.</b> ${esc(PredData.message || "tb_predictions.csv has not been provided, so no predictions are shown.")}</p></div>`;
    if (!PredData.rows.length) return `${head}<p class="small">tb_predictions.csv has no rows for NCR cities that can be shown.</p></div>`;
    const gen = [...new Set(PredData.rows.map(p => p.generated_at).filter(Boolean))];
    return `${head}<p class="small">Model estimates from tb_predictions.csv. They are not reported cases and not observed crowding.${gen.length ? ` Generated: ${esc(gen.join(", "))}.` : ""}</p>
      <div class="table-wrap"><table class="data">${this.predHead(true)}<tbody>${PredData.rows.map(p => this.predRow(p, true)).join("")}</tbody></table></div></div>`;
  },

  cityPredictionsHTML(id) {
    const list = PredData.byCity[id] || [];
    if (!list.length) return "";
    return `<div class="cs-pred"><p class="small"><span class="pred-tag">Prediction</span> From tb_predictions.csv. An estimate, not reported cases.</p>
      <div class="table-wrap"><table class="data">${this.predHead(false)}<tbody>${list.map(p => this.predRow(p, false)).join("")}</tbody></table></div></div>`;
  },

  /* ---------- data_dictionary.md (public page) ---------- */
  dictionaryHTML() {
    const d = ContractData.dict;
    if (!d || d.state !== "ok") return `<div class="guide"><p class="notice">${icon("i-info")}<span><b>Data dictionary not yet provided.</b> ${esc(d?.message || "data_dictionary.md has not been added to data/shared/.")}</span></p></div>`;
    return `<div class="guide"><p class="small muted">From ${esc(ContractData.source.base)}data_dictionary.md, shown as plain text.</p><pre class="dict-text">${esc(d.text)}</pre></div>`;
  },

  /* Test-mode banner shown across the top of every page. */
  renderBanner() {
    const s = ContractData.source, el = document.getElementById("testBanner");
    if (!el) return;
    el.hidden = !s.test;
    if (s.test) el.innerHTML = `<b>Test mode:</b> fixture files from ${esc(s.base)}. Not real data.`;
    /* Module 4: in test mode, keep the map's top bar below the banner so it never covers the brand
       (the banner wraps to two lines on narrow screens). */
    document.body.classList.toggle("test-mode", !!s.test);
    if (s.test) {
      const fit = () => { document.documentElement.style.setProperty("--test-h", el.offsetHeight + "px"); window.tbApp?._setBars?.(); };
      fit(); window.addEventListener("resize", fit);
    }
  }
};
