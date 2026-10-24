/* =====================================================================
   ContractLoader: reads the four shared-data contract files that
   Device B puts in data/shared/ (see docs/data-contract.md).

     cleaned_tb_data.csv   observed TB records
     tb_predictions.csv    model predictions
     model_evaluation.json model status and metrics
     data_dictionary.md    field definitions

   Rules kept here:
   - CSV is parsed properly (quoted fields, "" escapes, CRLF, BOM).
   - Headers must match exactly, in order, or the whole file is rejected.
   - Empty field -> null. Invalid number/date -> null and flagged.
   - geo_code stays a string (leading zeros kept).
   - Rows with the wrong number of fields, or without the keys a row
     needs, are skipped and counted. Missing is never turned into 0.

   File states: "ok", "empty" (header only), "missing" (not in folder /
   404), "error" (fetch failed), "invalid" (wrong header, bad JSON).

   Test mode: on localhost only, "?fixtures=<name>" reads from
   tests/fixtures/<name>/ instead of data/shared/. The live site never
   reads fixtures without that parameter.
   ===================================================================== */
"use strict";

const CONTRACT = {
  tb: {
    file: "cleaned_tb_data.csv",
    header: ["record_id", "year", "period_start", "period_end", "period_type", "geo_level", "geo_code", "geo_name", "province", "city_municipality", "barangay", "case_count", "population", "case_rate_per_100k", "source_file", "source_sheet"],
    types: { year: "year", period_start: "date", period_end: "date", case_count: "count", population: "number", case_rate_per_100k: "number" },
    /* A row the site cannot place at all is malformed: it needs a year, a level and a code or name. */
    required: r => r.year != null && r.geo_level != null && (r.geo_code != null || r.geo_name != null)
  },
  pred: {
    file: "tb_predictions.csv",
    header: ["prediction_id", "generated_at", "target_period_start", "target_period_end", "target_period_type", "geo_level", "geo_code", "geo_name", "target_variable", "predicted_value", "prediction_unit", "model_name", "model_version", "training_data_end", "lower_bound", "upper_bound"],
    types: { generated_at: "timestamp", target_period_start: "date", target_period_end: "date", predicted_value: "number", training_data_end: "date", lower_bound: "number", upper_bound: "number" },
    required: r => r.geo_level != null && (r.geo_code != null || r.geo_name != null) && r.target_variable != null
  },
  eval: { file: "model_evaluation.json" },
  dict: { file: "data_dictionary.md" }
};
const EVAL_STATUSES = ["pending", "completed", "insufficient_data", "failed"];
const EVAL_KEYS = ["status", "target_variable", "prediction_horizon", "geographic_level", "feature_columns", "excluded_columns", "model_name", "baseline_name", "validation_method", "training_rows", "testing_rows", "metrics", "baseline_metrics", "limitations", "notes"];

