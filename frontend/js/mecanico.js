/* ========================================================
   SGO - mecanico.js  |  Mechanic Work Panel (Page 1 -> Page 2)
   ======================================================== */

'use strict';

const CHECKLIST_ITEMS = [
  'Verificação de óleo',
  'Verificação de travões',
  'Verificação de suspensão',
  'Verificação de pneus',
  'Diagnóstico eletrónico',
  'Verificação de luzes',
  'Verificação de fluidos',
  'Verificação de bateria',
];

let allRepairs      = [];
let currentRepair   = null;
let allPecas        = [];
let timerInterval   = null;
let timerSeconds    = 0;
let timerRunning    = false;
let currentOpId     = null; 

document.addEventListener('DOMContentLoaded', async () => {
  if (!initProtectedPage(['MECHANIC', 'MANAGER', 'ADMIN'])) return;
  
  // Autenticação e Mensagem de Boas-Vindas
  const user = getCurrentUser();
  if (user) {
    const userNameEl = document.getElementById('top-user-name');
    if (userNameEl) {
      userNameEl.textContent = `Bem-vindo, ${user.name || user.nome || 'Mecânico'}`;
    }

    // Lógica da Visão de Gestão
    if (user.role === 'MANAGER' || user.role === 'ADMIN') {
        await setupAdminFilter();
        // Carrega as reparações globais inicialmente
        await loadMyRepairs();
    } else {
        // Se for Mecânico, carrega apenas as dele
        await loadMyRepairs(user.id);
    }
  }
});

/* ── 1. CONFIGURAR FILTRO DE ADMINISTRAÇÃO ── */
async function setupAdminFilter() {
    const filterContainer = document.getElementById('admin-filter-container');
    const selector = document.getElementById('mecanico-selector');
    
    if (filterContainer && selector) {
        filterContainer.style.display = 'flex'; // Torna a barra visível para Administradores
        try {
            const mecanicos = await api.getMecanicos();
            mecanicos.forEach(m => {
                const opt = document.createElement('option');
                opt.value = m.id;
                opt.textContent = m.name || m.username;
                selector.appendChild(opt);
            });
        } catch (err) {
            console.error("Erro ao carregar lista de mecânicos para o filtro", err);
        }
    }
}


/* ── 2. NAVEGAÇÃO ENTRE PÁGINAS E CORREÇÃO DO BUG VOLTAR ── */
function voltarGlobal() {
  const viewDetails = document.getElementById('view-details');
  
  // Se estiver nos detalhes da reparação, volta à tabela (Fila de Trabalho)
  if (viewDetails && !viewDetails.classList.contains('hidden')) {
    backToDashboard();
  } else {
    const user = getCurrentUser();
    if (user && user.role === 'MANAGER') {
      window.location.href = 'dashboard.html'; 
    } else {
      window.location.href = 'index.html?bypassAuth=true';
    }
  }
}

function backToDashboard() {
  document.getElementById('view-details').classList.add('hidden');
  document.getElementById('view-details').classList.remove('active');
  document.getElementById('view-dashboard').classList.remove('hidden');
  document.getElementById('view-dashboard').classList.add('active');
  
  if (timerRunning) {
    toggleTimer(); 
  }
  
  currentRepair = null;
  // Quando volta, atualiza a lista de acordo com o filtro atual selecionado
  const selector = document.getElementById('mecanico-selector');
  const filterId = selector ? selector.value : null;
  loadMyRepairs(filterId); 
}

