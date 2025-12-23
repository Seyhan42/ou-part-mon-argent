// assets/nav-auth.js
(function () {
  function isLoggedInLocal() {
    try {
      const s = JSON.parse(localStorage.getItem("auth_session_v1"));
      return !!(s && s.email);
    } catch {
      return false;
    }
  }

  async function isLoggedInSupabase() {
    try {
      if (!window.supabase?.auth?.getSession) return false;
      const { data } = await window.supabase.auth.getSession();
      return !!data?.session;
    } catch {
      return false;
    }
  }

  async function run() {
    // Supporte ton auth localStorage (MVP) + Supabase si tu l’as
    const loggedIn = (await isLoggedInSupabase()) || isLoggedInLocal();

    const showIfIn = document.querySelectorAll("[data-auth='in']");
    const showIfOut = document.querySelectorAll("[data-auth='out']");

    showIfIn.forEach(el => (el.style.display = loggedIn ? "" : "none"));
    showIfOut.forEach(el => (el.style.display = loggedIn ? "none" : ""));

    // Bouton logout (local)
    const logoutBtn = document.querySelector("[data-logout]");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", async () => {
        // Supabase logout si dispo
        if (window.supabase?.auth?.signOut) {
          await window.supabase.auth.signOut();
        }
        // Local logout
        localStorage.removeItem("auth_session_v1");
        window.location.href = "/login.html";
      });
    }
  }

  // Run after DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();
