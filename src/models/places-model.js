/* Places model: the 17 NCR cities (with 2025 projected population) and the 52 listed public places
   with their assumed typical-week busyness. Domain data and rules only; no DOM. */
import { VENUE_BASE } from "./static-data-model.js";

/* =====================================================================
   AppModel: reference data (cities, TB series, public places) and app state.
   Views never change state directly; controllers call the setters below,
   and the model emits "change" with the list of keys that changed.
   ===================================================================== */

/* ---------- Cities: 2025 projected population (DOH FHSIS Annual 2025); pop2020 = PSA 2020 Census ---------- */
export const CITIES = [
  { id: "caloocan", name: "Caloocan", pop: 1743812, pop2020: 1661584 }, { id: "laspinas", name: "Las Piñas", pop: 628652, pop2020: 606293 },
  { id: "makati", name: "Makati", pop: 294960, pop2020: 629616 }, { id: "malabon", name: "Malabon", pop: 396996, pop2020: 380522 },
  { id: "mandaluyong", name: "Mandaluyong", pop: 442115, pop2020: 425758 }, { id: "manila", name: "Manila", pop: 1911556, pop2020: 1846513 },
  { id: "marikina", name: "Marikina", pop: 471918, pop2020: 456059 }, { id: "muntinlupa", name: "Muntinlupa", pop: 561640, pop2020: 543445 },
  { id: "navotas", name: "Navotas", pop: 260395, pop2020: 247543 }, { id: "paranaque", name: "Parañaque", pop: 716560, pop2020: 689992 },
  { id: "pasay", name: "Pasay", pop: 452062, pop2020: 440656 }, { id: "pasig", name: "Pasig", pop: 842708, pop2020: 803159 },
  { id: "qc", name: "Quezon City", pop: 3079478, pop2020: 2960048 }, { id: "sanjuan", name: "San Juan", pop: 128083, pop2020: 126347 },
  { id: "taguig", name: "Taguig", pop: 1271871, pop2020: 886722 }, { id: "valenzuela", name: "Valenzuela", pop: 745850, pop2020: 714978 },
  { id: "pateros", name: "Pateros", pop: 66990, pop2020: 65227, muni: true }
];

export const CITY = Object.fromEntries(CITIES.map(c => [c.id, c]));

export const cityName = id => id === "all" ? "All of NCR" : CITY[id].name + (CITY[id].muni ? " (municipality)" : "");

/* ---------- TB records ----------
   TB values come only from data/cleaned_tb_data.csv, loaded by
   src/services/contract-loader.js and src/models/tb-data-model.js
   (YEARS, yStatus, TB, tbVal, trendFor, TB_BREAKS, tbClass are defined there). */

/* ---------- Public places and typical-week busyness ----------
   Each value is a share (0–100) of that place's own busiest hour in a typical week,
   the way services such as BestTime report it. These are PROXY patterns: one assumed
   weekly shape per place type (mall, market, transit, tourist), the same for every place
   of that type. They are not measured for any specific place, not live readings and not
   headcounts. There is no random per-place variation, so the map does not
   suggest place-specific measurements. */
export const CATEGORY = {
  mall: { label: "Mall", open: [10, 22] },
  market: { label: "Public market", open: [4, 20] },
  transit: { label: "Transit station", open: [5, 23] },
  tourist: { label: "Tourist destination", open: [6, 21] }
};

export const PLACES = (() => {
  const g = (h, mu, s) => Math.exp(-((h - mu) ** 2) / (2 * s * s));
  const PROFILE = {
    mall: (h, we, dow) => we ? .45 + .9 * g(h, 15.5, 3) : (.25 + .45 * g(h, 13, 2.5) + .75 * g(h, 18.5, 2)) * (dow === 5 && h >= 17 ? 1.12 : 1),
    market: (h, we) => we ? .2 + 1.0 * g(h, 7.5, 2.2) + .45 * g(h, 16, 2) : .15 + .9 * g(h, 7, 2) + .4 * g(h, 17, 2),
    transit: (h, we) => we ? .15 + .55 * g(h, 15, 4) : .22 + 1.0 * g(h, 7.5, 1.3) + .95 * g(h, 18, 1.5),
    tourist: (h, we) => we ? .15 + .95 * g(h, 16.5, 2.8) : .1 + .35 * g(h, 16, 3)
  };
  return VENUE_BASE.map(v => {
    const [o, c] = CATEGORY[v.cat].open;
    const week = [];
    for (let d = 0; d < 7; d++) {
      const row = [];
      for (let h = 0; h < 24; h++) row.push(h >= o && h < c ? PROFILE[v.cat](h, d === 0 || d === 6, d) : null);
      week.push(row);
    }
    const mx = Math.max(...week.flat().filter(x => x != null));
    return { ...v, week: week.map(row => row.map(x => x == null ? null : Math.round(100 * x / mx))) };
  });
})();

export const PLACE = Object.fromEntries(PLACES.map(p => [p.id, p]));

export function busyLevel(p) { if (p == null) return "Closed"; if (p < 40) return "Low"; if (p < 70) return "Moderate"; if (p < 90) return "High"; return "Very high"; }
