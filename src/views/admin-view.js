/* =====================================================================
   AdminView: Admin panel shown after log in.
     - TB history: filters, chart and table by city and year
     - Crowding report: BestTime forecast busy hours by mall
     - Early warning: next year's forecast rate by city, from tb_predictions.csv
   ===================================================================== */

import { CITIES, CITY, PLACES, busyLevel, cityName } from "../models/places-model.js";
import { DEFAULT_YEAR, PredData, TREND_FROM, TREND_TO, TbData, YEARS, tbVal, trendFor, yStatus } from "../models/tb-data-model.js";
import { ContractData, FILE_STATE_LABEL } from "../services/contract-loader.js";
import { $, $$, icon, opt } from "../utils/dom.js";
import { DOW, dateLabel, esc, fmt, hourLabel, parseIso, pct } from "../utils/format.js";
import { Charts } from "./helpers/charts.js";
import { CROWD_GRADIENT, crowdCSS } from "./helpers/map-scales.js";
import { besttimeSourceHTML } from "./helpers/source-notes.js";

export const ADMIN_TABS = { tb: "TB history", crowd: "Crowding report", early: "Early warning" };

export class AdminView {
  constructor(model) {
    this.model = model; this.handlers = {};
    this.f = { city: "all", measure: "count", compare: true, cCity: "all", cDate: model.state.date };
  }
  init(handlers) { this.handlers = handlers; }

  html(tab) {
    const tabs = Object.entries(ADMIN_TABS).map(([k, l]) => `<button type="button" role="tab" id="tab-${k}" aria-selected="${tab === k}" aria-controls="adminPanel" tabindex="${tab === k ? 0 : -1}" data-tab="${k}">${l}</button>`).join("");
    const body = tab === "crowd" ? this.crowdHTML() : tab === "early" ? this.earlyHTML() : this.tbHTML();
    return `<div class="admin">
      <div class="tabs" role="tablist" aria-label="Admin">${tabs}</div>
      <div id="adminPanel" role="tabpanel" aria-labelledby="tab-${tab}" tabindex="0">${body}</div></div>`;
  }

  /* ---------- TB history ---------- */
  tbHTML() {
    const f = this.f, cityOpts = opt("all", "All of NCR", f.city === "all") + CITIES.map(c => opt(c.id, cityName(c.id), f.city === c.id)).join("");
    const rows = CITIES.map(c => ({ c, v: YEARS.map(y => tbVal(c.id, y, f.measure)), t: trendFor(c.id) }))
      .sort((a, b) => (tbVal(b.c.id, DEFAULT_YEAR, f.measure) ?? -1) - (tbVal(a.c.id, DEFAULT_YEAR, f.measure) ?? -1));
    const cell = (v, y) => v == null ? `<td class="na" title="${esc(yStatus(y).label)}">–</td>` : `<td class="num${yStatus(y).s === "partial" ? " partial" : ""}">${f.measure === "rate" ? fmt(v, 1) : fmt(v)}${yStatus(y).s === "partial" ? "*" : ""}</td>`;
    return `${TbData.available() ? "" : `<p class="notice warn">${icon("i-info")}<span>${esc(TbData.unavailableText())} TB history fills in once data/cleaned_tb_data.csv is provided.</span></p>`}
      <div class="filters">
        <div class="field"><label for="afCity">City or municipality</label><select id="afCity">${cityOpts}</select></div>
        <div class="field"><span class="label" id="afMeasL">Measure</span><div class="seg" role="radiogroup" aria-labelledby="afMeasL">
          <button type="button" role="radio" aria-checked="${f.measure === "count"}" data-afm="count">Cases</button><button type="button" role="radio" aria-checked="${f.measure === "rate"}" data-afm="rate">Per 100,000</button></div></div>
        ${f.city !== "all" && f.measure === "rate" ? `<label class="check"><input type="checkbox" role="switch" class="switch" id="afCompare" ${f.compare ? "checked" : ""}> Compare with all of NCR</label>` : ""}
      </div>
      <div class="card">
        <h3>${f.measure === "rate" ? "TB cases per 100,000 people" : "TB cases"}: ${esc(cityName(f.city))}, ${YEARS[0]}–${YEARS[YEARS.length - 1]}</h3>
        <div class="chart" id="afChart"></div>
        <ul class="chart-key"><li><i style="background:#1F6FA3"></i>${esc(cityName(f.city))}</li>${f.city !== "all" && f.measure === "rate" && f.compare ? `<li><i style="background:#8A9AA6"></i>All of NCR</li>` : ""}<li><i class="gap"></i>No records for that year in cleaned_tb_data.csv</li></ul>
        ${f.city !== "all" ? `<p class="small">Trend ${TREND_FROM ?? "–"}–${TREND_TO ?? "–"} (complete years only): <b>${this.trend(trendFor(f.city))}</b>.</p>` : ""}
      </div>
      <div class="card">
        <h3>By city and year</h3>
        <div class="table-wrap" tabindex="0" role="region" aria-label="TB ${f.measure === "rate" ? "rates" : "cases"} by city and year"><table class="data">
          <thead><tr><th scope="col">City</th>${YEARS.map(y => `<th scope="col" class="num">${y}</th>`).join("")}<th scope="col">Trend ${TREND_FROM ?? "–"}–${TREND_TO ?? "–"}</th></tr></thead>
          <tbody>${rows.map(r => `<tr><th scope="row"><button type="button" class="link" data-afcity="${r.c.id}">${esc(r.c.name)}</button></th>${r.v.map((v, i) => cell(v, YEARS[i])).join("")}<td>${this.trend(r.t)}</td></tr>`).join("")}</tbody>
        </table></div>
        <p class="xs muted">– No valid value in cleaned_tb_data.csv for that city and year (never filled in). Sorted by ${DEFAULT_YEAR}. Rates are case_rate_per_100k as given in the file. Trend: yearly change in the rate, fitted over years where all 17 cities have values; above +3% a year is increasing, below −3% decreasing.</p>
      </div>`;
  }
  trend(t) { return t.dir === "Insufficient" ? "Not enough data" : `${t.dir} (${pct(t.pct)}/yr)`; }

