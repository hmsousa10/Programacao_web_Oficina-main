/* ========================================================
   SGO - dashboard.js  |  Manager Dashboard
   ======================================================== */

'use strict';

let kpiRefreshTimer = null;

document.addEventListener('DOMContentLoaded', () => {
  if (!initProtectedPage(['MANAGER'])) return;
  refreshDashboard();
  loadUsers();
  // Auto-refresh every 60 seconds
  kpiRefreshTimer = setInterval(refreshDashboard, 60000);
});

/* ── Refresh all dashboard data ── */
async function refreshDashboard() {
  await Promise.allSettled([loadKpis(), loadAlertasStock()]);
  const now = new Date();
  const el = document.getElementById('last-updated');
  if (el) el.textContent = `Atualizado às ${now.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}`;
}

/* ── KPIs ── */
async function loadKpis() {
  try {
    const data = await api.getKpis();
    renderKpis(data);
  } catch (err) {
    console.error('Erro ao carregar KPIs:', err);
    renderKpisError();
  }
}

function renderKpis(data) {
  const grid = document.getElementById('kpi-grid');
  if (!grid) return;

  const kpis = [
    {
      label: 'Faturação Hoje',
      value: formatCurrency(data.faturacaoHoje ?? 0),
      icon: '💶',
      meta: 'faturado hoje',
    },
    {
      label: 'Faturação Semana',
      value: formatCurrency(data.faturacaoSemana ?? 0),
      icon: '📈',
      meta: 'esta semana',
    },
    {
      label: 'Faturação Mês',
      value: formatCurrency(data.faturacaoMes ?? 0),
      icon: '🗓️',
      meta: 'este mês',
    },
    {
      label: 'Reparações em Curso',
      value: data.reparacoesEmCurso ?? 0,
      icon: '🔧',
      meta: 'atualmente na oficina',
    },
    {
      label: 'Concluídas Hoje',
      value: data.reparacoesConcluidas ?? 0,
      icon: '✅',
      meta: 'terminadas hoje',
    },
    {
      label: 'Marcações (7 dias)',
      value: data.marcacoesFuturas ?? 0,
      icon: '📅',
      meta: 'próximos 7 dias',
    },
  ];

  grid.innerHTML = kpis.map(k => `
    <div class="kpi-card">
      <div class="kpi-card-inner">
        <div>
          <div class="kpi-label">${k.label}</div>
          <div class="kpi-value">${k.value}</div>
        </div>
        <div class="kpi-icon">${k.icon}</div>
      </div>
      <div class="kpi-meta">${k.meta}</div>
    </div>
  `).join('');

  renderOcupacao(data.ocupacaoAtual ?? 0, data.capacidadeMaxima ?? 8);
}

function renderKpisError() {
  const grid = document.getElementById('kpi-grid');
  if (!grid) return;
  grid.innerHTML = `
    <div class="kpi-card" style="grid-column:1/-1">
      <div class="alert alert-danger">
        <span class="alert-icon">❌</span>
        Não foi possível carregar os KPIs. Verifique a ligação ao servidor.
      </div>
    </div>`;
}

/* ── Ocupação ── */
function renderOcupacao(atual, max) {
  const textEl  = document.getElementById('ocupacao-text');
  const descEl  = document.getElementById('ocupacao-desc');
  const barEl   = document.getElementById('ocupacao-bar');
  const badgeEl = document.getElementById('ocupacao-badge');

  if (!textEl) return;

  const pct = max > 0 ? Math.round((atual / max) * 100) : 0;

  textEl.textContent  = `${atual}/${max}`;
  if (descEl) descEl.textContent = 'viaturas em serviço';
  if (barEl) {
    barEl.style.width = `${pct}%`;
    barEl.className   = 'progress-bar ' + (pct < 50 ? 'green' : pct <= 75 ? 'yellow' : 'red');
  }
  if (badgeEl) {
    if (pct < 50) {
      badgeEl.className   = 'badge badge-success';
      badgeEl.textContent = `${pct}% – Disponível`;
    } else if (pct <= 75) {
      badgeEl.className   = 'badge badge-warning';
      badgeEl.textContent = `${pct}% – Moderado`;
    } else {
      badgeEl.className   = 'badge badge-danger';
      badgeEl.textContent = `${pct}% – Cheio`;
    }
  }
}

