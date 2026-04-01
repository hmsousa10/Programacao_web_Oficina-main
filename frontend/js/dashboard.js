/* ========================================================
   SGO - dashboard.js  |  Manager Dashboard + Gráficos (Corrigido)
   ======================================================== */

'use strict';

let kpiRefreshTimer = null;
let chartEstadosInst = null;
let chartValoresInst = null;

document.addEventListener('DOMContentLoaded', () => {
  if (!initProtectedPage(['MANAGER'])) return;
  
  // Mudar cor do gráfico consoante o tema claro/escuro
  Chart.defaults.color = document.body.classList.contains('dark-theme') ? '#cbd5e1' : '#475569';
  
  refreshDashboard();
  loadUsers();
  
  kpiRefreshTimer = setInterval(refreshDashboard, 60000);
});

async function refreshDashboard() {
  // O Promise.allSettled executa tudo ao mesmo tempo.
  await Promise.allSettled([loadKpis(), loadAlertasStock(), loadChartsData()]);
  const now = new Date();
  const el = document.getElementById('last-updated');
  if (el) el.textContent = `Atualizado às ${now.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}`;
}

/* ── CARREGAR DADOS REAIS PARA OS GRÁFICOS ── */
async function loadChartsData() {
  try {
    const reparacoes = await api.getReparacoes();
    
    let contagem = { 'PENDENTE': 0, 'EM_EXECUCAO': 0, 'AGUARDA_PECAS': 0, 'CONCLUIDA': 0 };
    let valores = { 'PENDENTE': 0, 'EM_EXECUCAO': 0, 'AGUARDA_PECAS': 0 };

    if (reparacoes && reparacoes.length > 0) {
      reparacoes.forEach(r => {
        if (contagem[r.estado] !== undefined) contagem[r.estado]++;
        
        if (r.estado !== 'CONCLUIDA' && r.estado !== 'CANCELADA' && r.valorTotal) {
          valores[r.estado] += r.valorTotal;
        }
      });
    }

    renderChartEstados(contagem);
    renderChartValores(valores);

  } catch (error) {
    console.error("Erro ao carregar dados para os gráficos:", error);
  }
}

/* ── DESENHAR O GRÁFICO CIRCULAR ── */
function renderChartEstados(contagem) {
  const canvas = document.getElementById('chartEstados');
  if (!canvas) return; // Segurança extra
  
  const ctx = canvas.getContext('2d');
  
  // 🧹 A Correção Absoluta: Destruir a instância anterior do Chart.js
  if (chartEstadosInst) {
      chartEstadosInst.destroy();
  }

  chartEstadosInst = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Pendentes', 'Em Execução', 'Aguarda Peças', 'Concluídas'],
      datasets: [{
        data: [contagem.PENDENTE, contagem.EM_EXECUCAO, contagem.AGUARDA_PECAS, contagem.CONCLUIDA],
        backgroundColor: [
          '#3b82f6', // Azul (Pendente)
          '#eab308', // Amarelo (Em Execução)
          '#f97316', // Laranja (Aguarda Peças)
          '#10b981'  // Verde (Concluída)
        ],
        borderWidth: 0,
        hoverOffset: 10
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' }
      }
    }
  });
}

/* ── DESENHAR O GRÁFICO DE BARRAS ── */
function renderChartValores(valores) {
  const canvas = document.getElementById('chartValores');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  
  // 🧹 Destruir gráfico de barras anterior
  if (chartValoresInst) {
      chartValoresInst.destroy();
  }

  chartValoresInst = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Pendentes', 'Em Execução', 'Aguarda Peças'],
      datasets: [{
        label: 'Valor em Euros (€)',
        data: [valores.PENDENTE, valores.EM_EXECUCAO, valores.AGUARDA_PECAS],
        backgroundColor: [
          'rgba(59, 130, 246, 0.7)',
          'rgba(234, 179, 8, 0.7)',
          'rgba(249, 115, 22, 0.7)'
        ],
        borderColor: [
          '#3b82f6', '#eab308', '#f97316'
        ],
        borderWidth: 1,
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true }
      },
      plugins: {
        legend: { display: false }
      }
    }
  });
}

/* ── KPIs ── */
async function loadKpis() {
  try {
    const data = await api.getKpis();
    renderKpis(data);
  } catch (err) {
    document.getElementById('kpi-grid').innerHTML = `<div class="kpi-card" style="grid-column:1/-1"><div class="alert alert-danger">❌ Erro a carregar KPIs</div></div>`;
  }
}

function renderKpis(data) {
  const grid = document.getElementById('kpi-grid');
  if (!grid) return;
  const kpis = [
    { label: 'Faturação Hoje', value: formatCurrency(data.faturacaoHoje ?? 0), icon: '💶', meta: 'faturado hoje' },
    { label: 'Faturação Mês', value: formatCurrency(data.faturacaoMes ?? 0), icon: '🗓️', meta: 'este mês' },
    { label: 'Reparações em Curso', value: data.reparacoesEmCurso ?? 0, icon: '🔧', meta: 'atualmente na oficina' },
    { label: 'Concluídas Hoje', value: data.reparacoesConcluidas ?? 0, icon: '✅', meta: 'terminadas hoje' }
  ];
  grid.innerHTML = kpis.map(k => `
    <div class="kpi-card">
      <div class="kpi-card-inner"><div><div class="kpi-label">${k.label}</div><div class="kpi-value">${k.value}</div></div><div class="kpi-icon">${k.icon}</div></div>
      <div class="kpi-meta">${k.meta}</div>
    </div>
  `).join('');
  renderOcupacao(data.ocupacaoAtual ?? 0, data.capacidadeMaxima ?? 8);
}