  /* ---------- early warning ---------- */
  /* Forecast rate per city next to the last reported rate. A city is flagged only against the NCR
     rate of the last reported year, never against its own forecast change: the model pulls every
     city toward the NCR average, so a forecast "rise" or "fall" mostly says which side it is on. */
  earlyHTML() {
    if (PredData.state !== "ok" || !PredData.rows.length) return `<p class="notice warn">${icon("i-info")}<span><b>${esc(FILE_STATE_LABEL[PredData.state] || "No predictions")}.</b> ${esc(PredData.message || "tb_predictions.csv has no rows for NCR cities, so there is no forecast to show.")}</span></p>`;
    const ev = ContractData.eval?.state === "ok" ? ContractData.eval.data : null;
    const num = v => v === "" || v == null || isNaN(+v) ? null : +v;
    const target = PredData.rows[0].target_period_start?.slice(0, 4) || "next year";
    const base = Math.max(...YEARS.filter(y => tbVal("all", y, "rate") != null)), ncr = tbVal("all", base, "rate");
    const rows = PredData.rows.map(p => ({ p, id: p.cityId, v: num(p.predicted_value), lo: num(p.lower_bound), hi: num(p.upper_bound), last: tbVal(p.cityId, base, "rate") }))
      .sort((a, b) => (b.v ?? -1) - (a.v ?? -1));
    const flag = r => r.v == null || ncr == null ? `<span class="muted">–</span>`
      : r.lo != null && r.lo > ncr ? `<span class="ew ew-high">Watch: whole range above NCR</span>`
      : r.v > ncr ? `<span class="ew ew-mid">Above NCR rate</span>` : `<span class="ew ew-low">At or below NCR rate</span>`;
    const watch = rows.filter(r => r.lo != null && ncr != null && r.lo > ncr);
    const beats = ev?.metrics?.mae != null && ev?.baseline_metrics?.mae != null ? ev.metrics.mae < ev.baseline_metrics.mae : null;
    return `<p class="notice">${icon("i-info")}<span><span class="pred-tag">Prediction</span> Model estimates of each city's notified TB rate for ${esc(target)}, from tb_predictions.csv. They are not reported cases, do not detect TB spreading and do not prove a hotspot. Use them to decide where to look first, together with what your health offices see.</span></p>
      ${beats === false ? `<p class="notice warn">${icon("i-info")}<span>In back-testing the model was <b>not more accurate</b> than simply assuming next year looks like this year (average error ${fmt(ev.metrics.mae, 1)} vs ${fmt(ev.baseline_metrics.mae, 1)} per 100,000). Treat the ranking as a summary of recent rates, not a warning of change.</span></p>` : ""}
      <div class="card">
        <h3>${esc(target)} forecast by city, per 100,000 people</h3>
        <p class="small">${watch.length ? `<b>${watch.length} ${watch.length === 1 ? "city has" : "cities have"}</b> a forecast range that sits entirely above the NCR rate for ${base} (${fmt(ncr, 1)}): ${watch.map(r => esc(cityName(r.id))).join(", ")}.` : `No city has a forecast range entirely above the NCR rate for ${base} (${ncr == null ? "–" : fmt(ncr, 1)}).`} Select a city to see its TB history.</p>
        <div class="table-wrap" tabindex="0" role="region" aria-label="${esc(target)} TB forecast by city"><table class="data">
          <thead><tr><th scope="col">City</th><th scope="col" class="num">${base} reported</th><th scope="col" class="num">${esc(target)} forecast</th><th scope="col" class="num">Likely range</th><th scope="col">Compared with NCR ${base}</th></tr></thead>
          <tbody>${rows.map(r => `<tr><th scope="row"><button type="button" class="link" data-ewcity="${r.id}">${esc(cityName(r.id))}</button></th><td class="num">${r.last == null ? "–" : fmt(r.last, 1)}</td><td class="num"><b>${r.v == null ? "–" : fmt(r.v, 1)}</b></td><td class="num">${r.lo == null || r.hi == null ? "–" : `${fmt(r.lo, 0)}–${fmt(r.hi, 0)}`}</td><td>${flag(r)}</td></tr>`).join("")}</tbody>
        </table></div>
        <p class="xs muted">Sorted by forecast. Likely range: the model's approximate 80% interval (lower_bound to upper_bound). "${base} reported" is case_rate_per_100k from cleaned_tb_data.csv.</p>
      </div>`;
  }