/* ── 3. CARREGAR FILA DE TRABALHO (COM FILTRO DINÂMICO) ── */
async function loadMyRepairs(filterMecanicoId = null) {
  const user = getCurrentUser();
  if (!user) return;
  const tbody = document.getElementById('repair-list');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="6"><div class="loading-overlay"><div class="spinner"></div></div></td></tr>`;

  try {
    let data = [];
    
    if (filterMecanicoId) {
        // Se escolheu um mecânico específico no filtro (ou se é o próprio mecânico logado)
        data = await api.getReparacoesMecanico(filterMecanicoId) || [];
    } else if (user.role === 'MANAGER' || user.role === 'ADMIN') {
        // Administrador sem filtro selecionado: vê todas as reparações
        data = await api.getReparacoes() || [];
    } else {
        // Mecânico por defeito
        data = await api.getReparacoesMecanico(user.id) || [];
    }
    
    // Atualiza KPIs
    document.getElementById('kpi-pendentes').textContent = data.filter(r => r.estado === 'PENDENTE').length;
    document.getElementById('kpi-progresso').textContent = data.filter(r => r.estado === 'EM_EXECUCAO' || r.estado === 'EM_PROGRESSO').length;
    document.getElementById('kpi-pecas').textContent = data.filter(r => r.estado === 'AGUARDA_PECAS').length;
    document.getElementById('kpi-concluidos').textContent = data.filter(r => r.estado === 'CONCLUIDA').length;

    // Filtra para a tabela apenas as reparações não concluídas na totalidade
    allRepairs = data.filter(r => ['PENDENTE', 'EM_PROGRESSO', 'EM_EXECUCAO', 'AGUARDA_PECAS'].includes(r.estado));
    
    renderRepairList();
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">❌ Erro: ${escapeHtml(err.message)}</td></tr>`;
  }
}

function renderRepairList() {
  const tbody = document.getElementById('repair-list');
  if (!tbody) return;
  if (!allRepairs.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center" style="padding: 2rem;">🎉 Sem trabalho pendente na fila para a seleção atual.</td></tr>`;
    return;
  }
  
  tbody.innerHTML = allRepairs.map(r => {
    const matricula = r.viaturaMatricula || '#' + r.id;
    const veiculo = `${r.viaturaMarca || ''} ${r.viaturaModelo || ''}`.trim() || '—';
    const cliente = r.clienteNome || '—';
    const mecanico = r.mecanicoNome || '<span style="color:#e74c3c; font-size:0.85em;">Não Atribuído</span>';

    return `
      <tr>
        <td><strong>${escapeHtml(matricula)}</strong></td>
        <td>${escapeHtml(veiculo)}</td>
        <td>${escapeHtml(cliente)}</td>
        <td>${mecanico}</td>
        <td>${getStatusBadge(r.estado)}</td>
        <td>
          <button class="btn btn-primary btn-sm" onclick="selectReparacao(${r.id})">
            👀 Ver Detalhes
          </button>
        </td>
      </tr>`;
  }).join('');
}

/* ── PÁGINA 2: TRANSIÇÃO E DETALHES ── */
async function selectReparacao(id) {
  if (timerRunning) toggleTimer(); // Pausa a anterior se existir

  try {
    const repair = await api.getReparacao(id);
    currentRepair = repair;
    
    timerSeconds = parseInt(localStorage.getItem(getTimerKey())) || 0;
    
    document.getElementById('view-dashboard').classList.add('hidden');
    document.getElementById('view-dashboard').classList.remove('active');
    document.getElementById('view-details').classList.remove('hidden');
    document.getElementById('view-details').classList.add('active');

    renderDetailPanel();
    window.scrollTo(0,0);
  } catch (err) {
    showToast('Erro ao carregar detalhes: ' + err.message, 'error');
  }
}

