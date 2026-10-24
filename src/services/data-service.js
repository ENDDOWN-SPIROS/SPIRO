/* =====================================================================
   Data service: the one place that fetches static JSON data files.
   Every request checks the HTTP status and the JSON before handing data
   to a model, so a missing or broken file gives a clear message instead
   of a silent blank map.
   ===================================================================== */

/** Error raised when a data file cannot be used. `file` is the path that failed. */
export class DataLoadError extends Error {
  constructor(file, reason) {
    super(`${file}: ${reason}`);
    this.name = "DataLoadError";
    this.file = file;
  }
}

/**
 * Fetch and parse one JSON file.
 * @param {string} path  path relative to SPIRO.html, e.g. "data/geo/ncr-cities.geojson"
 * @param {(value: any) => boolean} [check]  shape check; a false result rejects the file
 */
export async function fetchJSON(path, check) {
  let res;
  try { res = await fetch(path, { cache: "no-cache" }); }
  catch (e) {
    /* Pages opened straight from disk (file://) cannot fetch files; say so plainly. */
    throw new DataLoadError(path, location.protocol === "file:" ? "pages opened from a file cannot read data files; start serve.ps1 and open http://localhost:8000" : e.message);
  }
  if (!res.ok) throw new DataLoadError(path, `the server answered ${res.status}`);
  let value;
  try { value = await res.json(); }
  catch { throw new DataLoadError(path, "the file is not valid JSON"); }
  if (check && !check(value)) throw new DataLoadError(path, "the file does not have the expected structure");
  return value;
}
