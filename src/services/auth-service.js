/* =====================================================================
   Auth service: sign-up, log-in and log-out through Supabase Auth.
   Supabase stores the accounts and encrypts the passwords; SPIRO never
   stores a password. Only the project URL and the public "anon" key are
   used here. The anon key is meant for website code and only allows what
   Supabase's security rules allow. Never put the service_role key here.
   If the URL or key is missing, accounts are reported as unavailable.
   ===================================================================== */
import { APP_CONFIG } from "../config/app-config.js";

let clientPromise = null;

export const AuthService = {
  configured() {
    const c = APP_CONFIG.supabase;
    return !!(c && /^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(c.url) && c.anonKey && c.anonKey.length > 20);
  },

  /* Loads the vendored supabase-js bundle once, then creates the client. */
  client() {
    if (!this.configured()) return Promise.reject(new Error("Accounts are not available yet."));
    if (!clientPromise) {
      clientPromise = new Promise((resolve, reject) => {
        if (window.supabase?.createClient) return resolve();
        const s = document.createElement("script");
        s.src = "assets/vendor/supabase/supabase.js";
        s.onload = () => resolve(); s.onerror = () => reject(new Error("The sign-in library could not be loaded."));
        document.head.appendChild(s);
      }).then(() => window.supabase.createClient(APP_CONFIG.supabase.url, APP_CONFIG.supabase.anonKey, {
        auth: { persistSession: true, autoRefreshToken: true }
      }));
      clientPromise.catch(() => { clientPromise = null; });
    }
    return clientPromise;
  },

  /* Returns { user, needsConfirmation }. Supabase may ask the user to confirm the email first. */
  async signUp(email, password) {
    const sb = await this.client();
    const { data, error } = await sb.auth.signUp({ email, password });
    if (error) throw new Error(friendly(error));
    return { user: data.user, needsConfirmation: !data.session };
  },

  async logIn(email, password) {
    const sb = await this.client();
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw new Error(friendly(error));
    return data.user;
  },

  async logOut() {
    if (!this.configured()) return;
    const sb = await this.client();
    await sb.auth.signOut();
  },

  /* The signed-in user from an earlier visit, or null. Never throws. */
  async currentUser() {
    if (!this.configured()) return null;
    try { const sb = await this.client(); const { data } = await sb.auth.getSession(); return data.session?.user || null; }
    catch { return null; }
  }
};

/* Plain-language versions of common Supabase Auth errors. */
function friendly(error) {
  const m = String(error?.message || error || "");
  if (/invalid login credentials/i.test(m)) return "The email or password is not correct.";
  if (/email not confirmed/i.test(m)) return "Confirm your email first: open the link Supabase sent you, then log in.";
  if (/already registered|already exists/i.test(m)) return "An account with this email already exists. Log in instead.";
  if (/password/i.test(m) && /least|short|weak/i.test(m)) return "Choose a longer password (at least 8 characters).";
  if (/email address .* is invalid|email_address_invalid|not authorized/i.test(m)) return "This email address was not accepted. Use a real email address you can open.";
  if (/rate limit|too many/i.test(m)) return "Too many attempts. Wait a minute and try again.";
  if (/fetch|network/i.test(m)) return "Could not reach the account server. Check the internet connection.";
  return m || "Something went wrong. Try again.";
}