  /* ---------- crowding ---------- */
  crowdHTML() {
    const f = this.f, cd = parseIso(f.cDate) || new Date(), day = cd.getDay();
    const list = PLACES.filter(p => f.cCity === "all" || p.city === f.cCity).sort((a, b) => CITY[a.city].name.localeCompare(CITY[b.city].name) || b.bt.reviews - a.bt.reviews);
    const hours = [...Array(19).keys()].map(i => i + 5);
    const cityOpts = opt("all", "All of NCR", f.cCity === "all") + CITIES.filter(c => PLACES.some(p => p.city === c.id)).map(c => opt(c.id, c.name, f.cCity === c.id)).join("");
    return `<div class="filters">
        <div class="field"><label for="acCity">City</label><select id="acCity">${cityOpts}</select></div>
        <div class="field"><label for="acDate">Date</label><span class="tf-box">${icon("i-calendar")}<input type="date" id="acDate" value="${esc(f.cDate)}" required></span></div>
      </div>
      <div class="card">
        <h3>Usual crowding by hour, ${esc(dateLabel(f.cDate))} (${list.length} mall${list.length === 1 ? "" : "s"})</h3>
        <p class="small muted">BestTime forecast for a typical ${DOW[day]}, as a share of each mall's own busiest hour. Not a headcount and not live. Select a mall to open it on the map. ${besttimeSourceHTML()}</p>
        ${list.length ? `<div class="table-wrap" tabindex="0" role="region" aria-label="Usual crowding by hour"><table class="grid-tbl">
          <thead><tr><th scope="col">Mall</th>${hours.map(h => `<th scope="col"><span>${h % 12 || 12}${h < 12 ? "a" : "p"}</span></th>`).join("")}<th scope="col">Busiest</th></tr></thead>
          <tbody>${list.map(p => { const row = p.week[day], mx = Math.max(...row.filter(x => x != null)), hi = row.indexOf(mx);
            return `<tr><th scope="row"><button type="button" class="link" data-acplace="${p.id}">${esc(p.name)}</button><small>${esc(CITY[p.city].name)}</small></th>${hours.map(h => row[h] == null ? `<td class="gc closed" title="${hourLabel(h)}: closed">·</td>` : `<td class="gc" style="background:${crowdCSS(row[h] / 100)}" title="${hourLabel(h)}: ${row[h]}% (${busyLevel(row[h])})"><span class="sr-only">${hourLabel(h)} ${row[h]}%</span></td>`).join("")}<td class="xs">${hi >= 0 ? hourLabel(hi) : "–"}</td></tr>`; }).join("")}</tbody>
        </table></div>
        <div class="lg-inline"><span>Less busy</span><span class="lg-ramp" style="background:${CROWD_GRADIENT}"></span><span>Busier</span><span class="closed-key">· Closed</span></div>` : `<p class="small">${PLACES.length ? "No malls in this city have a forecast yet." : "No BestTime mall forecasts are loaded."}</p>`}
        <p class="remind">Reminder: A busy place is not evidence that TB is spreading there.</p>
      </div>`;
  }

