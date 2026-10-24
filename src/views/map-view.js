/* =====================================================================
   MapView: Leaflet map of the Philippines with NCR highlighted.
   Three separate layers, never mixed:
     - TB cases: city choropleth in teal/blue, fixed classes for every year.
     - Crowding: smooth green-to-red foot-traffic heatmap for the chosen day and hour.
     - Facilities: PhilHealth-accredited TB-DOTS facility pins.
   The view only draws. User actions go to the handlers set by MapController.
   ===================================================================== */

import { OsmFoot } from "../models/foot-traffic-model.js";
import { CATEGORY, CITIES, CITY, PLACE, PLACES, busyLevel, cityName } from "../models/places-model.js";
import { Prefs } from "../models/settings-model.js";
import { CITY_LABEL_PT, NCR_GEO, NCR_OUTLINE } from "../models/static-data-model.js";
import { TB_COLORS, YEARS, tbClass, tbVal, yStatus } from "../models/tb-data-model.js";
import { $, $$, icon, opt } from "../utils/dom.js";
import { DOW, esc, fmt, pad2, parseIso, shortNum } from "../utils/format.js";
import { CROWD_GRADIENT, LEVEL_COLOR, MAP_MEASURE, crowdRGB, tbLegendRows } from "./helpers/map-scales.js";
import { osmSourceHTML } from "./helpers/source-notes.js";

export const PH_BOUNDS = [[4.4, 116.6], [21.3, 127.0]];

export class MapView {
  constructor(model) {
    this.model = model;
    this.map = null;
    this.layers = {};
    this.handlers = {};
    this.mode = "loading";
    this.tileOk = false; this.tileErr = 0;
  }

  init(handlers) {
    this.handlers = handlers;
    $("#zIn").addEventListener("click", () => this.map && this.map.zoomIn());
    $("#zOut").addEventListener("click", () => this.map && this.map.zoomOut());
    $("#zNcr").addEventListener("click", () => this.focusNCR(true));
    this.renderLayerBar(); this.renderLegend(); this.renderStatus();
    if (!window.L) { this.mode = "fallback"; $("#mapLoading").hidden = true; this.renderStatus(); return; }
    this.mode = "leaflet";
    const m = this.map = L.map("map", { zoomControl: false, attributionControl: true, minZoom: 5, maxZoom: 18, zoomSnap: 0.5, maxBounds: L.latLngBounds(PH_BOUNDS).pad(0.35) });
    m.attributionControl.setPosition("bottomright");
    m.attributionControl.setPrefix('<a href="https://leafletjs.com" target="_blank" rel="noopener">Leaflet</a>');
    const tiles = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, referrerPolicy: "strict-origin-when-cross-origin", attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors' });
    m.attributionControl.addAttribution("Boundaries: PSGC 2023 (PSA)");
    tiles.on("tileload", () => { if (!this.tileOk) { this.tileOk = true; this.renderStatus(); } });
    tiles.on("tileerror", () => { this.tileErr++; if (this.tileErr === 1) setTimeout(() => this.renderStatus(), 1500); });
    tiles.addTo(m);
    this.focusNCR(false);
    this.buildBase();
    m.on("zoomend", () => { this.drawLabels(); this.drawPlaces(); this.drawFacilities(); });
    $("#mapLoading").hidden = true;
    this.draw();
    setTimeout(() => { m.invalidateSize(); this.focusNCR(false); }, 60);
  }

