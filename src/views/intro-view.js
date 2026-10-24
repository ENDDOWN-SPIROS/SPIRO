/* Intro view: the introduction page and its still background map. Draws only; the controller supplies the numbers and handlers. */
import { NCR_GEO, NCR_OUTLINE } from "../models/static-data-model.js";
import { TB_COLORS, tbClass, tbVal } from "../models/tb-data-model.js";
import { $, $$, icon } from "../utils/dom.js";
import { fmt } from "../utils/format.js";
import { MAP_MEASURE } from "./helpers/map-scales.js";

export class IntroView {
  constructor() { this.introLf = null; this.introRO = null; }

  /* Background map for the introduction: a Leaflet map with the same OpenStreetMap tiles,
     grey outside-NCR mask, NCR outline and TB classes as the map's overview, for the given year.
     It is a still picture: no dragging or zooming, only the attribution links are clickable. */
  introMap(y) {
    return `<figure class="in-map" aria-hidden="true"><div class="in-lf" id="inLeaflet"></div>
      <figcaption>Notified TB cases by city, ${y}</figcaption></figure>`;
  }
  initIntroMap(y) {
    if (this.introLf) { this.introLf.remove(); this.introLf = null; }
    const el = $("#inLeaflet");
    if (!el || typeof L === "undefined") return;
    const m = L.map(el, { zoomControl: false, attributionControl: true, dragging: false, scrollWheelZoom: false, doubleClickZoom: false, boxZoom: false, keyboard: false, touchZoom: false, tap: false, zoomSnap: 0.25 });
    m.attributionControl.setPrefix(false);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, referrerPolicy: "strict-origin-when-cross-origin", attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>' }).addTo(m);
    const WORLD = [[-10, 90], [-10, 150], [35, 150], [35, 90]];
    L.polygon([WORLD, ...NCR_OUTLINE], { interactive: false, stroke: false, fillColor: "#7D8A92", fillOpacity: 0.5 }).addTo(m);
    const geo = L.geoJSON(NCR_GEO, { interactive: false, style: f => {
      const v = tbVal(f.properties.id, y, MAP_MEASURE), k = tbClass(v, MAP_MEASURE);
      return { color: "#FFFFFF", weight: 1.1, opacity: 0.9, fillColor: k < 0 ? "#9AA6AE" : TB_COLORS[k], fillOpacity: k < 0 ? 0.35 : 0.8 };
    } }).addTo(m);
    L.polygon(NCR_OUTLINE, { interactive: false, fill: false, color: "#FFFFFF", weight: 6, opacity: 0.85 }).addTo(m);
    L.polygon(NCR_OUTLINE, { interactive: false, fill: false, color: "#122D40", weight: 2, opacity: 1 }).addTo(m);
    const fit = () => { m.invalidateSize(); const W = el.clientWidth, wide = W >= 900;
      m.fitBounds(geo.getBounds(), wide ? { paddingTopLeft: [Math.round(W * 0.48), 70], paddingBottomRight: [Math.round(W * 0.06), 40], animate: false } : { paddingTopLeft: [16, 60], paddingBottomRight: [16, 24], animate: false }); };
    fit(); setTimeout(fit, 80);
    if (!this.introRO && window.ResizeObserver) { this.introRO = new ResizeObserver(() => this.introLf && fit()); }
    this.introRO?.disconnect(); this.introRO?.observe(el);
    this.introLf = m;
  }

  /* Introduction page. Numbers come from the loaded files; nothing is typed in by hand. */
  render({ year: y, firstYear, total: n, cityCount: nc, placeCount, isAdmin }, { onNavigate, onLogin, onSignup }) {
    const stat = (v, l) => `<div class="in-stat"><b class="num">${v}</b><span>${l}</span></div>`;
    $("#intro").innerHTML = `${this.introMap(y)}
      <header class="in-top"><span class="in-brand"><svg class="logo" aria-hidden="true"><use href="#i-logo"/></svg><b>SPIRO</b></span>
        ${isAdmin ? `<a class="btn np-login in-login" href="#admin/tb">Admin</a>` : `<span class="in-auth"><button type="button" class="btn in-signup" id="inSignup">Sign Up</button><button type="button" class="btn np-login in-login" id="inLogin">Log In</button></span>`}</header>
      <div class="in-wrap">
        <div class="in-hero">
          <p class="eyebrow">Metro Manila · tuberculosis and crowding</p>
          <h1 id="introTitle">SPIRO</h1>
          <p class="in-lead">A map that shows where tuberculosis (TB) cases are reported across the 17 cities and municipality of Metro Manila, and when busy public places tend to be crowded, so people and health offices can plan safer visits and focus prevention.</p>
          <div class="cta"><a class="btn primary in-go" href="#map">${icon("i-map")}Explore the map${icon("i-arrow")}</a><a class="btn" href="#guide">${icon("i-book")}Learn About Tuberculosis</a></div>
        </div>
        <div class="in-stats">
          ${stat(n == null ? "—" : fmt(n), n == null ? `notified TB cases, ${y} (data not loaded)` : `notified TB cases in Metro Manila, ${y}`)}
          ${stat(nc, "cities and municipality on the map")}
          ${stat(placeCount, "public places with crowding estimates")}
        </div>
        <section class="in-sec" aria-labelledby="inProb"><h2 id="inProb">The problem</h2>
          <p>TB spreads through the air. Risk grows when people spend long periods close together in crowded, poorly ventilated indoor places, such as malls, public markets and transit stations. ${n == null ? "Metro Manila reports thousands of TB cases every year" : `Metro Manila notified ${fmt(n)} TB cases in ${y} (DOH FHSIS)`}, yet the public has no simple way to see where cases are reported or when shared spaces are busiest, and health offices have no single view that puts the two together.</p></section>
        <section class="in-sec" aria-labelledby="inHow"><h2 id="inHow">What SPIRO shows</h2>
          <div class="in-cards">
            <article class="in-card">${icon("i-map", 22)}<h3>TB cases by city</h3><p>Notified TB cases per city from DOH FHSIS records, ${firstYear}–${y}, with ${y} shown first.</p></article>
            <article class="in-card">${icon("i-people", 22)}<h3>Crowding heatmap</h3><p>An estimated typical-week pattern for ${placeCount} malls, markets, stations and landmarks, blended into one map. Pick a date and time.</p></article>
            <article class="in-card">${icon("p-mask", 22)}<h3>Precautions</h3><p>Simple steps for each place, plus a TB Health Guide on symptoms and free testing in public health facilities.</p></article>
          </div></section>
        <p class="in-note">${icon("i-info")}<span>Crowding is an estimate, not live. A busy place is not evidence that TB is spreading there.</span></p>
        <p class="in-src">Data: DOH Field Health Services Information System (FHSIS) TB tables · PSA PSGC 2023 boundaries · © OpenStreetMap contributors.</p>
      </div>`;
    $$("#intro a[href^='#']").forEach(a => a.addEventListener("click", e => { e.preventDefault(); onNavigate(a.getAttribute("href").slice(1)); }));
    $("#inLogin")?.addEventListener("click", onLogin);
    $("#inSignup")?.addEventListener("click", onSignup);
    this.initIntroMap(y);
  }

}