/* ── Alertas de Stock ── */
async function loadAlertasStock() {
  const tbody = document.getElementById('alertas-tbody');
  if (!tbody) return;
  try {
    const data = await api.getAlertasStock();
    if (!data || data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted" style="padding:1.5rem">✅ Sem alertas de stock</td></tr>`;
      return;
    }
    tbody.innerHTML = data.map(p => `
      <tr>
        <td><code>${escapeHtml(p.referencia)}</code></td>
        <td>${escapeHtml(p.designacao)}</td>
        <td class="stock-low">${p.stockAtual}</td>
        <td>${p.stockMinimo}</td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted">Erro ao carregar alertas</td></tr>`;
  }
}

/* ── Utilizadores ── */
let allUsers = [];

async function loadUsers() {
  const tbody = document.getElementById('users-tbody');
  if (!tbody) return;
  try {
    allUsers = await api.getUsers() || [];
    renderUsersTable(allUsers);
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted">Erro ao carregar utilizadores</td></tr>`;
  }
}

function renderUsersTable(users) {
  const tbody = document.getElementById('users-tbody');
  if (!tbody) return;
  if (!users.length) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted" style="padding:1.5rem">Nenhum utilizador encontrado</td></tr>`;
    return;
  }
  tbody.innerHTML = users.map(u => `
    <tr>
      <td><strong>${escapeHtml(u.name || u.username)}</strong></td>
      <td>${escapeHtml(u.username)}</td>
      <td>${getStatusBadge(u.role) || `<span class="badge badge-secondary">${getRoleLabel(u.role)}</span>`}</td>
      <td>
        <div class="table-actions">
          <button class="btn btn-secondary btn-sm" onclick="openEditUser(${u.id})">✏️</button>
          <button class="btn btn-outline-danger btn-sm" onclick="deleteUser(${u.id}, '${escapeHtml(u.username)}')">🗑️</button>
        </div>
      </td>
    </tr>
  `).join('');
}

/* ── User Modal ── */
function openCreateUser() {
  document.getElementById('modal-user-title').textContent = 'Novo Utilizador';
  document.getElementById('form-user').reset();
  document.getElementById('user-id').value = '';
  document.getElementById('pw-hint').textContent = '(obrigatória)';
  document.getElementById('user-password').required = true;
  showModal('modal-user');
}

function openEditUser(id) {
  const user = allUsers.find(u => u.id === id);
  if (!user) return;
  document.getElementById('modal-user-title').textContent = 'Editar Utilizador';
  document.getElementById('user-id').value       = user.id;
  document.getElementById('user-name').value     = user.name || '';
  document.getElementById('user-username').value = user.username || '';
  document.getElementById('user-role').value     = user.role || '';
  document.getElementById('user-password').value = '';
  document.getElementById('user-password').required = false;
  document.getElementById('pw-hint').textContent = '(deixe em branco para manter)';
  showModal('modal-user');
}

async function submitUser(e) {
  e.preventDefault();
  const id       = document.getElementById('user-id').value;
  const name     = document.getElementById('user-name').value.trim();
  const username = document.getElementById('user-username').value.trim();
  const password = document.getElementById('user-password').value;
  const role     = document.getElementById('user-role').value;

  const payload = { name, username, role };
  if (password) payload.password = password;

  try {
    if (id) {
      await api.updateUser(id, payload);
      showToast('Utilizador atualizado com sucesso!', 'success');
    } else {
      if (!password) { showToast('Palavra-passe obrigatória para novo utilizador.', 'error'); return; }
      await api.createUser(payload);
      showToast('Utilizador criado com sucesso!', 'success');
    }
    hideModal('modal-user');
    await loadUsers();
  } catch (err) {
    showToast('Erro: ' + err.message, 'error');
  }
}

async function deleteUser(id, username) {
  const ok = await confirmDialog(`Eliminar utilizador "${username}"? Esta ação não pode ser desfeita.`);
  if (!ok) return;
  try {
    await api.deleteUser(id);
    showToast('Utilizador eliminado.', 'success');
    await loadUsers();
  } catch (err) {
    showToast('Erro: ' + err.message, 'error');
  }
}