function renderOcupacao(atual, max) {
  const textEl = document.getElementById('ocupacao-text'), barEl = document.getElementById('ocupacao-bar'), badgeEl = document.getElementById('ocupacao-badge');
  if (!textEl) return;
  const pct = max > 0 ? Math.round((atual / max) * 100) : 0;
  textEl.textContent = `${atual}/${max}`;
  if (barEl) { barEl.style.width = `${pct}%`; barEl.className = 'progress-bar ' + (pct < 50 ? 'green' : pct <= 75 ? 'yellow' : 'red'); }
  if (badgeEl) {
    badgeEl.className = 'badge ' + (pct < 50 ? 'badge-success' : pct <= 75 ? 'badge-warning' : 'badge-danger');
    badgeEl.textContent = `${pct}% – ` + (pct < 50 ? 'Disponível' : pct <= 75 ? 'Moderado' : 'Cheio');
  }
}

/* ── Alertas de Stock ── */
async function loadAlertasStock() {
  const tbody = document.getElementById('alertas-tbody');
  const card = document.getElementById('card-alertas-stock');
  if (!tbody || !card) return;
  try {
    const data = await api.getAlertasStock();
    if (!data || data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted" style="padding:1.5rem">✅ Sem alertas de stock</td></tr>`;
      card.style.boxShadow = "none";
      card.style.border = "1px solid var(--border)";
      return;
    }
    
    card.style.border = "2px solid #ef4444";
    card.style.boxShadow = "0 0 15px rgba(239, 68, 68, 0.2)";

    tbody.innerHTML = data.map(p => `
      <tr>
        <td><code>${escapeHtml(p.referencia)}</code></td>
        <td><strong>${escapeHtml(p.designacao)}</strong></td>
        <td class="stock-low" style="font-size: 1.1rem;">${p.quantidadeStock || p.stockAtual}</td>
        <td>${p.stockMinimo}</td>
      </tr>
    `).join('');
  } catch (err) { 
      tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted">Erro ao carregar alertas</td></tr>`; 
  }
}

/* ── Lógica de Utilizadores ── */
let allUsers = [];

async function loadUsers() {
  try { 
      allUsers = await api.getUsers() || []; 
      renderUsersTable(allUsers); 
  } 
  catch (err) { 
      const tbody = document.getElementById('users-tbody');
      if (tbody) tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted">Erro</td></tr>`; 
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
      <td><span class="badge badge-secondary">${escapeHtml(u.role || '')}</span></td>
      <td>
        <button class="btn btn-secondary btn-sm" onclick="openEditUser(${u.id})">✏️</button> 
        <button class="btn btn-outline-danger btn-sm" onclick="deleteUser(${u.id}, '${escapeHtml(u.username)}')">🗑️</button>
      </td>
    </tr>`).join('');
}

function openCreateUser() { 
    document.getElementById('modal-user-title').textContent = 'Novo Utilizador'; 
    document.getElementById('form-user').reset(); 
    document.getElementById('user-id').value = ''; 
    const hint = document.getElementById('pw-hint');
    if (hint) hint.textContent = '(obrigatória)'; 
    const pwInput = document.getElementById('user-password');
    if (pwInput) pwInput.required = true; 
    showModal('modal-user'); 
}

function openEditUser(id) { 
    const user = allUsers.find(u => u.id === id); 
    if (!user) return; 
    document.getElementById('modal-user-title').textContent = 'Editar Utilizador'; 
    document.getElementById('user-id').value = user.id; 
    document.getElementById('user-name').value = user.name || ''; 
    document.getElementById('user-username').value = user.username || ''; 
    document.getElementById('user-role').value = user.role || ''; 
    const pwInput = document.getElementById('user-password');
    if (pwInput) {
        pwInput.value = ''; 
        pwInput.required = false; 
    }
    const hint = document.getElementById('pw-hint');
    if (hint) hint.textContent = '(opcional)'; 
    showModal('modal-user'); 
}

async function submitUser(e) { 
    e.preventDefault(); 
    const payload = { 
        name: document.getElementById('user-name').value.trim(), 
        username: document.getElementById('user-username').value.trim(), 
        role: document.getElementById('user-role').value 
    }; 
    const id = document.getElementById('user-id').value;
    const passwordInput = document.getElementById('user-password');
    const password = passwordInput ? passwordInput.value : ''; 
    
    if (password) payload.password = password; 
    
    try { 
        if (id) { 
            await api.updateUser(id, payload); 
            showToast('Utilizador atualizado!', 'success'); 
        } else { 
            if (!password) {
                showToast('Palavra-passe obrigatória', 'error'); 
                return;
            }
            await api.createUser(payload); 
            showToast('Utilizador criado!', 'success'); 
        } 
        hideModal('modal-user'); 
        await loadUsers(); 
    } catch (err) { 
        showToast('Erro: ' + err.message, 'error'); 
    } 
}

async function deleteUser(id, username) { 
    // Segurança: Prevenir que o admin se apague a si próprio e fique trancado fora da plataforma
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.id === id) {
        showToast('Não pode eliminar a sua própria conta!', 'error');
        return;
    }

    const ok = await confirmDialog(`Eliminar o utilizador "${username}"?`); 
    if (!ok) return; 
    
    try { 
        await api.deleteUser(id); 
        showToast('Utilizador eliminado.', 'success'); 
        
        // 🧹 Forçar a atualização da tabela no ecrã!
        await loadUsers(); 
        
    } catch (err) { 
        showToast('Erro: ' + err.message, 'error'); 
    } 
}