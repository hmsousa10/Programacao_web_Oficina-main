/* ========================================================
   SGO - clientes.js  |  Client Management CRUD
   ======================================================== */

'use strict';

let allClientes     = [];
let filteredClientes = [];

document.addEventListener('DOMContentLoaded', async () => {
  if (!initProtectedPage(['MANAGER', 'ADMIN', 'RECEPTION'])) return;
  if (!initProtectedPage(['MANAGER', 'RECEPTION'])) return;
  await loadClientes();
});

/* ── Load all clients ── */
async function loadClientes(search) {
  const tbody   = document.getElementById('clientes-tbody');
  const countEl = document.getElementById('cliente-count');
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="6" class="text-center" style="padding:2rem"><div class="spinner"></div></td></tr>`;
  try {
    allClientes      = await api.getClientes(search) || [];
    filteredClientes = allClientes;
    if (countEl) countEl.textContent = `${allClientes.length} cliente${allClientes.length !== 1 ? 's' : ''}`;
    renderTable(filteredClientes);
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="alert alert-danger"><span class="alert-icon">❌</span> ${escapeHtml(err.message)}</div></td></tr>`;
  }
}

/* ── Search (debounced) ── */
const handleSearch = debounce(async (value) => {
  const q = value.trim();
  if (q.length === 0) {
    filteredClientes = allClientes;
    renderTable(filteredClientes);
  } else if (q.length >= 2) {
    await loadClientes(q);
  } else {
    filteredClientes = allClientes.filter(c =>
      c.nome?.toLowerCase().includes(q.toLowerCase()) ||
      c.nif?.includes(q) ||
      c.telefone?.includes(q) ||
      c.email?.toLowerCase().includes(q.toLowerCase())
    );
    renderTable(filteredClientes);
  }
}, 350);

/* ── Render table ── */
function renderTable(clientes) {
  const tbody = document.getElementById('clientes-tbody');
  if (!tbody) return;
  const countEl = document.getElementById('cliente-count');
  if (countEl) countEl.textContent = `${clientes.length} cliente${clientes.length !== 1 ? 's' : ''}`;

  if (!clientes.length) {
    tbody.innerHTML = `
      <tr><td colspan="6">
        <div class="empty-state">
          <div class="empty-icon">👤</div>
          <div class="empty-title">Nenhum cliente encontrado</div>
          <div class="empty-desc">Tente ajustar a pesquisa ou crie um novo cliente.</div>
        </div>
      </td></tr>`;
    return;
  }
  tbody.innerHTML = clientes.map(c => `
    <tr>
      <td><strong>${escapeHtml(c.nome)}</strong></td>
      <td>${escapeHtml(c.nif || '—')}</td>
      <td>${escapeHtml(c.telefone || '—')}</td>
      <td>${escapeHtml(c.email || '—')}</td>
      <td style="max-width:180px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${escapeHtml(c.morada || '')}">
        ${escapeHtml(c.morada || '—')}
      </td>
      <td>
        <div class="table-actions">
          <button class="btn btn-secondary btn-sm" onclick="openEditCliente(${c.id})" title="Editar">✏️</button>
          <button class="btn btn-outline-primary btn-sm" onclick="verViaturas(${c.id}, '${escapeHtml(c.nome)}')" title="Ver Viaturas">🚗</button>
          <button class="btn btn-outline-danger btn-sm" onclick="deleteCliente(${c.id}, '${escapeHtml(c.nome)}')" title="Eliminar">🗑️</button>
        </div>
      </td>
    </tr>
  `).join('');
}

/* ── Create ── */
function openCreateCliente() {
  document.getElementById('modal-cliente-title').textContent = 'Novo Cliente';
  document.getElementById('form-cliente').reset();
  document.getElementById('cliente-id').value = '';
  showModal('modal-cliente');
}

/* ── Edit ── */
function openEditCliente(id) {
  const c = allClientes.find(x => x.id === id);
  if (!c) return;
  document.getElementById('modal-cliente-title').textContent = 'Editar Cliente';
  document.getElementById('cliente-id').value  = c.id;
  document.getElementById('cli-nome').value    = c.nome || '';
  document.getElementById('cli-nif').value     = c.nif || '';
  document.getElementById('cli-telefone').value= c.telefone || '';
  document.getElementById('cli-email').value   = c.email || '';
  document.getElementById('cli-morada').value  = c.morada || '';
  document.getElementById('cli-obs').value     = c.observacoes || '';
  showModal('modal-cliente');
}