function renderDetailPanel() {
  const wrapper = document.getElementById('details-content-wrapper');
  if (!wrapper || !currentRepair) return;
  const r = currentRepair;

  let badgeClass = r.estado === 'EM_EXECUCAO' ? "badge-execucao" : (r.estado === 'CONCLUIDA' ? "badge-concluida" : "badge-pendente");
  let badgeText = r.estado.replace('_', ' ');

  const s = r.estado;
  const isDiag = (s === 'EM_EXECUCAO' || s === 'AGUARDA_PECAS' || s === 'CONCLUIDA');
  const isExec = (s === 'EM_EXECUCAO' || s === 'AGUARDA_PECAS' || s === 'CONCLUIDA');
  const isPronto = (s === 'CONCLUIDA');

  wrapper.innerHTML = `
    <div class="intervention-top-bar">
      <div style="display: flex; align-items: center; gap: 1rem;">
        <span class="intervention-badge ${badgeClass}">${badgeText}</span>
        <span style="color: #94a3b8; font-size: 0.95rem;">Início: ${formatTimeOnly(r.dataInicio)}</span>
      </div>
      
      <div class="intervention-timer">
        ⏱ <span id="stopwatch-display">${formatStopwatch(timerSeconds)}</span>
        <div style="display: flex; gap: 0.5rem; margin-left: 1rem;">
          <button class="btn btn-sm ${timerRunning ? 'btn-warning' : 'btn-success'}" id="btn-toggle-timer" onclick="toggleTimer()">
            ${timerRunning ? '⏸ Pausar' : '▶ Retomar'}
          </button>
          <button class="btn btn-secondary btn-sm" onclick="saveTimeToOperation()" title="Gravar este tempo numa operação na BD">
            💾 Guardar na BD
          </button>
        </div>
      </div>
    </div>

    <div class="intervention-header">
      <div class="vehicle-main-info">
        <div class="plate-highlight">${escapeHtml(r.viaturaMatricula || '—')}</div>
        <div class="vehicle-text">
          <h2>${escapeHtml(r.viaturaMarca || '')} ${escapeHtml(r.viaturaModelo || '')}</h2>
          <p>${escapeHtml(r.descricao || 'Serviço Geral')}</p>
        </div>
      </div>
      <div class="client-info">
        <p>Cliente</p>
        <h3>👤 ${escapeHtml(r.clienteNome || '—')}</h3>
      </div>
    </div>

    <div class="stepper-wrapper">
      <div class="stepper-container">
        <div class="step completed">
          <div class="step-icon">✓</div>
          <span class="step-label">Receção</span>
        </div>
        <div class="step ${isDiag ? 'completed' : 'active'}">
          <div class="step-icon">${isDiag ? '✓' : '🔍'}</div>
          <span class="step-label">Diagnóstico</span>
        </div>
        <div class="step ${isPronto ? 'completed' : (isExec && !isPronto ? 'active' : '')}">
          <div class="step-icon">${isPronto ? '✓' : (isExec ? '⚙️' : '3')}</div>
          <span class="step-label">Execução</span>
        </div>
        <div class="step ${isPronto ? 'completed' : ''}">
          <div class="step-icon">${isPronto ? '✓' : '4'}</div>
          <span class="step-label">Pronto</span>
        </div>
      </div>
    </div>

    <div class="action-cards-grid">
      <button class="action-card card-blue" onclick="openTrabalhosModal()">
        <span class="action-card-icon">📋</span>
        <span class="action-card-title">Checklist & Diagnóstico</span>
      </button>
      <button class="action-card card-yellow" onclick="openGestaoPecasModal()">
        <span class="action-card-icon">📦</span>
        <span class="action-card-title">Requisitar Peças</span>
      </button>
      <button class="action-card card-green" onclick="concluirReparacao()">
        <span class="action-card-icon">✅</span>
        <span class="action-card-title">Concluir Trabalho</span>
      </button>
    </div>
  `;
}

function formatTimeOnly(dateString) {
  if (!dateString) return '--:--';
  const d = new Date(dateString);
  return d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
}


/* ========================================================
   LÓGICA DOS MODAIS E OPERAÇÕES DA PÁGINA 2
   ======================================================== */

function openTrabalhosModal() {
  if (!currentRepair) return;
  const opList = document.getElementById('op-list');
  if (opList) opList.innerHTML = renderOperacoes(currentRepair.operacoes || []);
  
  const chkList = document.getElementById('checklist');
  if (chkList) chkList.innerHTML = renderChecklist();
  
  showModal('modal-trabalhos');
}

