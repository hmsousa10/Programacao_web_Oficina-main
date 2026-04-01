/* ========================================================
   SGO - reparacoes.js  |  Repairs Management CRUD
   ======================================================== */

'use strict';

let allReparacoes = [];
let allViaturas   = [];
let allMecanicos  = [];
let viaturaMap    = {}; // id -> viatura object
let currentReparacaoView = null; // Guarda a reparação atual para impressão

document.addEventListener('DOMContentLoaded', async () => {
  if (!initProtectedPage(['MANAGER', 'ADMIN', 'RECEPTION'])) return;
  if (!initProtectedPage(['MANAGER', 'RECEPTION', 'MECHANIC'])) return;
  await Promise.allSettled([loadReparacoes(), loadViaturas(), loadMecanicos()]);
  // Set default datetime for new repair
  const now = new Date();
  const inp = document.getElementById('rep-data-inicio');
  if (inp) inp.value = toInputDateTime(now);
});

/* ── Load reparações ── */
async function loadReparacoes(params) {
  const tbody   = document.getElementById('reparacoes-tbody');
  const countEl = document.getElementById('rep-count');
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="8" class="text-center" style="padding:2rem"><div class="spinner"></div></td></tr>`;
  try {
    allReparacoes = await api.getReparacoes(params) || [];
    if (countEl) countEl.textContent = `${allReparacoes.length} reparaç${allReparacoes.length !== 1 ? 'ões' : 'ão'}`;
    applyFilters();
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="8"><div class="alert alert-danger"><span class="alert-icon">❌</span> ${escapeHtml(err.message)}</div></td></tr>`;
  }
}

/* ── Load supporting data ── */
async function loadViaturas() {
  try {
    allViaturas = await api.getViaturas() || [];
    viaturaMap  = {};
    allViaturas.forEach(v => { viaturaMap[v.id] = v; });
    populateViaturaSelect();
  } catch { allViaturas = []; }
}

async function loadMecanicos() {
  try {
    allMecanicos = await api.getMecanicos() || [];
    populateMecanicoSelect();
  } catch { allMecanicos = []; }
}

function populateViaturaSelect(selectedId) {
  const sel = document.getElementById('rep-viatura');
  if (!sel) return;
  sel.innerHTML = '<option value="">Selecionar viatura…</option>' +
    allViaturas.map(v =>
      `<option value="${v.id}" ${v.id == selectedId ? 'selected' : ''}>${escapeHtml(v.matricula)} – ${escapeHtml(v.marca || '')} ${escapeHtml(v.modelo || '')}</option>`
    ).join('');
}

function populateMecanicoSelect(selectedId) {
  const sel = document.getElementById('rep-mecanico');
  if (!sel) return;
  sel.innerHTML = '<option value="">Não atribuído</option>' +
    allMecanicos.map(m =>
      `<option value="${m.id}" ${m.id == selectedId ? 'selected' : ''}>${escapeHtml(m.name || m.username)}</option>`
    ).join('');
}

/* ── When viatura is selected, auto-fill cliente ── */
function onViaturaChange() {
  const vId    = document.getElementById('rep-viatura').value;
  const input  = document.getElementById('rep-cliente');
  if (!input) return;
  const viatura = viaturaMap[parseInt(vId)];
  input.value = viatura?.clienteNome || viatura?.cliente?.nome || '';
}

/* ── Filters ── */
let searchQuery = '';
function handleSearch(value) {
  searchQuery = value.toLowerCase();
  applyFilters();
}
const handleSearch_ = debounce(handleSearch, 300);

function applyFilters() {
  const estado = document.getElementById('filter-estado')?.value || '';
  let filtered = allReparacoes;
  if (estado)       filtered = filtered.filter(r => r.estado === estado);
  if (searchQuery)  filtered = filtered.filter(r =>
    (r.viaturaMatricula && r.viaturaMatricula.toLowerCase().includes(searchQuery)) ||
    (r.clienteNome && r.clienteNome.toLowerCase().includes(searchQuery)) ||
    (r.mecanicoNome && r.mecanicoNome.toLowerCase().includes(searchQuery)) ||
    String(r.id).includes(searchQuery)
  );
  renderTable(filtered);
}

