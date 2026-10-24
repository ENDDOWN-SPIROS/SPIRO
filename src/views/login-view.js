/* =====================================================================
   LoginView: the Log In and Sign Up window.
   The view only draws the form and checks the fields; the controller
   sends them to the auth service and reports the result back here.
   Passwords are never stored by SPIRO.
   ===================================================================== */

import { $, $$, icon } from "../utils/dom.js";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export const LoginView = {
  /* mode: "login" | "signup". handlers.onSubmit({ mode, email, password }) returns a Promise. */
  open(handlers, opener, mode = "login") {
    const m = $("#loginModal");
    this._opener = this._opener || opener || document.activeElement;
    this._handlers = handlers;
    const signup = mode === "signup";
    m.innerHTML = `<div class="modal-in">
      <div class="modal-head"><h2 id="loginTitle">${signup ? "Sign Up" : "Log In"}</h2>
        <button type="button" class="icon-btn" id="loginClose" aria-label="Close">${icon("i-close")}</button></div>
      <form id="loginForm" novalidate>
        <div class="field"><label for="lgEmail">Email</label><input type="email" id="lgEmail" autocomplete="email" aria-describedby="lgEmail-e"><span class="err" id="lgEmail-e" hidden></span></div>
        <div class="field"><label for="lgPass">Password</label><input type="password" id="lgPass" autocomplete="${signup ? "new-password" : "current-password"}" aria-describedby="lgPass-e"><span class="err" id="lgPass-e" hidden></span></div>
        ${signup ? `<div class="field"><label for="lgPass2">Confirm password</label><input type="password" id="lgPass2" autocomplete="new-password" aria-describedby="lgPass2-e"><span class="err" id="lgPass2-e" hidden></span></div>` : ""}
        <p class="err" id="lgForm-e" role="alert" hidden></p>
        <div class="form-actions"><button type="submit" class="btn np-login" id="loginSubmit">${signup ? "Sign Up" : "Log-In"}</button></div>
        <p class="small muted lg-switch">${signup
          ? `Already have an account? <button type="button" class="link-btn" id="lgSwitch">Log In</button>`
          : `No account yet? <button type="button" class="link-btn" id="lgSwitch">Sign Up</button>`}</p>
      </form>
    </div>`;
    m.hidden = false; $("#modalScrim").hidden = false;
    $("#loginClose").addEventListener("click", () => this.close());
    $("#lgSwitch").addEventListener("click", () => this.open(handlers, null, signup ? "login" : "signup"));
    $("#loginForm").addEventListener("submit", e => { e.preventDefault(); this.submit(mode); });
    $("#lgEmail").focus();
  },

  async submit(mode) {
    const signup = mode === "signup";
    const email = $("#lgEmail").value.trim(), pass = $("#lgPass").value, errs = {};
    if (!EMAIL_RE.test(email)) errs.lgEmail = "Enter an email address, like name@example.com.";
    if (!pass) errs.lgPass = "Enter a password.";
    else if (signup && pass.length < 8) errs.lgPass = "Use at least 8 characters.";
    if (signup && !errs.lgPass && $("#lgPass2").value !== pass) errs.lgPass2 = "The passwords do not match.";
    $$("#loginForm .err").forEach(x => { x.hidden = true; x.textContent = ""; });
    $$("#loginForm [aria-invalid]").forEach(x => x.removeAttribute("aria-invalid"));
    Object.entries(errs).forEach(([k, msg]) => { const er = $("#" + k + "-e"); er.textContent = msg; er.hidden = false; $("#" + k).setAttribute("aria-invalid", "true"); });
    if (Object.keys(errs).length) { $("#" + Object.keys(errs)[0]).focus(); return; }

    const btn = $("#loginSubmit"), label = btn.textContent;
    btn.disabled = true; btn.textContent = signup ? "Signing up…" : "Logging in…";
    try {
      await this._handlers.onSubmit({ mode, email, password: pass });
    } catch (err) {
      this.showError(err?.message || "Something went wrong. Try again.");
    } finally {
      if (!$("#loginModal").hidden && $("#loginSubmit")) { btn.disabled = false; btn.textContent = label; }
    }
  },

  /* A message under the form (textContent only, never HTML). */
  showError(msg) { const e = $("#lgForm-e"); if (!e) return; e.textContent = msg; e.hidden = false; },

  close() {
    const m = $("#loginModal"); if (m.hidden) return;
    m.hidden = true; m.innerHTML = ""; $("#modalScrim").hidden = true;
    this._opener?.focus?.(); this._opener = null;
  },
  isOpen() { return !$("#loginModal").hidden; }
};