const ContractLoader = {
  /* ---------- where the files are read from ---------- */
  source() {
    const q = new URLSearchParams(location.search).get("fixtures");
    const local = ["localhost", "127.0.0.1", "[::1]"].includes(location.hostname);
    if (q && local && /^[a-z0-9-]{1,40}$/.test(q)) return { base: `tests/fixtures/${q}/`, test: true, name: q };
    return { base: "data/shared/", test: false, name: null };
  },

  /* ---------- CSV ---------- */
  /* Returns { rows: [{ line, fields: [] }], error } following RFC 4180. */
  parseCSV(text) {
    const s = text.replace(/^﻿/, "");
    const rows = []; let field = "", fields = [], i = 0, line = 1, rowLine = 1, quoted = false, any = false;
    const endField = () => { fields.push(field); field = ""; };
    const endRow = () => { endField(); if (!(fields.length === 1 && fields[0] === "" && !any)) rows.push({ line: rowLine, fields }); fields = []; any = false; rowLine = line; };
    while (i < s.length) {
      const c = s[i];
      if (quoted) {
        if (c === '"') { if (s[i + 1] === '"') { field += '"'; i += 2; continue; } quoted = false; i++; continue; }
        if (c === "\r" && s[i + 1] === "\n") { i++; continue; }   // CRLF inside quotes -> \n
        if (c === "\n") line++;
        field += c; i++; continue;
      }
      if (c === '"' && field === "") { quoted = true; any = true; i++; continue; }
      if (c === ",") { endField(); any = true; i++; continue; }
      if (c === "\r") { i++; continue; }
      if (c === "\n") { line++; endRow(); i++; continue; }
      field += c; any = true; i++;
    }
    if (quoted) return { rows, error: `Unclosed quoted field starting on line ${rowLine}.` };
    if (field !== "" || fields.length) endRow();
    return { rows, error: null };
  },

  /* ---------- safe type casting ---------- */
  cast(type, raw) {
    if (raw == null) return { value: null };
    const v = raw.trim();
    if (v === "") return { value: null };
    const bad = { value: null, invalid: true };
    switch (type) {
      case "number": return /^-?(\d+(\.\d*)?|\.\d+)([eE][-+]?\d+)?$/.test(v) && isFinite(+v) ? { value: +v } : bad;
      case "count": return /^\d+$/.test(v) ? { value: +v } : bad;                       // whole number, never negative
      case "year": return /^\d{4}$/.test(v) && +v >= 1900 && +v <= 2100 ? { value: +v } : bad;
      case "date": {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return bad;
        const d = new Date(v + "T00:00:00Z");
        return !isNaN(d) && d.toISOString().slice(0, 10) === v ? { value: v } : bad;
      }
      case "timestamp": return /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?$/.test(v) && !isNaN(Date.parse(v)) ? { value: v } : bad;
      default: return { value: raw };                                                     // strings are kept as written
    }
  },

  /* Parse and validate one contract CSV. */
  readTable(spec, text) {
    const out = { file: spec.file, state: "ok", rows: [], malformed: [], flagged: [], message: "" };
    const { rows, error } = this.parseCSV(text);
    if (!rows.length) return { ...out, state: "invalid", message: error || "The file is empty (no header row)." };
    const head = rows[0].fields;
    if (head.length !== spec.header.length || head.some((h, i) => h !== spec.header[i])) {
      const missing = spec.header.filter(h => !head.includes(h)), extra = head.filter(h => !spec.header.includes(h));
      return { ...out, state: "invalid", message: "The header does not match the contract." + (missing.length ? ` Missing: ${missing.join(", ")}.` : "") + (extra.length ? ` Unexpected: ${extra.join(", ")}.` : "") + (!missing.length && !extra.length ? " The columns are in the wrong order." : "") };
    }
    for (const { line, fields } of rows.slice(1)) {
      if (fields.length !== spec.header.length) { out.malformed.push({ line, reason: `${fields.length} fields instead of ${spec.header.length}` }); continue; }
      const rec = { _line: line, _flags: [] };
      spec.header.forEach((h, i) => {
        const c = this.cast(spec.types[h], fields[i]);
        rec[h] = typeof c.value === "string" ? c.value.trim() : c.value;
        if (rec[h] === "") rec[h] = null;
        if (c.invalid) { rec._flags.push(h); out.flagged.push({ line, field: h, value: fields[i] }); }
      });
      if (!spec.required(rec)) { out.malformed.push({ line, reason: "missing year, level, or geo_code/geo_name" + (spec === CONTRACT.pred ? " / target_variable" : "") }); continue; }
      out.rows.push(rec);
    }
    if (error) out.malformed.push({ line: null, reason: error });
    if (!out.rows.length) { out.state = "empty"; out.message = out.malformed.length ? "No usable rows: every data row was malformed." : "The file has a header but no data rows."; }
    return out;
  },

  /* ---------- model_evaluation.json ---------- */
  readEvaluation(text) {
    let j;
    try { j = JSON.parse(text.replace(/^﻿/, "")); }
    catch (e) { return { file: CONTRACT.eval.file, state: "invalid", message: "Not valid JSON: " + e.message }; }
    const problems = [];
    if (!j || typeof j !== "object" || Array.isArray(j)) return { file: CONTRACT.eval.file, state: "invalid", message: "The JSON must be an object." };
    EVAL_KEYS.filter(k => !(k in j)).forEach(k => problems.push(`missing key "${k}"`));
    if ("status" in j && !EVAL_STATUSES.includes(j.status)) problems.push(`status must be one of ${EVAL_STATUSES.join(", ")}`);
    const isNum = v => v === null || (typeof v === "number" && isFinite(v));
    for (const k of ["metrics", "baseline_metrics"]) {
      if (!(k in j)) continue;
      if (j[k] !== null && (typeof j[k] !== "object" || Array.isArray(j[k]))) { problems.push(`"${k}" must be an object or null`); continue; }
      if (j[k]) for (const m of ["mae", "rmse", "r2"]) { if (!(m in j[k])) problems.push(`"${k}.${m}" is missing`); else if (!isNum(j[k][m])) problems.push(`"${k}.${m}" must be a number or null`); }
    }
    for (const k of ["training_rows", "testing_rows"]) if (k in j && !(j[k] === null || Number.isInteger(j[k]) && j[k] >= 0)) problems.push(`"${k}" must be a whole number or null`);
    for (const k of ["feature_columns", "excluded_columns"]) if (k in j && !(j[k] === null || Array.isArray(j[k]) && j[k].every(x => typeof x === "string"))) problems.push(`"${k}" must be a list of column names or null`);
    if (problems.length) return { file: CONTRACT.eval.file, state: "invalid", message: "The JSON does not follow the contract: " + problems.join("; ") + "." };
    return { file: CONTRACT.eval.file, state: "ok", data: j };
  },

  /* ---------- fetching ---------- */
  /* Directory listing (serve.ps1 and python http.server both provide one for
     data/shared/), so absent files are known without a failing request. */
  async listing(base) {
    try {
      const r = await fetch(base, { cache: "no-store" });
      if (!r.ok || !/html/.test(r.headers.get("content-type") || "")) return null;
      const html = await r.text();
      return new Set([...html.matchAll(/href="([^"?#]+)"/g)].map(m => decodeURIComponent(m[1]).split("/").pop()));
    } catch (e) { return null; }
  },

  async fetchText(base, file, list) {
    if (list && !list.has(file)) return { state: "missing" };
    try {
      const r = await fetch(base + file, { cache: "no-store" });
      if (r.status === 404) return { state: "missing" };
      if (!r.ok) return { state: "error", message: `The server answered ${r.status}.` };
      return { state: "ok", text: await r.text() };
    } catch (e) { return { state: "error", message: "The file could not be fetched (" + (location.protocol === "file:" ? "pages opened from a file cannot read data files; use serve.ps1" : e.message) + ")." }; }
  },

  async loadAll() {
    const src = this.source(), list = await this.listing(src.base);
    const get = file => this.fetchText(src.base, file, list);
    const [tb, pred, ev, dict] = await Promise.all([CONTRACT.tb, CONTRACT.pred, CONTRACT.eval, CONTRACT.dict].map(s => get(s.file)));
    const wrap = (spec, res, read) => res.state === "ok" ? read(res.text) : { file: spec.file, state: res.state, message: res.message || "" };
    return {
      source: src,
      tb: wrap(CONTRACT.tb, tb, t => this.readTable(CONTRACT.tb, t)),
      pred: wrap(CONTRACT.pred, pred, t => this.readTable(CONTRACT.pred, t)),
      eval: wrap(CONTRACT.eval, ev, t => this.readEvaluation(t)),
      dict: wrap(CONTRACT.dict, dict, t => t.trim() ? { file: CONTRACT.dict.file, state: "ok", text: t } : { file: CONTRACT.dict.file, state: "empty", message: "The file is empty." })
    };
  }
};

/* Results of the last load, shared by models and views. */
const ContractData = { source: { base: "data/shared/", test: false }, tb: null, pred: null, eval: null, dict: null };

/* Plain-language label for a file state. */
const FILE_STATE_LABEL = { ok: "Loaded", empty: "No usable rows", missing: "Not yet provided", error: "Could not be read", invalid: "Rejected (does not follow the contract)" };
