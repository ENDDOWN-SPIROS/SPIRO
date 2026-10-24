/* Inline SVG charts (no chart library). Margins grow with the root font size so labels never clip. */

import { esc, fmt, shortNum } from "../../utils/format.js";

export const Charts = (() => {
  const rootPx = () => parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;

  function niceTicks(max, n = 4) {
    if (!(max > 0)) return [0, 1];
    const raw = max / n, mag = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / mag;
    const step = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * mag;
    const top = Math.ceil(max / step) * step, t = [];
    for (let v = 0; v <= top + 1e-9; v += step) t.push(v);
    return t;
  }

  function attachTip(el, svg, xs, html) {
    let tip = el.querySelector(".tip");
    if (!tip) { tip = document.createElement("div"); tip.className = "tip"; tip.hidden = true; el.appendChild(tip); }
    const hl = svg.querySelector(".hover-line");
    const move = e => {
      const r = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal, sx = vb.width / r.width;
      const x = (e.clientX - r.left) * sx; let bi = 0, bd = Infinity;
      xs.forEach((xx, i) => { const d = Math.abs(xx - x); if (d < bd) { bd = d; bi = i; } });
      const h = html(bi);
      if (!h) { tip.hidden = true; if (hl) hl.setAttribute("opacity", 0); return; }
      tip.innerHTML = h; tip.hidden = false;
      const er = el.getBoundingClientRect();
      const left = Math.max(80, Math.min(er.width - 80, xs[bi] / sx));
      tip.style.left = left + "px"; tip.style.top = (e.clientY - er.top) + "px";
      if (hl) { hl.setAttribute("x1", xs[bi]); hl.setAttribute("x2", xs[bi]); hl.setAttribute("opacity", 1); }
    };
    svg.addEventListener("pointermove", move);
    svg.addEventListener("pointerdown", move);
    svg.addEventListener("pointerleave", () => { tip.hidden = true; if (hl) hl.setAttribute("opacity", 0); });
  }

  /* Line chart. Missing values leave a gap; partial values get a hollow marker and dashed link. */
  function line(el, o) {
    const k = rootPx() / 16;
    const W = Math.max(260, el.clientWidth || 560), H = Math.round((o.height || 240) * Math.max(1, k * 0.95));
    const m = { t: 14 * k, r: 14 * k, b: 34 * k, l: 52 * k };
    const iw = W - m.l - m.r, ih = H - m.t - m.b, n = o.labels.length;
    const all = o.series.flatMap(s => s.values).filter(v => v != null);
    if (!all.length) { el.innerHTML = `<p class="empty">No data for the selected filters.</p>`; return; }
    const ticks = niceTicks(Math.max(...all) * 1.05), top = ticks[ticks.length - 1];
    const X = i => m.l + (n === 1 ? iw / 2 : i * iw / (n - 1)), Y = v => m.t + ih - v / top * ih;
    const every = Math.max(1, Math.ceil(n * 44 * k / iw));
    let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.aria || "Line chart")}">`;
    (o.gaps || []).forEach(i => { const w = iw / Math.max(1, n - 1) * 0.8; s += `<rect x="${X(i) - w / 2}" y="${m.t}" width="${w}" height="${ih}" fill="var(--surface-2)" stroke="var(--line)" stroke-dasharray="3 3"/>`; });
    ticks.forEach(t => { s += `<line class="grid-l" x1="${m.l}" x2="${W - m.r}" y1="${Y(t)}" y2="${Y(t)}"/><text class="ax" x="${m.l - 6 * k}" y="${Y(t) + 4 * k}" text-anchor="end">${shortNum(t)}</text>`; });
    o.labels.forEach((l, i) => { if (i % every === 0 || i === o.hiIdx) s += `<text class="ax${o.hiIdx === i ? " hi" : ""}" x="${X(i)}" y="${H - m.b + 18 * k}" text-anchor="middle">${esc(l)}</text>`; });
    if (o.hiIdx != null) s += `<line x1="${X(o.hiIdx)}" x2="${X(o.hiIdx)}" y1="${m.t}" y2="${m.t + ih}" stroke="var(--primary)" stroke-opacity=".22" stroke-width="10"/>`;
    s += `<line class="hover-line" x1="0" x2="0" y1="${m.t}" y2="${m.t + ih}" stroke="var(--muted)" stroke-dasharray="3 3" opacity="0"/>`;
    o.series.forEach(se => {
      let d = "", dd = "", pen = false;
      se.values.forEach((v, i) => {
        if (v == null) { pen = false; return; }
        const partial = se.partial && se.partial(i);
        if (partial && i > 0 && se.values[i - 1] != null) { dd += `M${X(i - 1)},${Y(se.values[i - 1])}L${X(i)},${Y(v)}`; pen = false; return; }
        d += (pen ? "L" : "M") + X(i) + "," + Y(v); pen = true;
      });
      s += `<path d="${d}" fill="none" stroke="${se.color}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>`;
      if (dd) s += `<path d="${dd}" fill="none" stroke="${se.color}" stroke-width="2" stroke-dasharray="5 4"/>`;
      se.values.forEach((v, i) => { if (v == null) return; const p = se.partial && se.partial(i); s += `<circle cx="${X(i)}" cy="${Y(v)}" r="${p ? 4 : 3.4}" fill="${p ? "var(--surface)" : se.color}" stroke="${se.color}" stroke-width="2"/>`; });
    });
    s += `<line class="base" x1="${m.l}" x2="${W - m.r}" y1="${m.t + ih}" y2="${m.t + ih}"/></svg>`;
    el.innerHTML = s;
    attachTip(el, el.querySelector("svg"), o.labels.map((_, i) => X(i)), i => {
      const rows = o.series.map(se => `<div><span class="tip-dot" style="background:${se.color}"></span>${esc(se.name)}: <b>${se.values[i] == null ? "no data" : (o.fmt || fmt)(se.values[i])}</b>${se.partial && se.partial(i) && se.values[i] != null ? " (partial)" : ""}</div>`).join("");
      return `<div class="tip-h">${esc(o.labels[i])}${o.tipNote ? " · " + esc(o.tipNote(i)) : ""}</div>${rows}`;
    });
  }

  /* Bar chart. */
  function bars(el, o) {
    const k = rootPx() / 16;
    const W = Math.max(260, el.clientWidth || 560), H = Math.round((o.height || 200) * Math.max(1, k * 0.95));
    const m = { t: 12 * k, r: 8 * k, b: 30 * k, l: 40 * k };
    const iw = W - m.l - m.r, ih = H - m.t - m.b, n = o.values.length, bw = iw / n;
    const ticks = o.ticks || niceTicks(o.max || Math.max(1, ...o.values.filter(v => v != null)));
    const T = ticks[ticks.length - 1], Y = v => m.t + ih - v / T * ih;
    const every = o.labelEvery || Math.max(1, Math.ceil(n * 40 * k / iw));
    let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.aria || "Bar chart")}">`;
    ticks.forEach(t => s += `<line class="grid-l" x1="${m.l}" x2="${W - m.r}" y1="${Y(t)}" y2="${Y(t)}"/><text class="ax" x="${m.l - 6 * k}" y="${Y(t) + 4 * k}" text-anchor="end">${t}${o.unit || ""}</text>`);
    o.values.forEach((v, i) => {
      const x = m.l + i * bw + bw * .14, w = Math.max(1, bw * .72), fill = o.color ? o.color(i, v) : "var(--primary)";
      s += v == null ? `<rect x="${x}" y="${m.t + ih - 2}" width="${w}" height="2" fill="var(--line-2)"/>`
        : `<rect x="${x}" y="${Y(v)}" width="${w}" height="${Math.max(1, m.t + ih - Y(v))}" rx="2" fill="${fill}"/>`;
      if (o.hi === i) s += `<rect x="${m.l + i * bw + 1}" y="${m.t}" width="${Math.max(2, bw - 2)}" height="${ih}" fill="none" stroke="var(--ink)" stroke-width="1.5" rx="3"/>`;
      if (i % every === 0) s += `<text class="ax" x="${m.l + i * bw + bw / 2}" y="${H - m.b + 17 * k}" text-anchor="middle">${esc(o.labels[i])}</text>`;
    });
    s += `<line class="base" x1="${m.l}" x2="${W - m.r}" y1="${m.t + ih}" y2="${m.t + ih}"/></svg>`;
    el.innerHTML = s;
    attachTip(el, el.querySelector("svg"), o.values.map((_, i) => m.l + i * bw + bw / 2), i => o.tip ? o.tip(i) : `${esc(o.labels[i])}: <b>${o.values[i] ?? "–"}</b>`);
  }

  return { line, bars, niceTicks };
})();