/* ── Render table ── */
function renderTable(reps) {
  const tbody = document.getElementById('reparacoes-tbody');
  if (!tbody) return;
  if (!reps.length) {
    tbody.innerHTML = `
      <tr><td colspan="8">
        <div class="empty-state">
          <div class="empty-icon">🔩</div>
          <div class="empty-title">Nenhuma reparação encontrada</div>
          <div class="empty-desc">Ajuste os filtros ou crie uma nova reparação.</div>
        </div>
      </td></tr>`;
    return;
  }
  tbody.innerHTML = reps.map(r => `
    <tr>
      <td><strong>#${r.id}</strong></td>
      <td><strong>${escapeHtml(r.viaturaMatricula || '—')}</strong></td>
      <td>${escapeHtml(r.clienteNome || '—')}</td>
      <td>${escapeHtml(r.mecanicoNome || 'Não atribuído')}</td>
      <td>${formatDate(r.dataInicio)}</td>
      <td>${getStatusBadge(r.estado)}</td>
      <td>${r.valorTotal ? formatCurrency(r.valorTotal) : '—'}</td>
      <td>
        <div class="table-actions">
          <button class="btn btn-secondary btn-sm" onclick="viewReparacao(${r.id})" title="Ver Detalhes">👁️</button>
          <button class="btn btn-outline-primary btn-sm" onclick="openUpdateEstado(${r.id}, '${r.estado}')" title="Atualizar Estado">🔄</button>
          <button class="btn btn-secondary btn-sm" onclick="openEditReparacao(${r.id})" title="Editar">✏️</button>
          <button class="btn btn-outline-danger btn-sm" onclick="deleteReparacao(${r.id})" title="Eliminar">🗑️</button>
        </div>
      </td>
    </tr>
  `).join('');
}

/* ── View detail ── */
async function viewReparacao(id) {
  const title  = document.getElementById('modal-detail-title');
  const body   = document.getElementById('modal-detail-body');
  const actEl  = document.getElementById('modal-detail-actions');
  if (!title || !body) return;

  title.textContent = `Reparação #${id}`;
  body.innerHTML    = `<div class="loading-overlay"><div class="spinner"></div></div>`;
  showModal('modal-detail');

  try {
    const r = await api.getReparacao(id);
    currentReparacaoView = r; // Guardar globalmente para a função de impressão

    const opsHtml = (r.operacoes || []).length
      ? (r.operacoes || []).map(op => `
          <div class="op-item" style="margin-bottom:.5rem">
            <div class="op-info">
              <div class="op-desc">${escapeHtml(op.descricao)}</div>
              <div class="op-meta">
                ${op.tempoEstimadoMinutos ? '⏱ Estimado: ' + formatDuration(op.tempoEstimadoMinutos) : ''}
                ${op.tempoRealMinutos ? ' | Real: ' + formatDuration(op.tempoRealMinutos) : ''}
                ${op.valor ? ' | ' + formatCurrency(op.valor) : ''}
              </div>
            </div>
            ${getStatusBadge(op.estado || 'NAO_INICIADA')}
          </div>`).join('')
      : '<p class="text-muted">Sem operações registadas.</p>';

    body.innerHTML = `
      <div class="two-col-layout" style="margin-bottom:1.5rem">
        <div>
          <div class="info-grid">
            <div class="info-item"><span class="info-label">Viatura</span>
              <span class="info-value">${escapeHtml(r.viaturaMatricula || '—')}</span></div>
            <div class="info-item"><span class="info-label">Cliente</span>
              <span class="info-value">${escapeHtml(r.clienteNome || '—')}</span></div>
            <div class="info-item"><span class="info-label">Mecânico</span>
              <span class="info-value">${escapeHtml(r.mecanicoNome || 'Não atribuído')}</span></div>
            <div class="info-item"><span class="info-label">Estado</span>
              <span class="info-value">${getStatusBadge(r.estado)}</span></div>
            <div class="info-item"><span class="info-label">Data Início</span>
              <span class="info-value">${formatDateTime(r.dataInicio)}</span></div>
            <div class="info-item"><span class="info-label">Data Fim</span>
              <span class="info-value">${r.dataFim ? formatDateTime(r.dataFim) : '—'}</span></div>
            <div class="info-item"><span class="info-label">Valor Total</span>
              <span class="info-value fw-bold">${r.valorTotal ? formatCurrency(r.valorTotal) : '—'}</span></div>
          </div>
        </div>
      </div>
      <h4 style="font-size:.9rem; font-weight:700; margin-bottom:.75rem; text-transform:uppercase; color:var(--text-secondary);">Operações</h4>
      ${opsHtml}
    `;

    if (actEl) {
      const user = getCurrentUser();
      
      // O botão de Faturar SÓ aparece se for Gestor ou Admin
      let btnFaturar = '';
      if (user && (user.role === 'MANAGER' || user.role === 'ADMIN')) {
          btnFaturar = `<button class="btn btn-warning btn-sm" onclick="openFaturacao()" style="margin-right: 10px; color: black;">💳 Faturar</button>`;
      }

      actEl.innerHTML = `
        <button class="btn btn-outline-primary btn-sm" onclick="openUpdateEstado(${r.id}, '${r.estado}')" style="margin-right: 10px;">🔄 Estado</button>
        
        ${btnFaturar} <button class="btn btn-outline-secondary btn-sm" onclick="window.open('status.html?id=${r.id}', '_blank')" style="margin-right: 10px;">📱 Portal</button>
        <button class="btn btn-success btn-sm" onclick="printFolhaObra()">🖨️ Imprimir</button>
      `;
    }
  } catch (err) {
    body.innerHTML = `<div class="alert alert-danger"><span class="alert-icon">❌</span> ${escapeHtml(err.message)}</div>`;
  }
}

