/* Authentication and cloud hydration shared by every tracker page. */
const Auth = (function () {
  let user = null;
  let ready = false;
  let initPromise = null;
  let client = null;

  function isLoginPage() {
    return document.body.getAttribute("data-page") === "login";
  }

  function showError(message) {
    const el = document.getElementById("auth-error");
    if (el) {
      el.textContent = message;
      el.hidden = false;
    } else {
      console.error(message);
    }
  }

  function setLoading(loading) {
    const button = document.getElementById("auth-submit");
    const label = document.getElementById("auth-submit-label");
    if (button) button.disabled = loading;
    if (label) label.textContent = loading ? "Please wait..." : (button && button.dataset.mode === "signup" ? "Create account" : "Log in");
  }

  function requireConfig() {
    const config = window.SUPABASE_CONFIG || {};
    if (!config.url || !config.publishableKey) {
      throw new Error("Supabase is not configured. Add the publishable key in js/config.js.");
    }
    if (!window.supabase || !window.supabase.createClient) {
      throw new Error("The Supabase client failed to load.");
    }
    client = window.supabase.createClient(config.url, config.publishableKey);
  }

  async function signIn(email, password) {
    const result = await client.auth.signInWithPassword({ email, password });
    if (result.error) throw result.error;
    window.location.href = "index.html";
  }

  async function signUp(email, password) {
    const result = await client.auth.signUp({ email, password });
    if (result.error) throw result.error;
    if (result.data.session) {
      window.location.href = "index.html";
    } else {
      showError("Account created. Check your email to confirm it, then log in.");
    }
  }

  async function logout() {
    const result = await client.auth.signOut();
    if (result.error) console.error("Logout failed:", result.error);
    window.location.href = "login.html";
  }

  async function init() {
    if (initPromise) return initPromise;
    initPromise = (async () => {
      try {
        requireConfig();
        const result = await client.auth.getSession();
        if (result.error) throw result.error;
        user = result.data.session ? result.data.session.user : null;

        if (isLoginPage()) {
          if (user) window.location.href = "index.html";
          ready = true;
          document.dispatchEvent(new CustomEvent("app:ready"));
          return;
        }
        if (!user) {
          window.location.href = "login.html";
          return;
        }
        await AppStorage.hydrate(user, client);
        ready = true;
        document.body.classList.add("app-ready");
        document.dispatchEvent(new CustomEvent("app:ready"));
      } catch (error) {
        console.error("Auth initialization failed:", error);
        if (isLoginPage()) showError(error.message || "Authentication is unavailable.");
        else {
          document.body.classList.add("auth-failed");
          const message = document.createElement("div");
          message.className = "auth-fatal card";
          message.innerHTML = `<h2>Cloud connection unavailable</h2><p>${UI.esc(error.message || "Please try again later.")}</p><a class="btn btn-primary" href="login.html">Return to login</a>`;
          document.body.appendChild(message);
        }
      }
    })();
    return initPromise;
  }

  function renderAccount() {
    const email = document.getElementById("account-email");
    const button = document.getElementById("logout-btn");
    if (email && user) email.textContent = user.email || "Signed in";
    if (button) button.addEventListener("click", logout);
  }

  function reportCloudError(error) {
    console.error("Cloud sync failed:", error);
    if (typeof UI !== "undefined" && UI.toast) UI.toast("Cloud sync is temporarily unavailable. Your changes are kept locally and will retry.", "error");
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (isLoginPage()) {
      try { requireConfig(); } catch (error) { showError(error.message); }
      const form = document.getElementById("auth-form");
      const toggle = document.getElementById("auth-toggle");
      if (form) form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const mode = form.dataset.mode;
        const email = document.getElementById("auth-email").value.trim();
        const password = document.getElementById("auth-password").value;
        const confirmation = document.getElementById("auth-confirm");
        if (mode === "signup" && confirmation && password !== confirmation.value) {
          showError("Passwords do not match.");
          return;
        }
        setLoading(true);
        try { mode === "signup" ? await signUp(email, password) : await signIn(email, password); }
        catch (error) { showError(error.message || "Authentication failed."); }
        finally { setLoading(false); }
      });
      if (toggle) toggle.addEventListener("click", () => {
        const signup = form.dataset.mode !== "signup";
        form.dataset.mode = signup ? "signup" : "login";
        toggle.textContent = signup ? "Already have an account? Log in" : "Need an account? Sign up";
        document.getElementById("auth-confirm-wrap").hidden = !signup;
        document.getElementById("auth-title").textContent = signup ? "Create your account" : "Welcome back";
        document.getElementById("auth-submit").dataset.mode = signup ? "signup" : "login";
        document.getElementById("auth-submit-label").textContent = signup ? "Create account" : "Log in";
        document.getElementById("auth-error").hidden = true;
      });
    }
    init();
  });

  document.addEventListener("app:ready", renderAccount);
  return { init, logout, getUser: () => user, getClient: () => client, reportCloudError, isReady: () => ready };
})();