  /* ---------- events and charts ---------- */
  bind(root, tab) {
    const h = this.handlers, re = () => h.onRerender();
    $$("[data-tab]", root).forEach(b => {
      b.addEventListener("click", () => h.onTab(b.dataset.tab));
      b.addEventListener("keydown", e => {
        const keys = Object.keys(ADMIN_TABS), i = keys.indexOf(b.dataset.tab);
        if (e.key === "ArrowRight" || e.key === "ArrowLeft") { e.preventDefault(); const n = keys[(i + (e.key === "ArrowRight" ? 1 : keys.length - 1)) % keys.length]; h.onTab(n, true); }
      });
    });
    const on = (sel, evt, fn) => { const el = $(sel, root); if (el) el.addEventListener(evt, fn); };
    on("#afCity", "change", e => { this.f.city = e.target.value; re(); });
    $$("[data-afm]", root).forEach(b => b.addEventListener("click", () => { this.f.measure = b.dataset.afm; re(); }));
    on("#afCompare", "change", e => { this.f.compare = e.target.checked; re(); });
    $$("[data-afcity]", root).forEach(b => b.addEventListener("click", () => { this.f.city = b.dataset.afcity; re(); $("#afCity")?.focus(); }));
    on("#acCity", "change", e => { this.f.cCity = e.target.value; re(); });
    on("#acDate", "change", e => { if (parseIso(e.target.value)) { this.f.cDate = e.target.value; re(); } else e.target.value = this.f.cDate; });
    $$("[data-ewcity]", root).forEach(b => b.addEventListener("click", () => { this.f.city = b.dataset.ewcity; this.f.measure = "rate"; h.onTab("tb"); }));
    $$("[data-acplace]", root).forEach(b => b.addEventListener("click", () => h.onOpenPlace({ type: "place", id: b.dataset.acplace }, this.f.cDate)));

    const ch = $("#afChart", root);
    if (ch) {
      const f = this.f, series = [{ name: cityName(f.city), color: "#1F6FA3", values: YEARS.map(y => tbVal(f.city, y, f.measure)), partial: i => yStatus(YEARS[i]).s === "partial" }];
      if (f.city !== "all" && f.measure === "rate" && f.compare) series.push({ name: "All of NCR", color: "#8A9AA6", values: YEARS.map(y => tbVal("all", y, "rate")), partial: i => yStatus(YEARS[i]).s === "partial" });
      Charts.line(ch, { labels: YEARS.map(String), height: 240, series, gaps: YEARS.map((y, i) => ["missing", "unavailable"].includes(yStatus(y).s) ? i : null).filter(i => i != null),
        fmt: x => f.measure === "rate" ? fmt(x, 1) : fmt(x), tipNote: i => yStatus(YEARS[i]).label, aria: `TB ${f.measure === "rate" ? "cases per 100,000" : "cases"} by year for ${cityName(f.city)}` });
    }
  }
}