/* ── MÁGICA: Imprimir Folha de Obra com QR Code ── */
function printFolhaObra() {
  if (!currentReparacaoView) return;
  const r = currentReparacaoView;

  // 1. Preencher os dados na folha invisível
  document.getElementById('print-id').textContent = r.id;
  document.getElementById('print-date').textContent = new Date(r.dataInicio || new Date()).toLocaleDateString('pt-PT');
  
  document.getElementById('print-client-name').textContent = r.clienteNome || '—';
  
  document.getElementById('print-vehicle-mat').textContent = r.viaturaMatricula || '—';
  document.getElementById('print-vehicle-mod').textContent = (r.viaturaMarca || '') + ' ' + (r.viaturaModelo || '');
  
  document.getElementById('print-desc').textContent = r.descricao || 'Serviço Geral / Diagnóstico';

  // 2. Preencher a tabela de operações
  const tbody = document.getElementById('print-ops-tbody');
  if (r.operacoes && r.operacoes.length > 0) {
    tbody.innerHTML = r.operacoes.map(op => `
      <tr>
        <td>${escapeHtml(op.descricao)}</td>
        <td>${op.tempoEstimadoMinutos ? op.tempoEstimadoMinutos + ' min' : '—'}</td>
        <td>${op.estado.replace('_', ' ')}</td>
      </tr>
    `).join('');
  } else {
    tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding: 20px;">Nenhuma operação detalhada. Espaço livre para anotações do mecânico.</td></tr>';
  }

  // 3. Gerar o QR Code
  const qrContainer = document.getElementById('qrcode');
  qrContainer.innerHTML = ''; // Limpar anterior
  
  // O link mágico que vamos criar no futuro:
  const trackingUrl = window.location.origin + '/frontend/status.html?id=' + r.id;
  
  new QRCode(qrContainer, {
    text: trackingUrl,
    width: 120,
    height: 120,
    colorDark : "#000000",
    colorLight : "#ffffff",
    correctLevel : QRCode.CorrectLevel.H
  });

  // 4. Chamar a caixa de impressão do browser
  // Um pequeno delay para garantir que o QRCode renderizou a imagem
  setTimeout(() => {
    window.print();
  }, 300);
}


/* ── Create ── */
function openCreateReparacao() {
  document.getElementById('modal-rep-title').textContent = 'Nova Reparação';
  document.getElementById('form-reparacao').reset();
  document.getElementById('rep-id').value = '';
  document.getElementById('rep-data-inicio').value = toInputDateTime(new Date());
  populateViaturaSelect();
  populateMecanicoSelect();
  showModal('modal-reparacao');
}

/* ── Edit ── */
function openEditReparacao(id) {
  const r = allReparacoes.find(x => x.id === id);
  if (!r) return;
  document.getElementById('modal-rep-title').textContent = `Editar Reparação #${id}`;
  document.getElementById('rep-id').value          = r.id;
  document.getElementById('rep-descricao').value   = r.descricao || '';
  if (r.dataInicio) document.getElementById('rep-data-inicio').value = toInputDateTime(r.dataInicio);
  populateViaturaSelect(r.viaturaId);
  populateMecanicoSelect(r.mecanicoId);
  document.getElementById('rep-cliente').value = r.clienteNome || '';
  showModal('modal-reparacao');
}

