/* ========================================================
   SGO - utils.js  |  Shared Utility Functions — Premium
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

  // Auto-remove with fade
  setTimeout(() => {
    toast.style.transition = 'opacity .3s ease, transform .3s ease';
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => { if (toast.parentNode) toast.remove(); }, 300);
  }, 4000);
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
    // Close on Escape
    function onEsc(e) {
      if (e.key === 'Escape') {
        el.classList.remove('active');
        document.removeEventListener('keydown', onEsc);
      }
    }
    document.addEventListener('keydown', onEsc);
  }
}

function hideModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('active');
}

function closeAllModals() {
  document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
}

/* ── Premium Confirm Dialog (replaces window.confirm) ── */
function confirmDialog(message, title = 'Confirmar', icon = '⚠️') {
  return new Promise(resolve => {
    // Create modal if it doesn't exist
    let overlay = document.getElementById('modal-confirm');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'modal-confirm';
      overlay.className = 'modal-overlay';
      overlay.innerHTML = `
        <div class="modal modal-sm">
          <div class="modal-header" id="confirm-header">
            <h3 class="modal-title" id="confirm-title">Confirmar</h3>
            <button class="modal-close" id="confirm-close">✕</button>
          </div>
          <div class="modal-body" style="text-align:center; padding:2rem 1.5rem;">
            <div class="confirm-icon" id="confirm-icon"></div>
            <p class="confirm-msg" id="confirm-msg"></p>
          </div>
          <div class="modal-footer" style="justify-content:center; gap:1rem;">
            <button class="btn btn-secondary" id="confirm-no" style="min-width:100px">Cancelar</button>
            <button class="btn btn-danger" id="confirm-yes" style="min-width:100px">Confirmar</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
    }

    // Fill content
    document.getElementById('confirm-title').textContent = title;
    document.getElementById('confirm-icon').textContent = icon;
    document.getElementById('confirm-msg').textContent = message;

    overlay.classList.add('active');

    function cleanup(result) {
      overlay.classList.remove('active');
      document.getElementById('confirm-yes').onclick = null;
      document.getElementById('confirm-no').onclick = null;
      document.getElementById('confirm-close').onclick = null;
      resolve(result);
    }

    document.getElementById('confirm-yes').onclick = () => cleanup(true);
    document.getElementById('confirm-no').onclick  = () => cleanup(false);
    document.getElementById('confirm-close').onclick = () => cleanup(false);
  });
}

/* ── Skeleton Table Rows ── */
function renderSkeletonRows(tbodyId, cols = 5, rows = 5) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;
  const widths = ['30%','20%','25%','15%','10%'];
  tbody.innerHTML = Array(rows).fill(0).map(() => `
    <tr>
      ${Array(cols).fill(0).map((_,i) => `
        <td><div class="skeleton skeleton-cell" style="width:${widths[i]||'60%'}"></div></td>
      `).join('')}
    </tr>
  `).join('');
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

/* ── Status Badges — Corrigido ── */
function getStatusBadge(status) {
  const map = {
    // Reparações — estados usados pelo backend
    'PENDENTE':      '<span class="badge badge-warning">⏳ Pendente</span>',
    'EM_PROGRESSO':  '<span class="badge badge-primary">🔧 Em Progresso</span>',
    'EM_EXECUCAO':   '<span class="badge badge-primary">🔧 Em Execução</span>',  // compatibilidade
    'AGUARDA_PECAS': '<span class="badge badge-info">📦 Aguarda Peças</span>',
    'CONCLUIDA':     '<span class="badge badge-success">✅ Concluída</span>',
    'CANCELADA':     '<span class="badge badge-danger">❌ Cancelada</span>',
    // Agendamentos
    'AGENDADO':      '<span class="badge badge-primary">📅 Agendado</span>',
    'CONFIRMADO':    '<span class="badge badge-success">✔️ Confirmado</span>',
    'CANCELADO':     '<span class="badge badge-danger">❌ Cancelado</span>',
    'CONCLUIDO':     '<span class="badge badge-dark">✅ Concluído</span>',
    // Operações — backend usa os mesmos da reparação
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

/* ── Real-time Clock ── */
function startClock() {
  const clockEl = document.getElementById('header-clock');
  if (!clockEl) return;
  function tick() {
    const now = new Date();
    const time = now.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const date = now.toLocaleDateString('pt-PT', { weekday: 'short', day: '2-digit', month: 'short' });
    clockEl.innerHTML = `<span style="color:var(--text-secondary);font-size:.7rem;text-transform:capitalize;">${date}</span> <strong>${time}</strong>`;
  }
  tick();
  setInterval(tick, 1000);
}

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

/* ── Notification Bell System ── */
async function initNotifications() {
  const bellBtn  = document.getElementById('notif-bell');
  const badge    = document.getElementById('notif-badge');
  if (!bellBtn) return;

  let alertas = [];
  try {
    alertas = await api.getAlertasStock() || [];
  } catch (_) { alertas = []; }

  const count = alertas.length;
  if (badge) {
    if (count > 0) {
      badge.textContent = count > 9 ? '9+' : count;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  }

  bellBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    let dropdown = document.getElementById('notif-dropdown');
    if (dropdown) { dropdown.remove(); return; }

    dropdown = document.createElement('div');
    dropdown.id = 'notif-dropdown';
    dropdown.className = 'notif-dropdown';
    dropdown.innerHTML = `
      <div class="notif-dropdown-header">
        <span>🔔 Notificações</span>
        <span class="badge badge-${count > 0 ? 'danger' : 'secondary'}">${count} alertas</span>
      </div>
      ${count === 0
        ? '<div class="notif-empty">✅ Sem alertas de stock no momento</div>'
        : alertas.slice(0, 8).map(p => `
            <div class="notif-item danger">
              <span class="notif-item-icon">⚠️</span>
              <div class="notif-item-text">
                <strong>${escapeHtml(p.designacao)}</strong><br>
                <span style="color:var(--text-secondary);font-size:.75rem">Stock: ${p.quantidadeStock ?? p.stockAtual} un (mín: ${p.stockMinimo})</span>
              </div>
            </div>
          `).join('')
      }
      ${count > 0 ? `<div style="padding:.75rem 1rem;text-align:center;border-top:1px solid var(--border)"><a href="pecas.html" style="font-size:.8rem;font-weight:600;color:var(--primary)">Ver todos no Armazém →</a></div>` : ''}
    `;

    // Position relative to bell button
    const rect = bellBtn.getBoundingClientRect();
    dropdown.style.position = 'fixed';
    dropdown.style.top = (rect.bottom + 8) + 'px';
    dropdown.style.right = (window.innerWidth - rect.right) + 'px';
    document.body.appendChild(dropdown);

    // Close on outside click
    setTimeout(() => {
      document.addEventListener('click', function onClickOutside() {
        if (dropdown && dropdown.parentNode) dropdown.remove();
        document.removeEventListener('click', onClickOutside);
      });
    }, 10);
  });
}

/* ── Role UI Control ── */
function applyRoleUI() {
  const userStr = sessionStorage.getItem('sgo_user');
  if (!userStr) return;
  const user = JSON.parse(userStr);
  const role = user.role || user.perfil;

  if (role === 'RECEPTION') {
    const hideLinks = ['dashboard.html', 'mecanico.html', 'logs.html', 'faturas.html'];
    hideLinks.forEach(link => {
      const el = document.querySelector(`a[href="${link}"]`);
      if (el && el.parentElement) el.parentElement.style.display = 'none';
    });
  } else if (role === 'MECHANIC') {
    const hideLinks = ['dashboard.html', 'clientes.html', 'viaturas.html', 'agenda.html', 'logs.html', 'faturas.html'];
    hideLinks.forEach(link => {
      const el = document.querySelector(`a[href="${link}"]`);
      if (el && el.parentElement) el.parentElement.style.display = 'none';
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  applyRoleUI();
});

/* ── Date & Number Formatters ── */
function formatCurrency(value) {
  const num = parseFloat(value) || 0;
  return num.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' });
}

function formatDate(isoStr) {
  if (!isoStr) return '—';
  const d = new Date(isoStr);
  if (isNaN(d)) return isoStr;
  return d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatDateTime(isoStr) {
  if (!isoStr) return '—';
  const d = new Date(isoStr);
  if (isNaN(d)) return isoStr;
  return d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
}

function formatTime(isoStr) {
  if (!isoStr) return '—';
  const d = new Date(isoStr);
  if (isNaN(d)) return isoStr;
  return d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
}

function isSameDay(d1, d2) {
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();
}