  /* ---------- top layer bar ---------- */
  renderLayerBar() {
    const s = this.model.state;
    const seg = items => items.map(([v, l, ic]) => `<button type="button" role="radio" aria-checked="${s.layer === v}" data-layer="${v}">${icon(ic)}<span>${l}</span></button>`).join("");
    $("#layerSeg").innerHTML = seg([["tb", "TB cases", "i-map"], ["crowd", "Crowding", "i-people"], ["fac", "Facilities", "i-building"]]);
    $$("[data-layer]", $("#layerSeg")).forEach(b => b.addEventListener("click", () => this.handlers.onLayer(b.dataset.layer)));
    const box = $("#timeBox");
    if (s.layer === "fac") { this.renderFacBox(box); return; }
    if (s.layer === "tb") {
      const years = YEARS.map(y => opt(y, y + (["complete", "missing", "unavailable"].includes(yStatus(y).s) ? "" : ` (${yStatus(y).label.toLowerCase()})`), y === s.year)).join("");
      box.innerHTML = `<h2 class="ctrl-title" id="timeTitle">Reporting year</h2>
        <select id="lbYear" aria-labelledby="timeTitle">${years}</select>
        <p class="ctrl-note">TB data are yearly totals per city, so there is no date or time to choose here.</p>
        <p class="ctrl-src">Source: DOH Field Health Services Information System (FHSIS) TB tables, NCR (cleaned_tb_data.csv)</p>`;
      $("#lbYear").addEventListener("change", e => this.handlers.onYear(+e.target.value));
      return;
    }
    box.innerHTML = `<h2 class="ctrl-title" id="timeTitle">Date and time</h2>
      <div class="time-grid">
        <label class="tf tf-date"><span>Date</span><span class="tf-box">${icon("i-calendar")}<input type="date" id="lbDate" value="${s.date}" aria-label="Date" required></span></label>
        <div class="tf tf-time" role="group" aria-labelledby="lbTimeLbl"><span id="lbTimeLbl">Time (24-hour)</span>
          <button type="button" class="tf-box tf-hm" id="lbTime" aria-expanded="false" aria-controls="lbTimePanel" aria-label="Time ${pad2(s.hour)}:${pad2(s.minute)}, change">${icon("i-clock")}<span id="lbTimeVal" class="num">${pad2(s.hour)}:${pad2(s.minute)}</span></button>
          <div class="tp" id="lbTimePanel"><div class="tp-in">
            <div class="tp-col"><p class="tp-h" id="tpHh">Hour</p><div class="tp-list" role="listbox" aria-labelledby="tpHh" id="lbH">${[...Array(24).keys()].map(i => `<button type="button" role="option" data-h="${i}" aria-selected="${i === s.hour}">${pad2(i)}</button>`).join("")}</div></div>
            <div class="tp-col"><p class="tp-h" id="tpMh">Minute</p><div class="tp-list" role="listbox" aria-labelledby="tpMh" id="lbM">${[...Array(60).keys()].map(i => `<button type="button" role="option" data-m="${i}" aria-selected="${i === s.minute}">${pad2(i)}</button>`).join("")}</div></div>
          </div></div>
        </div>
      </div>`;
    $("#lbDate").addEventListener("change", e => { if (parseIso(e.target.value)) this.handlers.onDate(e.target.value); else e.target.value = this.model.state.date; });
    /* Hour and minute open together in one panel that expands smoothly under the time field. */
    const tb = $("#lbTime"), tp = $("#lbTimePanel");
    const center = () => $$(".tp-list [aria-selected=true]", tp).forEach(b => { const l = b.parentElement; l.scrollTop = b.offsetTop - l.clientHeight / 2 + b.offsetHeight / 2; });
    const setOpen = open => { tp.classList.toggle("open", open); tb.setAttribute("aria-expanded", String(open)); if (open) requestAnimationFrame(center); };
    tb.addEventListener("click", () => setOpen(!tp.classList.contains("open")));
    tp.addEventListener("click", e => {
      const b = e.target.closest("[data-h],[data-m]"); if (!b) return;
      const st = this.model.state, h = b.dataset.h != null ? +b.dataset.h : st.hour, m = b.dataset.m != null ? +b.dataset.m : st.minute;
      $$(b.dataset.h != null ? "[data-h]" : "[data-m]", tp).forEach(x => x.setAttribute("aria-selected", String(x === b)));
      $("#lbTimeVal").textContent = `${pad2(h)}:${pad2(m)}`; tb.setAttribute("aria-label", `Time ${pad2(h)}:${pad2(m)}, change`);
      this.handlers.onTime(h, m, 0);
    });
    tp.addEventListener("keydown", e => { if (e.key === "Escape") { e.stopPropagation(); setOpen(false); tb.focus(); } });
    document.addEventListener("pointerdown", e => { if (tp.classList.contains("open") && !e.target.closest("#lbTimePanel, #lbTime")) setOpen(false); });
  }