/* ── Submit ── */
async function submitCliente(e) {
  e.preventDefault();
  const id = document.getElementById('cliente-id').value;
  const payload = {
    nome:         document.getElementById('cli-nome').value.trim(),
    nif:          document.getElementById('cli-nif').value.trim() || null,
    telefone:     document.getElementById('cli-telefone').value.trim(),
    email:        document.getElementById('cli-email').value.trim() || null,
    morada:       document.getElementById('cli-morada').value.trim() || null,
    observacoes:  document.getElementById('cli-obs').value.trim() || null,
  };
  try {
    if (id) {
      await api.updateCliente(id, payload);
      showToast('Cliente atualizado com sucesso!', 'success');
    } else {
      await api.createCliente(payload);
      showToast('Cliente criado com sucesso!', 'success');
    }
    hideModal('modal-cliente');
    await loadClientes();
  } catch (err) {
    showToast('Erro: ' + err.message, 'error');
  }
}

/* ── Delete ── */
async function deleteCliente(id, nome) {
  const ok = await confirmDialog(`Eliminar cliente "${nome}"?\nEsta ação não pode ser desfeita.`);
  if (!ok) return;
  try {
    await api.deleteCliente(id);
    showToast('Cliente eliminado.', 'success');
    await loadClientes();
  } catch (err) {
    showToast('Erro ao eliminar: ' + err.message, 'error');
  }
}

/* ── Ver Viaturas ── */
async function verViaturas(clienteId, nome) {
  const title   = document.getElementById('panel-viaturas-title');
  const content = document.getElementById('panel-viaturas-content');
  if (!title || !content) return;
  title.textContent = `Viaturas de ${nome}`;
  content.innerHTML = `<div class="loading-overlay"><div class="spinner"></div></div>`;
  showModal('panel-viaturas');

  try {
    const [viaturas, reparacoes] = await Promise.allSettled([
      api.getClienteViaturas(clienteId),
      api.getClienteReparacoes(clienteId),
    ]);

    const vs = viaturas.status === 'fulfilled' ? (viaturas.value || []) : [];
    const rs = reparacoes.status === 'fulfilled' ? (reparacoes.value || []) : [];

    if (!vs.length && !rs.length) {
      content.innerHTML = `<div class="empty-state"><div class="empty-icon">🚗</div><div class="empty-title">Sem viaturas registadas</div></div>`;
      return;
    }

    let html = '';
    if (vs.length) {
      html += `
        <h4 style="margin-bottom:.75rem; font-size:.9rem; font-weight:700; text-transform:uppercase; color:var(--text-secondary);">
          Viaturas (${vs.length})
        </h4>
        <div class="table-wrapper" style="margin-bottom:1.5rem">
          <table>
            <thead><tr><th>Matrícula</th><th>Marca</th><th>Modelo</th><th>Ano</th><th>Combustível</th></tr></thead>
            <tbody>
              ${vs.map(v => `
                <tr>
                  <td><strong>${escapeHtml(v.matricula)}</strong></td>
                  <td>${escapeHtml(v.marca || '—')}</td>
                  <td>${escapeHtml(v.modelo || '—')}</td>
                  <td>${v.ano || '—'}</td>
                  <td>${getCombustivelLabel(v.combustivel)}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>`;
    }

    if (rs.length) {
      html += `
        <h4 style="margin-bottom:.75rem; font-size:.9rem; font-weight:700; text-transform:uppercase; color:var(--text-secondary);">
          Histórico de Reparações (${rs.length})
        </h4>
        <div class="table-wrapper">
          <table>
            <thead><tr><th>ID</th><th>Viatura</th><th>Data Início</th><th>Estado</th><th>Valor</th></tr></thead>
            <tbody>
              ${rs.map(r => `
                <tr>
                  <td>#${r.id}</td>
                  <td>${escapeHtml(r.viatura?.matricula || '—')}</td>
                  <td>${formatDate(r.dataInicio)}</td>
                  <td>${getStatusBadge(r.estado)}</td>
                  <td>${r.valorTotal ? formatCurrency(r.valorTotal) : '—'}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>`;
    }

    content.innerHTML = html;
  } catch (err) {
    content.innerHTML = `<div class="alert alert-danger"><span class="alert-icon">❌</span> ${escapeHtml(err.message)}</div>`;
  }
}
