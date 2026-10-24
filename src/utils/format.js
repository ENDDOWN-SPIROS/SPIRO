/* Formatting helpers: HTML escaping, numbers and dates. Pure functions with no DOM access,
   so models, views and tests can all use them. */
export const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export const fmt = (n, d = 0) => (n == null || !isFinite(n)) ? "–"
  : Number(n).toLocaleString("en-PH", { minimumFractionDigits: d, maximumFractionDigits: d });

export const pct = (n, d = 1) => n == null || !isFinite(n) ? "–" : (n > 0 ? "+" : "") + fmt(n * 100, d) + "%";

export const shortNum = v => v >= 1e6 ? fmt(v / 1e6, 1) + "M" : v >= 1e4 ? fmt(v / 1e3, 0) + "k" : v >= 1e3 ? fmt(v / 1e3, 1) + "k" : fmt(v, v < 10 && v % 1 ? 1 : 0);

export const DOW = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const hourLabel = h => `${h % 12 === 0 ? 12 : h % 12} ${h < 12 ? "AM" : "PM"}`;

/* Calendar date + 24-hour time for the crowding pattern. */
export const pad2 = n => String(n).padStart(2, "0");

export const isoDate = d => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

export const parseIso = iso => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || ""); if (!m) return null; const d = new Date(+m[1], +m[2] - 1, +m[3]); return d.getMonth() === +m[2] - 1 ? d : null; };

export const dateLabel = iso => { const d = parseIso(iso); return d ? d.toLocaleDateString("en-PH", { weekday: "short", day: "numeric", month: "short", year: "numeric" }) : "No date"; };

export const timeLabel = s => `${pad2(s.hour)}:${pad2(s.minute)}`;

export const whenLabel = s => `${dateLabel(s.date)}, ${timeLabel(s)}`;
