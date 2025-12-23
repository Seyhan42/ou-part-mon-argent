/* =========================
   auth.js — Local auth MVP
   ========================= */

const AUTH_KEY = "auth_session_v1";
const USERS_KEY = "auth_users_v1"; // array [{email, passwordHash, createdAt}]

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

// Simple hash (NOT secure). For MVP only.
async function sha256(text) {
  const enc = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
  } catch {
    return [];
  }
}

function setUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function setSession(email) {
  localStorage.setItem(AUTH_KEY, JSON.stringify({
    email,
    loggedInAt: new Date().toISOString()
  }));
}

function getSession() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_KEY));
  } catch {
    return null;
  }
}

function clearSession() {
  localStorage.removeItem(AUTH_KEY);
}

function isLoggedIn() {
  const s = getSession();
  return !!(s && s.email);
}

function requireAuth(redirectTo = "login.html") {
  if (!isLoggedIn()) {
    window.location.href = redirectTo;
  }
}

async function registerUser(email, password) {
  const e = normalizeEmail(email);
  if (!e) return { ok: false, message: "Email invalide." };
  if (!password || password.length < 6) return { ok: false, message: "Mot de passe trop court (min 6 caractères)." };

  const users = getUsers();
  const exists = users.some(u => u.email === e);
  if (exists) return { ok: false, message: "Cet email existe déjà." };

  const passwordHash = await sha256(password);
  users.push({ email: e, passwordHash, createdAt: new Date().toISOString() });
  setUsers(users);

  setSession(e);
  return { ok: true, message: "Compte créé." };
}

async function loginUser(email, password) {
  const e = normalizeEmail(email);
  if (!e) return { ok: false, message: "Email invalide." };
  if (!password) return { ok: false, message: "Mot de passe requis." };

  const users = getUsers();
  const user = users.find(u => u.email === e);
  if (!user) return { ok: false, message: "Aucun compte trouvé avec cet email." };

  const passwordHash = await sha256(password);
  if (passwordHash !== user.passwordHash) return { ok: false, message: "Mot de passe incorrect." };

  setSession(e);
  return { ok: true, message: "Connecté." };
}

function logout(redirectTo = "login.html") {
  clearSession();
  window.location.href = redirectTo;
}

function currentUserEmail() {
  const s = getSession();
  return s?.email || "";
}