function renderOperacoes(operacoes) {
  if (!operacoes.length) return `<p class="text-muted" style="text-align:center;">Sem operações registadas. Adicione a primeira.</p>`;
  
  return operacoes.map(op => `
    <div style="padding: 1rem; border: 1px solid var(--border); border-radius: var(--radius); margin-bottom: 0.5rem; background: var(--bg); ${currentOpId === op.id ? 'border-left: 4px solid var(--primary-color)' : ''}">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <strong style="font-size: 1.05rem;">${escapeHtml(op.descricao)}</strong>
          ${currentOpId === op.id ? '<span class="badge badge-primary" style="margin-left: 5px;">📍 Cronómetro Alocado Aqui</span>' : ''}
          <div style="margin-top: 0.3rem; font-size: 0.9rem;">
            ${op.tempoEstimadoMinutos ? '⏱ Est: ' + formatDuration(op.tempoEstimadoMinutos) : '⏱ Est: --'} | 
            ${op.tempoRealMinutos ? '<strong>Real: ' + formatDuration(op.tempoRealMinutos) + '</strong>' : 'Real: --'}
          </div>
        </div>
        <div style="display:flex; gap:0.5rem; align-items:center">
          ${getStatusBadge(op.estado || 'PENDENTE')}
          <button class="btn btn-secondary btn-sm" onclick="openOpModal(${op.id})">✏️ Editar</button>
          ${op.estado !== 'CONCLUIDA' ? `<button class="btn btn-success btn-sm" onclick="concluirOperacao(${op.id})">✅</button>` : ''}
        </div>
      </div>
    </div>
  `).join('');
}

function getChecklistKey() { return `sgo_checklist_${currentRepair?.id || 'generic'}`; }

function renderChecklist() {
  const saved = JSON.parse(localStorage.getItem(getChecklistKey()) || '{}');
  return CHECKLIST_ITEMS.map((item, i) => {
    const checked = saved[i] || false;
    return `
      <div class="checklist-item ${checked ? 'checked' : ''}" onclick="toggleChecklistItem(${i}, this)" style="padding: 0.5rem; border: 1px solid var(--border); border-radius: var(--radius); cursor: pointer; background: var(--card-bg);">
        <input type="checkbox" id="chk-${i}" ${checked ? 'checked' : ''} onchange="toggleChecklistItem(${i}, this.closest('.checklist-item'))" style="margin-right: 0.5rem;">
        <label for="chk-${i}" style="cursor: pointer;">${escapeHtml(item)}</label>
      </div>`;
  }).join('');
}

function toggleChecklistItem(index, itemEl) {
  const key = getChecklistKey();
  const saved = JSON.parse(localStorage.getItem(key) || '{}');
  saved[index] = !saved[index];
  localStorage.setItem(key, JSON.stringify(saved));
  if (itemEl) {
    itemEl.classList.toggle('checked', saved[index]);
    const chk = itemEl.querySelector('input[type="checkbox"]');
    if (chk) chk.checked = saved[index];
  }
}

function clearChecklist() {
  localStorage.removeItem(getChecklistKey());
  const cl = document.getElementById('checklist');
  if (cl) cl.innerHTML = renderChecklist();
}

async function openGestaoPecasModal() {
  if (!currentRepair) return;
  await loadPecas(''); 
  showModal('modal-gestao-pecas');
}

async function loadPecas(search) {
  try {
    allPecas = await api.getPecas(search) || [];
    renderPecasTable(allPecas);
  } catch (err) {
    const tbody = document.getElementById('pecas-tbody');
    if (tbody) tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted">Erro ao carregar peças</td></tr>`;
  }
}

