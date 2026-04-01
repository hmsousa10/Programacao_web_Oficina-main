/* ========================================================
   SGO - viaturas.js  |  Vehicle Management CRUD
   ======================================================== */

'use strict';

let allViaturas = [];
let allClientes = [];

document.addEventListener('DOMContentLoaded', async () => {
  if (!initProtectedPage(['MANAGER', 'ADMIN', 'RECEPTION'])) return;
  if (!initProtectedPage(['MANAGER', 'RECEPTION', 'MECHANIC'])) return;
  await Promise.allSettled([loadViaturas(), loadClientesForSelect()]);
});

/* ── Load viaturas ── */
async function loadViaturas(search) {
  const tbody   = document.getElementById('viaturas-tbody');
  const countEl = document.getElementById('viatura-count');
  if (!tbody) return;

  // Mostra o spinner enquanto carrega
  tbody.innerHTML = `<tr><td colspan="7" class="text-center" style="padding:2rem"><div class="spinner"></div></td></tr>`;
  
  try {
    allViaturas = await api.getViaturas(search) || [];
    if (countEl) countEl.textContent = `${allViaturas.length} viatura${allViaturas.length !== 1 ? 's' : ''}`;
    renderTable(allViaturas);
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="alert alert-danger"><span class="alert-icon">❌</span> ${escapeHtml(err.message)}</div></td></tr>`;
  }
}

/* ── Load clients for dropdown ── */
async function loadClientesForSelect() {
  try {
    allClientes = await api.getClientes() || [];
    populateClienteSelect();
  } catch {
    allClientes = [];
  }
}

function populateClienteSelect(selectedId) {
  const sel = document.getElementById('viat-cliente');
  if (!sel) return;
  sel.innerHTML = '<option value="">Selecionar cliente…</option>' +
    allClientes.map(c =>
      `<option value="${c.id}" ${c.id == selectedId ? 'selected' : ''}>${escapeHtml(c.nome)} – ${escapeHtml(c.nif || '')}</option>`
    ).join('');
}

/* ── Search ── */
const handleSearch = debounce(async (value) => {
  const q = value.trim();
  if (q.length >= 2) {
    await loadViaturas(q);
  } else if (q.length === 0) {
    await loadViaturas();
  } else {
    const filtered = allViaturas.filter(v =>
      v.matricula?.toLowerCase().includes(q.toLowerCase()) ||
      v.marca?.toLowerCase().includes(q.toLowerCase()) ||
      v.modelo?.toLowerCase().includes(q.toLowerCase())
    );
    renderTable(filtered);
  }
}, 350);

/* ── Render table ── */
function renderTable(viaturas) {
  const tbody   = document.getElementById('viaturas-tbody');
  const countEl = document.getElementById('viatura-count');
  if (!tbody) return;
  if (countEl) countEl.textContent = `${viaturas.length} viatura${viaturas.length !== 1 ? 's' : ''}`;

  if (!viaturas.length) {
    tbody.innerHTML = `
      <tr><td colspan="7">
        <div class="empty-state">
          <div class="empty-icon">🚗</div>
          <div class="empty-title">Nenhuma viatura encontrada</div>
          <div class="empty-desc">Tente ajustar a pesquisa ou registe uma nova viatura.</div>
        </div>
      </td></tr>`;
    return;
  }

  tbody.innerHTML = viaturas.map(v => `
    <tr>
      <td><strong style="letter-spacing:.05em">${escapeHtml(v.matricula)}</strong></td>
      <td>${escapeHtml(v.marca || '—')}</td>
      <td>${escapeHtml(v.modelo || '—')}</td>
      <td>${v.ano || '—'}</td>
      <td>${getCombustivelLabel(v.combustivel)}</td>
      <td>${escapeHtml(v.clienteNome || '—')}</td>
      <td>
        <div class="table-actions">
          <button class="btn btn-secondary btn-sm" onclick="openEditViatura(${v.id})" title="Editar">✏️</button>
          <button class="btn btn-outline-primary btn-sm" onclick="verHistorico(${v.id}, '${escapeHtml(v.matricula)}')" title="Histórico">📋</button>
          <button class="btn btn-outline-danger btn-sm" onclick="deleteViatura(${v.id}, '${escapeHtml(v.matricula)}')" title="Eliminar">🗑️</button>
        </div>
      </td>
    </tr>
  `).join('');
}

/* ── Create ── */
function openCreateViatura() {
  document.getElementById('modal-viatura-title').textContent = 'Nova Viatura';
  document.getElementById('form-viatura').reset();
  document.getElementById('viatura-id').value = '';
  populateClienteSelect();
  showModal('modal-viatura');
}

/* ── Edit ── */
function openEditViatura(id) {
  const v = allViaturas.find(x => x.id === id);
  if (!v) return;
  document.getElementById('modal-viatura-title').textContent = 'Editar Viatura';
  document.getElementById('viatura-id').value      = v.id;
  document.getElementById('viat-matricula').value  = v.matricula || '';
  document.getElementById('viat-vin').value        = v.numeroChassis || '';
  document.getElementById('viat-marca').value      = v.marca || '';
  document.getElementById('viat-modelo').value     = v.modelo || '';
  document.getElementById('viat-ano').value        = v.ano || '';
  document.getElementById('viat-combustivel').value= v.combustivel || '';
  document.getElementById('viat-km').value         = v.quilometragem || '';
  document.getElementById('viat-cor').value        = v.cor || '';
  document.getElementById('viat-obs').value        = v.observacoes || '';
  populateClienteSelect(v.clienteId || v.cliente?.id);
  showModal('modal-viatura');
}

/* ── Submit ── */
async function submitViatura(e) {
  e.preventDefault();
  const id = document.getElementById('viatura-id').value;
  
  const anoStr = document.getElementById('viat-ano').value;
  const kmStr = document.getElementById('viat-km').value;
  const clienteStr = document.getElementById('viat-cliente').value;

  const payload = {
    matricula:     document.getElementById('viat-matricula').value.trim().toUpperCase(),
    numeroChassis: document.getElementById('viat-vin').value.trim() || null,
    marca:         document.getElementById('viat-marca').value.trim(),
    modelo:        document.getElementById('viat-modelo').value.trim(),
    ano:           anoStr ? parseInt(anoStr, 10) : null,
    combustivel:   document.getElementById('viat-combustivel').value || null,
    quilometragem: kmStr ? parseInt(kmStr, 10) : null,
    cor:           document.getElementById('viat-cor').value.trim() || null,
    observacoes:   document.getElementById('viat-obs').value.trim() || null,
    clienteId:     clienteStr ? parseInt(clienteStr, 10) : null,
  };
  
  try {
    if (id) {
      await api.updateViatura(id, payload);
      showToast('Viatura atualizada!', 'success');
    } else {
      await api.createViatura(payload);
      showToast('Viatura registada!', 'success');
    }
    hideModal('modal-viatura');
    await loadViaturas();
  } catch (err) {
    showToast('Erro: ' + err.message, 'error');
  }
}

/* ── Delete ── */
async function deleteViatura(id, matricula) {
  const ok = await confirmDialog(`Eliminar viatura "${matricula}"?\nEsta ação não pode ser desfeita.`);
  if (!ok) return;
  try {
    await api.deleteViatura(id);
    showToast('Viatura eliminada.', 'success');
    await loadViaturas();
  } catch (err) {
    showToast('Erro: ' + err.message, 'error');
  }
}

/* ── Histórico ── */
async function verHistorico(viaturaId, matricula) {
  const title   = document.getElementById('panel-viatura-title');
  const content = document.getElementById('panel-viatura-content');
  if (!title || !content) return;
  title.textContent = `Histórico – ${matricula}`;
  content.innerHTML = `<div class="loading-overlay"><div class="spinner"></div></div>`;
  showModal('panel-viatura');

  try {
    const reparacoes = await api.getViaturaReparacoes(viaturaId) || [];
    if (!reparacoes.length) {
      content.innerHTML = `<div class="empty-state"><div class="empty-icon">🔧</div><div class="empty-title">Sem reparações registadas</div></div>`;
      return;
    }
    content.innerHTML = `
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Data Início</th>
              <th>Data Fim</th>
              <th>Estado</th>
              <th>Mecânico</th>
              <th>Valor Total</th>
            </tr>
          </thead>
          <tbody>
            ${reparacoes.map(r => `
              <tr>
                <td>#${r.id}</td>
                <td>${formatDate(r.dataInicio)}</td>
                <td>${formatDate(r.dataFim) || '—'}</td>
                <td>${getStatusBadge(r.estado)}</td>
                <td>${escapeHtml(r.mecanico?.name || '—')}</td>
                <td>${r.valorTotal ? formatCurrency(r.valorTotal) : '—'}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  } catch (err) {
    content.innerHTML = `<div class="alert alert-danger"><span class="alert-icon">❌</span> ${escapeHtml(err.message)}</div>`;
  }
}