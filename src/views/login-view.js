/* =====================================================================
   LoginView: front-end log-in screen for health office staff.
   There is no account server, so nothing typed here is checked, stored
   or sent. Continuing only switches this browser tab to the Admin panel.
   The dialog says so plainly and lists what is still needed.
   ===================================================================== */

import { $, $$, icon } from "../utils/dom.js";

export const LoginView = {
  open(handlers, opener) {
    const m = $("#loginModal");
    this._opener = opener || document.activeElement;
    m.innerHTML = `<div class="modal-in">
      <div class="modal-head"><h2 id="loginTitle">Log In</h2>
        <button type="button" class="icon-btn" id="loginClose" aria-label="Close log in">${icon("i-close")}</button></div>
      <form id="loginForm" novalidate>
        <div class="field"><label for="lgEmail">Email</label><input type="email" id="lgEmail" autocomplete="off" aria-describedby="lgEmail-e"><span class="err" id="lgEmail-e" hidden></span></div>
        <div class="field"><label for="lgPass">Password</label><input type="password" id="lgPass" autocomplete="off" aria-describedby="lgPass-e"><span class="err" id="lgPass-e" hidden></span></div>
        <div class="form-actions"><button type="submit" class="btn np-login" id="loginSubmit">Log-In</button></div>
      </form>
    </div>`;
    m.hidden = false; $("#modalScrim").hidden = false;
    const close = () => this.close();
    $("#loginClose").addEventListener("click", close);
    $("#loginForm").addEventListener("submit", e => {
      e.preventDefault();
      const email = $("#lgEmail").value.trim(), pass = $("#lgPass").value, errs = {};
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) errs.lgEmail = "Enter an email address, like name@example.gov.ph.";
      if (!pass) errs.lgPass = "Enter a password.";
      $$("#loginForm .err").forEach(x => { x.hidden = true; x.textContent = ""; });
      $$("#loginForm [aria-invalid]").forEach(x => x.removeAttribute("aria-invalid"));
      Object.entries(errs).forEach(([k, msg]) => { const er = $("#" + k + "-e"); er.textContent = msg; er.hidden = false; $("#" + k).setAttribute("aria-invalid", "true"); });
      if (Object.keys(errs).length) { $("#" + Object.keys(errs)[0]).focus(); return; }
      $("#loginForm").reset();                // nothing is kept
      this._opener = null;
      this.close();
      handlers.onContinue();
    });
    $("#lgEmail").focus();
  },
  close() {
    const m = $("#loginModal"); if (m.hidden) return;
    m.hidden = true; m.innerHTML = ""; $("#modalScrim").hidden = true;
    this._opener?.focus?.();
  },
  isOpen() { return !$("#loginModal").hidden; }
};
