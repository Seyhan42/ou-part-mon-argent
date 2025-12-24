// ============================================
// NAV-AUTH.JS - Gestion authentification nav
// Où part mon argent ?
// ============================================

(function () {
  // Vérifie si connecté via localStorage
  function isLoggedInLocal() {
    try {
      const s = JSON.parse(localStorage.getItem("auth_session_v1"));
      return !!(s && s.email);
    } catch {
      return false;
    }
  }

  // Vérifie si connecté via Supabase (si utilisé)
  async function isLoggedInSupabase() {
    try {
      if (!window.supabase?.auth?.getSession) return false;
      const { data } = await window.supabase.auth.getSession();
      return !!data?.session;
    } catch {
      return false;
    }
  }

  // Fonction principale
  async function run() {
    // Supporte auth localStorage (MVP) + Supabase si configuré
    const loggedIn = (await isLoggedInSupabase()) || isLoggedInLocal();

    // Éléments à afficher si connecté
    const showIfIn = document.querySelectorAll("[data-auth='in']");
    // Éléments à afficher si déconnecté
    const showIfOut = document.querySelectorAll("[data-auth='out']");

    showIfIn.forEach(el => {
      el.style.display = loggedIn ? "" : "none";
    });
    
    showIfOut.forEach(el => {
      el.style.display = loggedIn ? "none" : "";
    });

    // Gestion du bouton logout
    const logoutBtn = document.querySelector("[data-logout]");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", async () => {
        // Supabase logout si disponible
        if (window.supabase?.auth?.signOut) {
          await window.supabase.auth.signOut();
        }
        
        // Local logout
        localStorage.removeItem("auth_session_v1");
        
        // Redirection vers login
        window.location.href = "login.html";
      });
    }
  }

  // Exécuter après chargement du DOM
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();