/* =====================================================================
   Entry point (loaded by SPIRO.html as <script type="module">).
   It only loads src/main.js. main.js imports the whole app, including the
   static map data (src/models/static-data-model.js), which waits for its JSON
   files. If any of that fails, for example a data file is missing or the
   page was opened from disk, this catch shows one clear message instead of
   a blank page. The real error goes to the browser console for developers.
   ===================================================================== */
try {
  await import("./main.js");
} catch (err) {
  console.error("SPIRO could not start:", err);
  const box = document.getElementById("mapLoading") || document.body;
  box.hidden = false;
  const fromDisk = location.protocol === "file:";
  const msg = document.createElement("div");
  msg.className = "boot-error";
  msg.setAttribute("role", "alert");
  /* textContent only: the error text may contain a file path, never HTML. */
  const h = document.createElement("p"); h.textContent = "SPIRO could not start.";
  const p = document.createElement("p");
  p.textContent = fromDisk
    ? "This page was opened straight from a file. Start serve.ps1 and open http://localhost:8000 instead."
    : `A required data file could not be loaded (${err?.file || err?.message || "unknown error"}). Check that the data folder is complete, then reload.`;
  msg.append(h, p);
  box.replaceChildren(msg);
}
