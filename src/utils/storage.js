/* Browser storage wrappers that never throw (private windows and blocked storage return the fallback). */
export const safeStorage = kind => ({
  get(key, fallback) { try { const v = window[kind].getItem(key); return v == null ? fallback : JSON.parse(v); } catch { return fallback; } },
  set(key, value) { try { window[kind].setItem(key, JSON.stringify(value)); return true; } catch { return false; } },
  remove(key) { try { window[kind].removeItem(key); } catch { /* Ignore */ } }
});

export const local = safeStorage("localStorage");

export const session = safeStorage("sessionStorage");
