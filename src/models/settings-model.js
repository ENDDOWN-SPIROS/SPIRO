/* Settings model: theme and map-label preferences saved in this browser (localStorage). */
import { safeStorage } from "../utils/storage.js";

/* Display preferences shown in the Settings overlay. Per-browser conveniences in localStorage. */
export const SETTINGS_KEY = "spiro.settings.v1";

export const Prefs = {
  /* The settings in use right now; views read this instead of a global. */
  current: { theme: "system", labels: true },
  defaults: { theme: "system", labels: true, markers: true },
  load() { const v = safeStorage("localStorage").get(SETTINGS_KEY, {}); return { ...this.defaults, ...(v && typeof v === "object" ? v : {}) }; },
  save(v) { safeStorage("localStorage").set(SETTINGS_KEY, v); }
};