/* ── Submit ── */
async function submitReparacao(e) {
  e.preventDefault();
  const id = document.getElementById('rep-id').value;
  const vId = document.getElementById('rep-viatura').value;
  const mId = document.getElementById('rep-mecanico').value;
  
  const viatura = viaturaMap[parseInt(vId)];
  const clienteId = viatura?.clienteId || viatura?.cliente?.id;

  const payload = {
    viaturaId:   parseInt(vId),
    clienteId:   clienteId ? parseInt(clienteId) : null,
    mecanicoId:  mId ? parseInt(mId) : null,
    descricao:   document.getElementById('rep-descricao').value.trim() || null,
    agendamentoId: null
  };

  try {
    if (id) {
      await api.updateReparacao(id, payload);
      showToast('Reparação atualizada!', 'success');
    } else {
      await api.createReparacao(payload);
      showToast('Reparação criada!', 'success');
    }
    hideModal('modal-reparacao');
    await loadReparacoes();
  } catch (err) {
    showToast('Erro: ' + err.message, 'error');
  }
}

/* ── Update estado ── */
function openUpdateEstado(id, estadoAtual) {
  document.getElementById('estado-rep-id').value = id;
  document.getElementById('novo-estado').value   = estadoAtual || 'PENDENTE';
  showModal('modal-estado');
}

async function submitEstado() {
  const id    = document.getElementById('estado-rep-id').value;
  const novo  = document.getElementById('novo-estado').value;
  try {
    await api.updateEstadoReparacao(id, novo);
    showToast('Estado atualizado!', 'success');
    hideModal('modal-estado');
    hideModal('modal-detail');
    await loadReparacoes();
  } catch (err) {
    showToast('Erro: ' + err.message, 'error');
  }
}

/* ── Delete ── */
async function deleteReparacao(id) {
  const ok = await confirmDialog(`Eliminar reparação #${id}? Esta ação não pode ser desfeita.`);
  if (!ok) return;
  try {
    await api.deleteReparacao(id);
    showToast('Reparação eliminada.', 'success');
    await loadReparacoes();
  } catch (err) {
    showToast('Erro: ' + err.message, 'error');
  }
}

/* ========================================================
   LÓGICA DE FATURAÇÃO / ORÇAMENTAÇÃO
   ======================================================== */

let linhasMaterial = [];

function openFaturacao() {
  if (!currentReparacaoView) return;
  const r = currentReparacaoView;

  // Preencher cabeçalho
  document.getElementById('fat-rep-id').textContent = r.id;
  document.getElementById('fat-cliente').textContent = r.clienteNome || '—';
  document.getElementById('fat-viatura').textContent = r.viaturaMatricula || '—';

  // 🔮 MAGIA AQUI: Auto-preencher com as Peças que o mecânico requisitou!
  linhasMaterial = [];
  if (r.pecas && r.pecas.length > 0) {
    linhasMaterial = r.pecas.map(p => ({
      desc: p.designacao,
      qtd: p.quantidade,
      preco: p.precoUnitario || 0
    }));
  }
  
  // Calcular e desenhar a tabela (Mão de obra + Peças)
  calcularFatura();
  
  hideModal('modal-detail'); 
  showModal('modal-faturacao'); 
}

function adicionarLinhaMaterial() {
  linhasMaterial.push({ desc: '', qtd: 1, preco: 0 });
  calcularFatura();
}

function removerLinhaMaterial(index) {
  linhasMaterial.splice(index, 1);
  calcularFatura();
}

function atualizarMaterial(index, campo, valor) {
  linhasMaterial[index][campo] = valor;
  calcularFatura();
}

