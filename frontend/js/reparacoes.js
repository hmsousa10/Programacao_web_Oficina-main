/* ========================================================
   SGO - reparacoes.js  |  Repairs Management CRUD
   ======================================================== */

'use strict';

let allReparacoes = [];
let allViaturas   = [];
let allMecanicos  = [];
let viaturaMap    = {}; // id -> viatura object

document.addEventListener('DOMContentLoaded', async () => {
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
  // Usar clienteNome que vem da resposta da viatura
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

    const opsHtml = (r.operacoes || []).length
      ? (r.operacoes || []).map(op => `
          <div class="op-item" style="margin-bottom:.5rem">
            <div class="op-info">
              <div class="op-desc">${escapeHtml(op.descricao)}</div>
              <div class="op-meta">
                ${op.tempoEstimado ? '⏱ Estimado: ' + formatDuration(op.tempoEstimado) : ''}
                ${op.tempoReal ? ' | Real: ' + formatDuration(op.tempoReal) : ''}
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
      actEl.innerHTML = `
        <button class="btn btn-outline-primary btn-sm" onclick="openUpdateEstado(${r.id}, '${r.estado}')">🔄 Atualizar Estado</button>`;
    }
  } catch (err) {
    body.innerHTML = `<div class="alert alert-danger"><span class="alert-icon">❌</span> ${escapeHtml(err.message)}</div>`;
  }
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
  
  // Obter o cliente_id a partir da viatura selecionada no mapa
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