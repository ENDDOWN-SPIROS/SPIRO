/* DOM helpers: element lookup, the icon sprite reference, <option> markup and the toast.
   Used by views and controllers only; models never touch the DOM. */
import { esc } from "./format.js";

export const $ = (sel, el = document) => el.querySelector(sel);

export const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];

export const opt = (value, label, selected) => `<option value="${esc(value)}"${selected ? " selected" : ""}>${esc(label)}</option>`;

/* Inline SVG icon from the sprite in index.html. */
export const icon = (id, size) => `<svg class="i"${size ? ` style="width:${size / 16}rem;height:${size / 16}rem"` : ""} aria-hidden="true" focusable="false"><use href="#${id}"/></svg>`;

export function toast(msg) {
  const t = $("#toast");
  t.textContent = msg; t.classList.add("show");
  clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove("show"), 3400);
}