function filterPecas(search) {
  const filtered = search ? allPecas.filter(p => p.referencia?.toLowerCase().includes(search.toLowerCase()) || p.designacao?.toLowerCase().includes(search.toLowerCase())) : allPecas;
  renderPecasTable(filtered);
}

function renderPecasTable(pecas) {
  const tbody = document.getElementById('pecas-tbody');
  if (!tbody) return;
  if (!pecas.length) { tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted" style="padding:1rem">Nenhuma peça encontrada</td></tr>`; return; }
  tbody.innerHTML = pecas.map(p => {
    const lowStock = p.stockAtual <= p.stockMinimo;
    return `<tr>
      <td><code>${escapeHtml(p.referencia)}</code></td>
      <td>${escapeHtml(p.designacao)} ${lowStock ? '<span class="badge badge-danger">⚠️ Baixo</span>' : ''}</td>
      <td class="${lowStock ? 'stock-low' : 'stock-ok'}"><strong>${p.stockAtual}</strong></td>
      <td><button class="btn btn-primary btn-sm" onclick="openRequisitar(${p.id}, '${escapeHtml(p.designacao)}', ${p.stockAtual})" ${p.stockAtual <= 0 ? 'disabled' : ''}>➕</button></td>
    </tr>`;
  }).join('');
}

function openRequisitar(pecaId, designacao, stock) {
  hideModal('modal-gestao-pecas'); 
  document.getElementById('req-peca-id').value = pecaId;
  document.getElementById('req-peca-desc').textContent = `${designacao} (Stock: ${stock})`;
  document.getElementById('req-qty').value = 1;
  document.getElementById('req-qty').max = stock;
  document.getElementById('req-obs').value = '';
  showModal('modal-requisitar');
}

async function submitRequisicao(e) {
  e.preventDefault();
  const pecaId = parseInt(document.getElementById('req-peca-id').value);
  const qty = parseInt(document.getElementById('req-qty').value);
  const obs = document.getElementById('req-obs').value.trim();
  if (!qty || qty < 1) return showToast('Quantidade inválida.', 'warning');
  try {
    await api.requisitarPeca(pecaId, { pecaId: pecaId, quantidade: qty, observacoes: obs || null, reparacaoId: currentRepair?.id });
    showToast('Peça requisitada!', 'success');
    hideModal('modal-requisitar');
    
    await api.updateEstadoReparacao(currentRepair.id, 'AGUARDA_PECAS');
    currentRepair = await api.getReparacao(currentRepair.id);
    renderDetailPanel(); 
    
  } catch (err) { showToast('Erro: ' + err.message, 'error'); }
}

function openOpModal(opId) {
  document.getElementById('modal-op-title').textContent = opId ? 'Editar Operação' : 'Nova Operação';
  document.getElementById('form-op').reset();
  document.getElementById('op-id').value = opId || '';
  if (opId && currentRepair) {
    const op = (currentRepair.operacoes || []).find(o => o.id === opId);
    if (op) {
      document.getElementById('op-descricao').value = op.descricao || '';
      document.getElementById('op-tempo').value = op.tempoEstimadoMinutos || '';
      document.getElementById('op-estado').value = op.estado || 'PENDENTE';
      
      currentOpId = opId; 
      renderDetailPanel(); 
    }
  } else {
    currentOpId = null;
  }
  
  hideModal('modal-trabalhos');
  showModal('modal-op');
}

async function submitOperacao(e) {
  e.preventDefault();
  if (!currentRepair) return;
  const id = document.getElementById('op-id').value;
  const desc = document.getElementById('op-descricao').value.trim();
  const tempo = document.getElementById('op-tempo').value;
  const estado = document.getElementById('op-estado').value;
  const payload = { descricao: desc, tempoEstimadoMinutos: tempo ? parseInt(tempo) : null, estado: estado };
  try {
    if (id) await api.updateOperacao(currentRepair.id, id, payload);
    else await api.addOperacao(currentRepair.id, payload);
    showToast(id ? 'Atualizada!' : 'Adicionada!', 'success');
    hideModal('modal-op');
    
    currentRepair = await api.getReparacao(currentRepair.id);
    openTrabalhosModal(); 
  } catch (err) { showToast('Erro: ' + err.message, 'error'); }
}

async function concluirOperacao(opId) {
  if (!currentRepair) return;
  const op = (currentRepair.operacoes || []).find(o => o.id === opId);
  try {
    await api.updateOperacao(currentRepair.id, opId, { descricao: op.descricao, estado: 'CONCLUIDA' });
    showToast('Operação concluída!', 'success');
    currentRepair = await api.getReparacao(currentRepair.id);
    openTrabalhosModal(); 
  } catch (err) { showToast('Erro: ' + err.message, 'error'); }
}

async function concluirReparacao() {
  if (!currentRepair) return;
  const pendentes = (currentRepair.operacoes || []).filter(o => o.estado !== 'CONCLUIDA');
  const ok = await confirmDialog(pendentes.length > 0 ? `Ainda tem ${pendentes.length} operações por concluir. Fechar a reparação na mesma?` : 'Confirma a conclusão total deste trabalho?');
  if (!ok) return;
  
  if (timerRunning) toggleTimer(); 
  
  try {
    await api.updateEstadoReparacao(currentRepair.id, 'CONCLUIDA');
    showToast('Trabalho Concluído com Sucesso!', 'success');
    backToDashboard(); 
  } catch (err) { showToast('Erro: ' + err.message, 'error'); }
}

/* ========================================================
   5. LÓGICA DO CRONÓMETRO PERSISTENTE (LOCALSTORAGE)
   ======================================================== */

function getTimerKey() {
  return 'sgo_timer_' + (currentRepair?.id || 'unknown');
}

function toggleTimer() {
  if (timerRunning) {
    clearInterval(timerInterval);
    timerRunning = false;
  } else {
    timerRunning = true;
    timerInterval = setInterval(() => {
      timerSeconds++;
      
      const display = document.getElementById('stopwatch-display');
      if (display) display.textContent = formatStopwatch(timerSeconds);
      
      localStorage.setItem(getTimerKey(), timerSeconds);
    }, 1000);
  }
  
  localStorage.setItem(getTimerKey(), timerSeconds);
  
  const btn = document.getElementById('btn-toggle-timer');
  if (btn) {
    btn.className = `btn btn-sm ${timerRunning ? 'btn-warning' : 'btn-success'}`;
    btn.innerHTML = timerRunning ? '⏸ Pausar' : '▶ Retomar';
  }
}

function saveTimeToOperation() {
  if (timerRunning) toggleTimer();
  
  if (!currentOpId) {
    showToast('Aviso: Tem de clicar em Editar (✏️) numa operação da Checklist para indicar onde quer guardar este tempo!', 'warning');
    return;
  }

  const minutes = Math.ceil(timerSeconds / 60);
  if (minutes <= 0) {
    showToast('O tempo registado é inferior a 1 minuto.', 'info');
    return;
  }

  const op = (currentRepair.operacoes || []).find(o => o.id === currentOpId);
  if (op) {
    api.updateOperacao(currentRepair.id, currentOpId, { 
        descricao: op.descricao, 
        tempoRealMinutos: minutes 
    })
    .then(async () => {
       showToast(`Tempo de ${formatDuration(minutes)} adicionado com sucesso à operação!`, 'success');
       
       // Limpa o tempo persistente da memória
       timerSeconds = 0;
       localStorage.removeItem(getTimerKey());
       document.getElementById('stopwatch-display').textContent = formatStopwatch(0);
       
       currentRepair = await api.getReparacao(currentRepair.id);
       renderDetailPanel();
    })
    .catch(err => showToast('Erro ao gravar tempo na BD: ' + err.message, 'error'));
  }
}