  /* ---------- base layers ---------- */
  buildBase() {
    const m = this.map;
    m.createPane("mask").style.zIndex = 330;
    m.createPane("heat").style.zIndex = 360; m.getPane("heat").style.pointerEvents = "none";
    m.createPane("labels").style.zIndex = 620; m.getPane("labels").style.pointerEvents = "none";
    /* One gray mask over everything outside NCR (land and sea), with the exact
       NCR outline cut out, so the mask never overlaps or misses NCR's edge. */
    const WORLD = [[-10, 90], [-10, 150], [35, 150], [35, 90]];
    this.layers.mask = L.polygon([WORLD, ...NCR_OUTLINE], { pane: "mask", interactive: false, stroke: false, fillColor: "#7D8A92", fillOpacity: 0.5 }).addTo(m);
    m.createPane("ncrline").style.zIndex = 450; m.getPane("ncrline").style.pointerEvents = "none";
    /* NCR perimeter: white casing under a navy line, so it reads differently from a selected city's plain navy outline. */
    this.layers.ncrLine = L.layerGroup([
      L.polygon(NCR_OUTLINE, { pane: "ncrline", interactive: false, fill: false, color: "#FFFFFF", weight: 6, opacity: 0.85 }),
      L.polygon(NCR_OUTLINE, { pane: "ncrline", interactive: false, fill: false, color: "#122D40", weight: 2, opacity: 1 })]).addTo(m);
    this.layers.heat = this.makeHeatLayer().addTo(m);
    this.layers.cities = L.geoJSON(NCR_GEO, {
      style: f => this.cityStyle(f.properties.id),
      onEachFeature: (f, layer) => {
        const id = f.properties.id;
        layer.on("click", () => this.handlers.onSelect({ type: "city", id }));
        layer.on("mouseover", () => layer.setStyle({ weight: 3, color: "#0E2A3B", opacity: 1 }));
        layer.on("mouseout", () => { layer.setStyle(this.cityStyle(id)); const sel = this.model.state.selected; if (sel?.type === "city" && sel.id !== id) this.layers.cities.eachLayer(l => { if (l.feature.properties.id === sel.id) l.bringToFront(); }); });
        layer.bindTooltip(() => this.cityTip(id), { sticky: true, className: "tt", direction: "top", opacity: 1 });
      }
    }).addTo(m);
  }

  cityStyle(id) {
    const s = this.model.state, sel = s.selected?.type === "city" && s.selected.id === id;
    if (s.layer === "fac") return this.facCityStyle(id);
    if (s.layer === "crowd") return { color: sel ? "#0E2A3B" : "#FFFFFF", weight: sel ? 3.2 : 1, opacity: sel ? 1 : 0.8, fillColor: "#000", fillOpacity: 0.001 };
    const v = tbVal(id, s.year, MAP_MEASURE), k = tbClass(v, MAP_MEASURE);
    return { color: sel ? "#0E2A3B" : "#FFFFFF", weight: sel ? 3.4 : 1.1, opacity: sel ? 1 : 0.9, dashArray: k < 0 ? "4 4" : null,
      fillColor: k < 0 ? "#9AA6AE" : TB_COLORS[k], fillOpacity: k < 0 ? 0.35 : 0.8 };
  }
  cityTip(id) {
    const s = this.model.state;
    if (s.layer === "fac") return this.facCityTip(id);
    if (s.layer === "crowd") {
      const n = PLACES.filter(p => p.city === id).length;
      return `<b>${esc(cityName(id))}</b><br>${n} listed public place${n === 1 ? "" : "s"} (crowding proxy)`;
    }
    const v = tbVal(id, s.year, MAP_MEASURE);
    return `<b>${esc(cityName(id))}</b><br>${v == null ? `No data for ${s.year}` : `${fmt(v)} TB cases, ${s.year}`}`;
  }

