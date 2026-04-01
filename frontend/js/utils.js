/* ========================================================
   SGO - utils.js  |  Shared Utility Functions
   ======================================================== */

'use strict';

/* ── Toast Notification ── */
(function ensureToastContainer() {
  if (!document.getElementById('toast-container')) {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
})();

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container') ||
    (() => {
      const c = document.createElement('div');
      c.id = 'toast-container';
      c.className = 'toast-container';
      document.body.appendChild(c);
      return c;
    })();

  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <span class="toast-msg">${message}</span>
    <button class="toast-close" onclick="this.closest('.toast').remove()">✕</button>
  `;
  container.appendChild(toast);
  setTimeout(() => { if (toast.parentNode) toast.remove(); }, 4000);
}

/* ── Modal Helpers ── */
function showModal(id) {
  const el = document.getElementById(id);
  if (el) {
    el.classList.add('active');
    // Close on backdrop click
    el.addEventListener('click', function onBdClick(e) {
      if (e.target === el) {
        el.classList.remove('active');
        el.removeEventListener('click', onBdClick);
      }
    });
  }
}

function hideModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('active');
}

function closeAllModals() {
  document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
}

/* ── Date/Time Formatting ── */
function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString('pt-PT', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function formatTime(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
}

function toInputDate(date) {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d)) return '';
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function toInputDateTime(date) {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d)) return '';
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/* ── Currency ── */
function formatCurrency(value) {
  const n = parseFloat(value);
  if (isNaN(n)) return '€0,00';
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(n);
}

/* ── Duration ── */
function formatDuration(minutes) {
  if (!minutes && minutes !== 0) return '—';
  const h = Math.floor(Math.abs(minutes) / 60);
  const m = Math.abs(minutes) % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m > 0 ? m + 'm' : ''}`.trim();
}

/* ── Stopwatch seconds → HH:MM:SS ── */
function formatStopwatch(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
}

/* ── Debounce ── */
function debounce(fn, delay = 300) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/* ── Status Badges ── */
function getStatusBadge(status) {
  const map = {
    // Reparações
    'PENDENTE':      '<span class="badge badge-warning">⏳ Pendente</span>',
    'EM_PROGRESSO':  '<span class="badge badge-primary">🔧 Em Progresso</span>',
    'AGUARDA_PECAS': '<span class="badge badge-info">📦 Aguarda Peças</span>',
    'CONCLUIDA':     '<span class="badge badge-success">✅ Concluída</span>',
    'CANCELADA':     '<span class="badge badge-danger">❌ Cancelada</span>',
    // Agendamentos
    'AGENDADO':      '<span class="badge badge-primary">📅 Agendado</span>',
    'CONFIRMADO':    '<span class="badge badge-success">✔️ Confirmado</span>',
    'CANCELADO':     '<span class="badge badge-danger">❌ Cancelado</span>',
    'CONCLUIDO':     '<span class="badge badge-dark">✅ Concluído</span>',
    // Operações
    'NAO_INICIADA':  '<span class="badge badge-secondary">○ Não Iniciada</span>',
    'EM_CURSO':      '<span class="badge badge-primary">🔧 Em Curso</span>',
    'CONCLUIDA_OP':  '<span class="badge badge-success">✅ Concluída</span>',
  };
  return map[status] || `<span class="badge badge-secondary">${status}</span>`;
}

/* ── Combustível label ── */
function getCombustivelLabel(c) {
  const map = {
    GASOLINA: 'Gasolina', GASÓLEO: 'Gasóleo', GASOL: 'Gasóleo',
    HIBRIDO: 'Híbrido', ELETRICO: 'Elétrico', GAS: 'Gás'
  };
  return map[(c || '').toUpperCase()] || c || '—';
}

/* ── Role label ── */
function getRoleLabel(role) {
  const map = { MANAGER: 'Gestor', RECEPTION: 'Receção', MECHANIC: 'Mecânico' };
  return map[role] || role || '—';
}

/* ── Initials from name ── */
function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

/* ── Theme Toggle (Light/Dark) ── */
function initThemeToggle() {
  const saved = localStorage.getItem('sgo_theme');
  if (saved === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
  document.querySelectorAll('.theme-checkbox').forEach(cb => {
    cb.checked = saved === 'dark';
    cb.addEventListener('change', function () {
      const theme = this.checked ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('sgo_theme', theme);
      document.querySelectorAll('.theme-checkbox').forEach(other => {
        other.checked = this.checked;
      });
    });
  });
}

function applyStoredTheme() {
  const saved = localStorage.getItem('sgo_theme');
  if (saved === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
}

// Apply theme immediately on load (before DOMContentLoaded)
applyStoredTheme();

/* ── Sidebar active link ── */
function setActiveSidebarLink() {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.sidebar-nav a').forEach(link => {
    const href = link.getAttribute('href');
    if (href && href === page) link.classList.add('active');
    else link.classList.remove('active');
  });
}

/* ── Populate sidebar user ── */
function populateSidebarUser() {
  const user = getCurrentUser ? getCurrentUser() : null;
  if (!user) return;
  const nameEl   = document.getElementById('sidebar-name');
  const roleEl   = document.getElementById('sidebar-role');
  const avatarEl = document.getElementById('sidebar-avatar');
  if (nameEl)   nameEl.textContent   = user.name || user.username;
  if (roleEl)   roleEl.textContent   = getRoleLabel(user.role);
  if (avatarEl) avatarEl.textContent = getInitials(user.name || user.username);
}

/* ── Mobile sidebar toggle ── */
function initMobileSidebar() {
  const btn     = document.getElementById('mobile-menu-btn');
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (!btn || !sidebar) return;
  btn.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    if (overlay) overlay.classList.toggle('active');
  });
  if (overlay) {
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('active');
    });
  }
}

/* ── Confirm dialog (promise) ── */
function confirmDialog(message) {
  return new Promise(resolve => {
    resolve(window.confirm(message));
  });
}

/* ── Escape HTML ── */
function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ── Week helpers ── */
function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth()    === b.getMonth()    &&
         a.getDate()     === b.getDate();
}

/* --- CONTROLO DE ACESSOS DA INTERFACE --- */
function applyRoleUI() {
  const userStr = sessionStorage.getItem('sgo_user');
  if (!userStr) return;
  const user = JSON.parse(userStr);
  const role = user.role || user.perfil;

  // 1. Ocultar menus laterais dependendo do perfil
  if (role === 'RECEPTION') {
      const hideLinks = ['dashboard.html', 'mecanico.html', 'logs.html'];
      hideLinks.forEach(link => {
          const el = document.querySelector(`a[href="${link}"]`);
          if (el && el.parentElement) el.parentElement.style.display = 'none';
      });
  } 
  else if (role === 'MECHANIC') {
      const hideLinks = ['dashboard.html', 'clientes.html', 'viaturas.html', 'agenda.html', 'logs.html'];
      hideLinks.forEach(link => {
          const el = document.querySelector(`a[href="${link}"]`);
          if (el && el.parentElement) el.parentElement.style.display = 'none';
      });
  }
}

// Chamar a função sempre que a página carrega
document.addEventListener('DOMContentLoaded', () => {
    applyRoleUI();
});