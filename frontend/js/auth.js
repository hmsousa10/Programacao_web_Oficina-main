/* ========================================================
   SGO - auth.js  |  Authentication & Session Management
   ======================================================== */

'use strict';

const TOKEN_KEY = 'sgo_token';
const USER_KEY  = 'sgo_user';

/* ── Token ── */
function getToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

/* ── Current User ── */
function getCurrentUser() {
  const raw = sessionStorage.getItem(USER_KEY);
  if (!raw) return null;
  try { 
    const user = JSON.parse(raw);
    // Garantir que o ID é um número, caso venha como string
    if (user && user.id) user.id = parseInt(user.id);
    return user;
  }
  catch (_) { return null; }
}

/* ── Redirect by role ── */
function redirectByRole(user) {
  if (!user) { window.location.href = 'index.html'; return; }
  switch (user.role) {
    case 'MANAGER':
    case 'ADMIN':     window.location.href = 'dashboard.html'; break;
    case 'RECEPTION': window.location.href = 'agenda.html';    break; // Receção vai direto para a Agenda!
    case 'MECHANIC':  window.location.href = 'mecanico.html';  break;
    default:          window.location.href = 'index.html';
  }
}

/* ── Check auth ── */
function checkAuth() {
  if (!getToken()) {
    window.location.href = 'index.html';
    return false;
  }
  return true;
}

/* ── Check role ── */
function checkRole(requiredRoles) {
  const user = getCurrentUser();
  if (!user) { window.location.href = 'index.html'; return false; }
  if (!requiredRoles.includes(user.role)) {
    redirectByRole(user);
    return false;
  }
  return true;
}

/* ── Login ── */
async function login(username, password) {
  const resp = await api.login({ username, password });
  
  // O backend pode retornar o token diretamente ou aninhado
  const token = resp.token || resp.accessToken;
  if (!token) throw new Error('Token não recebido do servidor.');
  
  sessionStorage.setItem(TOKEN_KEY, token);

  // Capturar o utilizador garantindo que o ID existe (fundamental para o mecânico).
  const userData = resp.user || resp;
  const userToStore = {
    id:       userData.id || userData.userId, 
    username: userData.username,
    name:     userData.name || userData.username,
    role:     userData.role,
  };

  if (!userToStore.id) {
    console.error("Aviso: O servidor não enviou o ID do utilizador!", resp);
  }

  sessionStorage.setItem(USER_KEY, JSON.stringify(userToStore));
  return userToStore;
}

/* ── Logout ── */
function logout() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
  window.location.href = 'index.html';
}

/* ── Protected Page Init ── */
function initProtectedPage(requiredRoles) {
  if (!checkAuth()) return false;
  if (requiredRoles && !checkRole(requiredRoles)) return false;
  
  // Validações de segurança adicionais para garantir que o utils.js já está carregado
  if (typeof populateSidebarUser === 'function') populateSidebarUser();
  if (typeof setActiveSidebarLink === 'function') setActiveSidebarLink();
  if (typeof initMobileSidebar === 'function') initMobileSidebar();
  if (typeof initThemeToggle === 'function') initThemeToggle();
  
  return true;
}