  /* ---------- crowd heat surface (canvas, clipped to NCR) ---------- */
  makeHeatLayer() {
    const view = this;
    const Heat = L.Layer.extend({
      onAdd(map) { this._map = map; this._c = L.DomUtil.create("canvas", "heat-canvas leaflet-zoom-hide"); this._c.setAttribute("aria-hidden", "true"); map.getPane("heat").appendChild(this._c); map.on("moveend resize", this.redraw, this); this.redraw(); },
      onRemove(map) { this._c.remove(); map.off("moveend resize", this.redraw, this); },
      redraw() {
        const map = this._map; if (!map) return;
        const size = map.getSize(), c = this._c, dpr = Math.min(2, window.devicePixelRatio || 1);
        L.DomUtil.setPosition(c, map.containerPointToLayerPoint([0, 0]));
        c.width = Math.round(size.x * dpr); c.height = Math.round(size.y * dpr); c.style.width = size.x + "px"; c.style.height = size.y + "px";
        const ctx = c.getContext("2d"); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, size.x, size.y);
        if (view.model.state.layer !== "crowd") return;
        /* One continuous surface over all of NCR. Every cell takes the
           distance-weighted average of the estimated crowding at all listed places
           (closed = 0%), so colours between places are interpolated, not measured. */
        const S = 4, w = Math.ceil(size.x / S) + 1, h = Math.ceil(size.y / S) + 1;
        const mpp = 156543.03 * Math.cos(14.6 * Math.PI / 180) / Math.pow(2, map.getZoom());
        const eps2 = Math.pow(400 / mpp / S, 2);   // 400 m smoothing so a cell on a place is not a hard spike
        /* With OpenStreetMap places loaded, the surface is the foot-traffic indicator (OsmFoot);
           until then (or if the download fails) it falls back to the 52 listed places. */
        const osm = OsmFoot.ready() ? OsmFoot.grid(map, view.model.state, w, h, S) : null;
        const pts = osm ? [] : PLACES.map(p => { const b = view.model.busyAt(p), q = map.latLngToContainerPoint([p.lat, p.lng]); return [q.x / S, q.y / S, (b == null ? 0 : b) / 100]; });
        const f = document.createElement("canvas"); f.width = w; f.height = h;
        const fx = f.getContext("2d"), out = fx.createImageData(w, h), o = out.data;
        for (let y = 0, i = 0; y < h; y++) for (let x = 0; x < w; x++, i++) {
          let num = 0, den = 0;
          if (osm) { num = osm[i]; den = 1; }
          else for (const [px, py, v] of pts) { const d2 = (x - px) * (x - px) + (y - py) * (y - py) + eps2, k = 1 / (d2 * d2); num += v * k; den += k; }
          const [R, G, B] = crowdRGB(den ? num / den : 0);
          o[i * 4] = R; o[i * 4 + 1] = G; o[i * 4 + 2] = B; o[i * 4 + 3] = 168;
        }
        fx.putImageData(out, 0, 0);
        ctx.imageSmoothingEnabled = true; ctx.drawImage(f, 0, 0, w * S, h * S);
        ctx.globalCompositeOperation = "destination-in"; ctx.fillStyle = "#000"; ctx.beginPath();
        for (const ft of NCR_GEO.features) for (const poly of ft.geometry.coordinates) for (const ring of poly) {
          ring.forEach(([x, y], i) => { const q = map.latLngToContainerPoint([y, x]); i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y); }); ctx.closePath();
        }
        ctx.fill(); ctx.globalCompositeOperation = "source-over";
      }
    });
    return new Heat();
  }

  /* ---------- markers and labels ---------- */
  drawLabels() {
    if (this.mode !== "leaflet") return;
    if (this.layers.labels) this.map.removeLayer(this.layers.labels);
    const s = this.model.state, z = this.map.getZoom();
    if (z < 10.5 || Prefs.current.labels === false) { this.layers.labels = null; return; }
    /* Caloocan is split in two; label both parts so the name shows wherever you look. */
    this.layers.labels = L.layerGroup([...Object.entries(CITY_LABEL_PT), ["caloocan", [14.6583, 120.9876]]].map(([id, ll]) => {
      const v = s.layer === "tb" ? tbVal(id, s.year, MAP_MEASURE) : null;
      const val = s.layer === "tb" ? `<em>${v == null ? "No data" : shortNum(v)}</em>` : "";
      const k = tbClass(v, MAP_MEASURE);
      return L.marker(ll, { pane: "labels", interactive: false, keyboard: false,
        icon: L.divIcon({ className: "city-label", iconSize: [0, 0], html: `<span class="${k >= 3 ? "on-dark" : ""}">${z >= 12 || s.layer !== "tb" ? `<b>${esc(CITY[id].name)}</b>` : ""}${val}</span>` }) });
    })).addTo(this.map);
  }

  drawPlaces() {
    if (this.mode !== "leaflet") return;
    if (this.layers.places) this.map.removeLayer(this.layers.places);
    this.layers.places = null;
    const s = this.model.state;
    if (s.layer !== "crowd" || s.selected?.type !== "place") return;
    const z = this.map.getZoom(), size = z >= 13 ? 18 : z >= 12 ? 14 : 11;
    this.layers.places = L.layerGroup(PLACES.filter(p => p.id === s.selected.id).map(p => {
      const b = this.model.busyAt(p), lv = busyLevel(b), sel = s.selected?.type === "place" && s.selected.id === p.id;
      const label = `${p.name}, ${CATEGORY[p.cat].label}. ${b == null ? "Usually closed" : `${lv} (${b}% of its busiest hour)`} on ${DOW[s.day]} at ${pad2(s.hour)}:00. Proxy: assumed typical pattern for this type of place, not measured.`;
      const mk = L.marker([p.lat, p.lng], { keyboard: true, title: label, alt: label, riseOnHover: true, zIndexOffset: sel ? 900 : 300,
        icon: L.divIcon({ className: "pm-wrap", iconSize: [size, size], html: `<span class="pm${sel ? " on" : ""}" style="--c:${LEVEL_COLOR[lv]}"></span>` }) });
      mk.bindTooltip(`<b>${esc(p.name)}</b><br>${esc(CATEGORY[p.cat].label)} · ${esc(CITY[p.city].name)}<br>${b == null ? "Usually closed at this hour" : `${lv}: ${b}% of its busiest hour`}<br><small>Proxy: typical pattern for a ${esc(CATEGORY[p.cat].label.toLowerCase())}. Not measured, not live.</small>`, { className: "tt", direction: "top", offset: [0, -size / 2] });
      mk.on("click", () => this.handlers.onSelect({ type: "place", id: p.id }));
      return mk;
    })).addTo(this.map);
  }

  /* ---------- draw everything for the current state ---------- */
  draw() {
    if (this.mode !== "leaflet") return;
    this.layers.cities.setStyle(f => this.cityStyle(f.properties.id));
    /* Draw the selected city last so its whole outline shows above its neighbours. */
    const sel = this.model.state.selected;
    if (sel?.type === "city") this.layers.cities.eachLayer(l => { if (l.feature.properties.id === sel.id) l.bringToFront(); });
    this.layers.heat.redraw();
    this.drawLabels(); this.drawPlaces(); this.drawFacilities();
  }

  render(changed) {
    const c = new Set(changed);
    if (["layer", "year", "isAdmin"].some(k => c.has(k))) this.renderLayerBar();
    if (["layer", "year", "day", "hour", "date", "minute", "second"].some(k => c.has(k))) this.renderLegend();
    if (["layer", "year", "day", "hour", "selected"].some(k => c.has(k))) this.draw();
    /* The first time the crowding layer opens, download the OpenStreetMap places; redraw when they arrive. */
    if (this.model.state.layer === "crowd") OsmFoot.ensure(() => this.onOsmChange());
  }

  /* OpenStreetMap places finished loading (or failed): redraw the surface and legend, and let
     the controller refresh the open card (it shows "foot traffic around here"). */
  onOsmChange() { this.draw(); this.renderLegend(); this.handlers.onOsmChange?.(); }

  /* ---------- legend (bottom right) ---------- */
  /* Legend: only the keys, always fully shown, compact: no sources, no NCR
     population, no "More about this layer". */
  renderLegend() {
    const s = this.model.state;
    let h;
    if (s.layer === "fac") h = this.facLegend();
    else if (s.layer === "tb") {
      const st = yStatus(s.year), empty = tbVal("all", s.year, MAP_MEASURE) == null;
      const n = Array(TB_COLORS.length + 1).fill(0);
      if (!empty) for (const c of CITIES) { const k = tbClass(tbVal(c.id, s.year, MAP_MEASURE), MAP_MEASURE); n[k < 0 ? TB_COLORS.length : k]++; }
      const row = (sw, label, x) => `<li>${sw}<span>${label}</span><span class="lg-n num" title="${x} of 17 cities">${x}</span></li>`;
      h = `<h3 class="lg-title">Notified TB cases, ${s.year}</h3>
        ${empty ? `<p class="lg-note">No data for ${s.year}.</p>` : `<ul class="lg-classes">${tbLegendRows(MAP_MEASURE).map((r, i) => row(`<span class="sw" style="background:${r.color}"></span>`, r.long, n[i])).join("")}${row('<span class="sw sw-na"></span>', "No data", n[TB_COLORS.length])}</ul>`}
        ${!empty && st.label !== "Full year" ? `<p class="lg-note">${esc(st.label)}</p>` : ""}`;
    } else {
      const lv = [["Low", "under 40%"], ["Moderate", "40–69%"], ["High", "70–89%"], ["Very high", "90%+"]];
      const st = OsmFoot.status(), ok = st.state === "ok";
      h = `<h3 class="lg-title">${ok ? "Foot traffic (OpenStreetMap)" : "Crowding (estimated)"}</h3>
        <div class="lg-grad" style="background:${CROWD_GRADIENT}"></div>
        <ul class="lg-ticks">${[0, 40, 70, 90].map(t => `<li style="left:${t}%">${t}%</li>`).join("")}</ul>
        <ul class="lg-classes">${lv.map(([k, t]) => `<li><span class="sw" style="background:${LEVEL_COLOR[k]}"></span><span>${k}</span><span class="lg-n">${t}</span></li>`).join("")}</ul>
        ${ok ? `<p class="lg-note">Built from ${fmt(st.n)} OpenStreetMap places that draw foot traffic (malls, markets, stations, schools, places of worship), weighted by type and typical hour. 100% = the busiest 5% of NCR. Not counted, not live.</p>
          <p class="lg-src">${osmSourceHTML(st)}</p>`
        : st.state === "loading" || st.state === "idle" ? `<p class="lg-note">Downloading foot-traffic places from OpenStreetMap…</p>`
        : `<p class="lg-note">OpenStreetMap places could not be downloaded${st.error ? ` (${esc(st.error)})` : ""}, so this shows the typical-week estimate for ${PLACES.length} listed places. <button type="button" class="link" id="osmRetry">Try again</button></p>`}`;
    }
    $("#legend").innerHTML = h;
    $("#osmRetry")?.addEventListener("click", () => { OsmFoot.retry(() => this.onOsmChange()); this.renderLegend(); });
  }

  /* Shown when the map library cannot load: the same city-level records as a table, no map. */
  renderFallback() {
    const y = this.model.state.year, rows = CITIES.map(c => [cityName(c.id), tbVal(c.id, y, MAP_MEASURE)]);
    const any = rows.some(r => r[1] != null);
    $("#mapFallback").innerHTML = `<div class="fb-inner"><h2>Notified TB cases by city, ${y}</h2>
      ${any ? `<table class="fb-table"><thead><tr><th scope="col">City or municipality</th><th scope="col" class="num">Notified TB cases</th></tr></thead>
      <tbody>${rows.map(([n, v]) => `<tr><td>${esc(n)}</td><td class="num">${v == null ? "No data" : fmt(v)}</td></tr>`).join("")}</tbody></table>
      <p class="xs muted">Whole-city totals from cleaned_tb_data.csv. No map is drawn, so no locations are implied.</p>`
      : `<p class="small muted">${esc(yStatus(y).note)}</p>`}</div>`;
  }

  renderStatus() {
    let h = "";
    /* Notices about skipped data rows are not shown on the map. */
    if (this.mode === "leaflet" && !this.tileOk && this.tileErr > 0) h = `<span class="pill">${icon("i-info")}Street map tiles could not load. Boundaries and layers still work.${location.protocol === "file:" ? " Open the site through serve.ps1 (http://localhost:8000): OpenStreetMap blocks tiles for pages opened straight from disk." : ""}</span>`;
    if (location.protocol === "file:" && this.mode !== "fallback" && !this.tileErr) h = `<span class="pill">${icon("i-info")}Opened from disk. Run serve.ps1 and open http://localhost:8000 so the street map and data files can load.</span>`;
    if (this.mode === "fallback") {
      h = `<span class="pill">${icon("i-info")}The map could not load. TB records are shown as a table instead.</span>`;
      $("#mapFallback").hidden = false;
      this.renderFallback();
    }
    $("#mapStatus").innerHTML = h;
  }

  /* ---------- camera ---------- */
  pad() {
    const wide = window.innerWidth >= 900, col = $("#ctrlCol");
    if (wide) return { paddingTopLeft: [(col ? col.offsetWidth : 336) + 28, 24], paddingBottomRight: [70, 24] };
    return { paddingTopLeft: [16, (col ? col.offsetTop + col.offsetHeight : 160) + 12], paddingBottomRight: [56, 24] };
  }
  focusNCR(animate) { if (this.map) this.map.fitBounds(L.geoJSON(NCR_GEO).getBounds(), { ...this.pad(), animate }); }
  zoomTo(sel) {
    if (!this.map || !sel) return;
    if (sel.type.startsWith("fac")) { this.facZoom(sel); return; }
    if (sel.type === "place") { const p = PLACE[sel.id]; this.map.setView([p.lat, p.lng], Math.max(this.map.getZoom(), 14)); return; }
    this.layers.cities.eachLayer(l => { if (l.feature.properties.id === sel.id) this.map.fitBounds(l.getBounds(), { ...this.pad(), maxZoom: 12.5 }); });
  }
  invalidate() { if (this.map) setTimeout(() => { this.map.invalidateSize(); this.layers.heat?.redraw(); }, 60); }
}