function calcularFatura() {
  const r = currentReparacaoView;
  if (!r) return;

  const taxaHoraria = parseFloat(document.getElementById('taxa-horaria').value) || 0;
  let subtotalMaoObra = 0;

  // 1. PROCESSAR MÃO DE OBRA (Vem do Tablet do Mecânico)
  const tbodyMaoObra = document.getElementById('fat-maodeobra-tbody');
  if (r.operacoes && r.operacoes.length > 0) {
    tbodyMaoObra.innerHTML = r.operacoes.map(op => {
      // Usa o tempo real se existir, senão usa o estimado (ou 0)
      const minutos = op.tempoRealMinutos || op.tempoEstimadoMinutos || 0;
      const horas = minutos / 60;
      const valorLinha = horas * taxaHoraria;
      subtotalMaoObra += valorLinha;

      return `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${escapeHtml(op.descricao)}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${minutos} min (${horas.toFixed(2)}h)</td>
          <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: right;">${formatCurrency(valorLinha)}</td>
        </tr>
      `;
    }).join('');
  } else {
    tbodyMaoObra.innerHTML = `<tr><td colspan="3" style="padding: 15px; text-align: center; color: #64748b;">Sem operações registadas.</td></tr>`;
  }

  // 2. PROCESSAR MATERIAIS / PEÇAS (Adicionados manualmente no ecrã)
  let subtotalMateriais = 0;
  const tbodyMateriais = document.getElementById('fat-materiais-tbody');
  
  if (linhasMaterial.length > 0) {
    tbodyMateriais.innerHTML = linhasMaterial.map((linha, index) => {
      const valorLinha = linha.qtd * linha.preco;
      subtotalMateriais += valorLinha;
      return `
        <tr>
          <td style="padding: 5px;"><input type="text" value="${linha.desc}" onchange="atualizarMaterial(${index}, 'desc', this.value)" placeholder="Óleo Motor 5W30" style="width: 100%; padding: 5px;"></td>
          <td style="padding: 5px;"><input type="number" value="${linha.qtd}" min="1" onchange="atualizarMaterial(${index}, 'qtd', parseFloat(this.value))" style="width: 60px; padding: 5px;"></td>
          <td style="padding: 5px;"><input type="number" value="${linha.preco}" min="0" step="0.01" onchange="atualizarMaterial(${index}, 'preco', parseFloat(this.value))" style="width: 80px; padding: 5px;"> €</td>
          <td style="padding: 8px; text-align: right; font-weight: bold;">${formatCurrency(valorLinha)}</td>
          <td style="padding: 8px; text-align: center;"><button onclick="removerLinhaMaterial(${index})" style="background: none; border: none; color: red; cursor: pointer; font-size: 16px;">🗑️</button></td>
        </tr>
      `;
    }).join('');
  } else {
    tbodyMateriais.innerHTML = `<tr><td colspan="5" style="padding: 15px; text-align: center; color: #64748b;">Nenhuma peça adicionada.</td></tr>`;
  }

  // 3. CALCULAR TOTAIS
  const subtotalGeral = subtotalMaoObra + subtotalMateriais;
  const iva = subtotalGeral * 0.23; // IVA a 23%
  const totalGeral = subtotalGeral + iva;

  document.getElementById('fat-subtotal').textContent = formatCurrency(subtotalGeral);
  document.getElementById('fat-iva').textContent = formatCurrency(iva);
  document.getElementById('fat-total').textContent = formatCurrency(totalGeral);
  
  // Guardamos o valor final no dataset do botão para o podermos salvar na BD a seguir
  document.getElementById('fat-total').dataset.valorcru = totalGeral.toFixed(2);
}

async function guardarFaturacao() {
  const r = currentReparacaoView;
  const valorFinalString = document.getElementById('fat-total').dataset.valorcru;
  const valorFinal = parseFloat(valorFinalString);

  if (isNaN(valorFinal) || valorFinal <= 0) {
    showToast('O valor da fatura tem de ser superior a zero.', 'warning');
    return;
  }

  try {
    // Como a API só precisa de atualizar o valorTotal, mandamos o payload necessário
    await api.updateReparacao(r.id, {
      viaturaId: r.viaturaId,
      clienteId: r.clienteId,
      mecanicoId: r.mecanicoId,
      descricao: r.descricao,
      valorTotal: valorFinal // <--- MAGIA ACONTECE AQUI
    });

    showToast(`Faturação de ${formatCurrency(valorFinal)} guardada com sucesso!`, 'success');
    hideModal('modal-faturacao');
    
    // Recarrega a tabela e atualiza os gráficos do Dashboard
    await loadReparacoes(); 
    
  } catch (err) {
    showToast('Erro ao guardar faturação: ' + err.message, 'error');
  }
}