/* ========================================================
   SGO - pecas.js  |  Parts & Stock Management
   ======================================================== */

'use strict';

let allPecas    = [];
let searchQuery = '';

document.addEventListener('DOMContentLoaded', async () => {
  if (!initProtectedPage(['MANAGER', 'RECEPTION', 'MECHANIC'])) return;
  await Promise.allSettled([loadPecas(), loadAlertasStock()]);
});

/* ── Tab switching ── */
function switchTab(tabId, btnEl) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(tabId)?.classList.add('active');
  if (btnEl) btnEl.classList.add('active');
}

/* ── Load peças ── */
async function loadPecas(search) {
  const tbody   = document.getElementById('pecas-tbody');
  const countEl = document.getElementById('peca-count');
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="8" class="text-center" style="padding:2rem"><div class="spinner"></div></td></tr>`;
  try {
    allPecas = await api.getPecas(search) || [];
    if (countEl) countEl.textContent = `${allPecas.length} peç${allPecas.length !== 1 ? 'as' : 'a'}`;
    populateCategorias();
    populatePecaSelect();
    applyFilters();
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="8"><div class="alert alert-danger"><span class="alert-icon">❌</span> ${escapeHtml(err.message)}</div></td></tr>`;
  }
}

/* ── Load stock alerts ── */
async function loadAlertasStock() {
  try {
    const alertas = await api.getAlertasStock() || [];
    const banner  = document.getElementById('stock-alert-banner');
    const text    = document.getElementById('stock-alert-text');
    if (!banner || !text) return;
    if (alertas.length > 0) {
      text.innerHTML = `<strong>${alertas.length} peça${alertas.length > 1 ? 's com stock abaixo' : ' com stock abaixo'} do mínimo:</strong> ${alertas.map(p => escapeHtml(p.designacao)).join(', ')}`;
      banner.classList.remove('hidden');
    } else {
      banner.classList.add('hidden');
    }
  } catch { /* ignore */ }
}

/* ── Populate category filter datalist ── */
function populateCategorias() {
  const cats     = [...new Set(allPecas.map(p => p.categoria).filter(Boolean))].sort();
  const sel      = document.getElementById('filter-categoria');
  const datalist = document.getElementById('categoria-list');

  if (sel) {
    sel.innerHTML = '<option value="">Todas as categorias</option>' +
      cats.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
  }
  if (datalist) {
    datalist.innerHTML = cats.map(c => `<option value="${escapeHtml(c)}">`);
  }
}

/* ── Populate peça dropdown for movements tab ── */
function populatePecaSelect() {
  const sel = document.getElementById('sel-peca-movimentos');
  if (!sel) return;
  const current = sel.value;
  sel.innerHTML = '<option value="">Selecionar peça…</option>' +
    allPecas.map(p =>
      `<option value="${p.id}" ${p.id == current ? 'selected' : ''}>[${escapeHtml(p.referencia)}] ${escapeHtml(p.designacao)}</option>`
    ).join('');
}

/* ── Search ── */
const handleSearch = debounce(async (value) => {
  searchQuery = value.toLowerCase();
  if (value.length >= 2) {
    await loadPecas(value.trim());
  } else {
    applyFilters();
  }
}, 350);

/* ── Apply filters ── */
function applyFilters() {
  const catFilter  = document.getElementById('filter-categoria')?.value || '';
  const baixoOnly  = document.getElementById('filter-baixo')?.checked || false;
  const q          = searchQuery;

  let filtered = allPecas;
  if (catFilter)  filtered = filtered.filter(p => p.categoria === catFilter);
  if (baixoOnly)  filtered = filtered.filter(p => p.quantidadeStock <= p.stockMinimo);
  if (q)          filtered = filtered.filter(p =>
    p.referencia?.toLowerCase().includes(q) ||
    p.designacao?.toLowerCase().includes(q) ||
    p.fornecedor?.toLowerCase().includes(q) ||
    p.categoria?.toLowerCase().includes(q)
  );
  renderTable(filtered);
}

/* ── Render table ── */
function renderTable(pecas) {
  const tbody = document.getElementById('pecas-tbody');
  if (!tbody) return;
  if (!pecas.length) {
    tbody.innerHTML = `
      <tr><td colspan="8">
        <div class="empty-state">
          <div class="empty-icon">📦</div>
          <div class="empty-title">Nenhuma peça encontrada</div>
          <div class="empty-desc">Ajuste a pesquisa ou registe uma nova peça.</div>
        </div>
      </td></tr>`;
    return;
  }
  tbody.innerHTML = pecas.map(p => {
    const low = p.quantidadeStock <= p.stockMinimo;
    return `
      <tr>
        <td><code style="font-weight:600">${escapeHtml(p.referencia)}</code></td>
        <td>${escapeHtml(p.designacao)}</td>
        <td>${p.categoria ? `<span class="badge badge-secondary">${escapeHtml(p.categoria)}</span>` : '—'}</td>
        <td>
          <span class="${low ? 'stock-low' : 'stock-ok'}">${p.quantidadeStock}</span>
          ${low ? '<span class="badge badge-danger" style="margin-left:.4rem">⚠️ Baixo</span>' : ''}
        </td>
        <td>${p.stockMinimo}</td>
        <td>${formatCurrency(p.precoUnitario)}</td>
        <td>${escapeHtml(p.fornecedor || '—')}</td>
        <td>
          <div class="table-actions">
            <button class="btn btn-secondary btn-sm" onclick="openEditPeca(${p.id})" title="Editar">✏️</button>
            <button class="btn btn-success btn-sm" onclick="openEntrada(${p.id}, '${escapeHtml(p.designacao)}')" title="Entrada Stock">📥</button>
            <button class="btn btn-warning btn-sm" onclick="openSaida(${p.id}, '${escapeHtml(p.designacao)}', ${p.quantidadeStock})" title="Saída Stock" ${p.quantidadeStock <= 0 ? 'disabled' : ''}>📤</button>
            <button class="btn btn-outline-danger btn-sm" onclick="deletePeca(${p.id}, '${escapeHtml(p.designacao)}')" title="Eliminar">🗑️</button>
          </div>
        </td>
      </tr>`;
  }).join('');
}

/* ── Create ── */
function openCreatePeca() {
  document.getElementById('modal-peca-title').textContent = 'Nova Peça';
  document.getElementById('form-peca').reset();
  document.getElementById('peca-id').value = '';
  
  const stockInput = document.getElementById('p-stock');
  if (stockInput) {
    stockInput.value = 0;
    stockInput.readOnly = false; // Permitir definir stock inicial na criação
    stockInput.style.backgroundColor = "";
    stockInput.title = "";
  }
  
  document.getElementById('p-stock-min').value = 5;
  showModal('modal-peca');
}

/* ── Edit ── */
function openEditPeca(id) {
  const p = allPecas.find(x => x.id === id);
  if (!p) return;
  document.getElementById('modal-peca-title').textContent = 'Editar Peça';
  document.getElementById('peca-id').value       = p.id;
  document.getElementById('p-referencia').value  = p.referencia || '';
  document.getElementById('p-designacao').value  = p.designacao || '';
  document.getElementById('p-categoria').value   = p.categoria || '';
  
  // BLOQUEIO PROFISSIONAL: O stock não pode ser editado manualmente aqui
  const stockInput = document.getElementById('p-stock');
  if (stockInput) {
    stockInput.value = p.quantidadeStock ?? 0;
    stockInput.readOnly = true; 
    stockInput.title = "O stock só pode ser alterado via Entrada/Saída de Stock";
    stockInput.style.backgroundColor = "var(--table-header-bg)";
  }

  document.getElementById('p-stock-min').value   = p.stockMinimo ?? 5;
  document.getElementById('p-preco').value       = p.precoUnitario ?? '';
  document.getElementById('p-fornecedor').value  = p.fornecedor || '';
  
  if (document.getElementById('p-localizacao')) document.getElementById('p-localizacao').value = p.localizacao || '';
  if (document.getElementById('p-descricao'))   document.getElementById('p-descricao').value   = p.descricao || '';
  
  showModal('modal-peca');
}

/* ── Submit create/edit ── */
async function submitPeca(e) {
  e.preventDefault();
  const id = document.getElementById('peca-id').value;
  
  const payload = {
    referencia:      document.getElementById('p-referencia').value.trim(),
    designacao:      document.getElementById('p-designacao').value.trim(),
    categoria:       document.getElementById('p-categoria').value.trim() || null,
    quantidadeStock: parseInt(document.getElementById('p-stock').value) || 0, 
    stockMinimo:     parseInt(document.getElementById('p-stock-min').value) || 0,
    precoUnitario:   parseFloat(document.getElementById('p-preco').value) || 0,
    fornecedor:      document.getElementById('p-fornecedor').value.trim() || null
  };
  
  try {
    if (id) {
      await api.updatePeca(id, payload);
      showToast('Peça atualizada!', 'success');
    } else {
      await api.createPeca(payload);
      showToast('Peça criada!', 'success');
    }
    hideModal('modal-peca');
    await Promise.allSettled([loadPecas(), loadAlertasStock()]);
  } catch (err) {
    showToast('Erro: ' + err.message, 'error');
  }
}

/* ── Delete ── */
async function deletePeca(id, nome) {
  const ok = await confirmDialog(`Eliminar peça "${nome}"? Esta ação não pode ser desfeita.`);
  if (!ok) return;
  try {
    await api.deletePeca(id);
    showToast('Peça eliminada.', 'success');
    await Promise.allSettled([loadPecas(), loadAlertasStock()]);
  } catch (err) {
    showToast('Erro: ' + err.message, 'error');
  }
}

/* ── Entrada de Stock ── */
function openEntrada(pecaId, nome) {
  document.getElementById('entrada-peca-id').value   = pecaId;
  document.getElementById('entrada-peca-nome').textContent = nome;
  document.getElementById('form-entrada').reset();
  document.getElementById('entrada-peca-id').value   = pecaId;
  document.getElementById('entrada-qty').value       = 1;
  showModal('modal-entrada');
}

async function submitEntrada(e) {
  e.preventDefault();
  const pecaId = document.getElementById('entrada-peca-id').value;
  const qty    = parseInt(document.getElementById('entrada-qty').value);
  const preco  = document.getElementById('entrada-preco').value;
  const obs    = document.getElementById('entrada-obs').value.trim();

  if (!qty || qty < 1) { showToast('Quantidade inválida.', 'warning'); return; }

  try {
    // Enviando campos que batem certo com o StockMovimentoRequest atualizado
    await api.entradaStock(pecaId, {
      quantidade:   qty,
      precoCusto:   preco ? parseFloat(preco) : null,
      observacoes:  obs || null,
    });
    showToast(`Entrada de ${qty} unidade(s) registada!`, 'success');
    hideModal('modal-entrada');
    await Promise.allSettled([loadPecas(), loadAlertasStock()]);
  } catch (err) {
    showToast('Erro: ' + err.message, 'error');
  }
}

/* ── Saída de Stock ── */
function openSaida(pecaId, nome, quantidadeStock) {
  document.getElementById('saida-peca-id').value           = pecaId;
  document.getElementById('saida-peca-nome').textContent   = nome;
  document.getElementById('saida-stock-atual').textContent = `Stock disponível: ${quantidadeStock}`;
  document.getElementById('saida-qty').value   = 1;
  document.getElementById('saida-qty').max     = quantidadeStock;
  document.getElementById('saida-obs').value   = '';
  showModal('modal-saida');
}

async function submitSaida(e) {
  e.preventDefault();
  const pecaId = document.getElementById('saida-peca-id').value;
  const qty    = parseInt(document.getElementById('saida-qty').value);
  const obs    = document.getElementById('saida-obs').value.trim();

  if (!qty || qty < 1) { showToast('Quantidade inválida.', 'warning'); return; }

  try {
    await api.saidaStock(pecaId, { quantidade: qty, observacoes: obs || null });
    showToast(`Saída de ${qty} unidade(s) registada!`, 'success');
    hideModal('modal-saida');
    await Promise.allSettled([loadPecas(), loadAlertasStock()]);
  } catch (err) {
    showToast('Erro: ' + err.message, 'error');
  }
}

/* ── Movimentos de Stock ── */
async function loadMovimentos(pecaId) {
  const content = document.getElementById('movimentos-content');
  if (!content) return;
  if (!pecaId) {
    content.innerHTML = `<div class="empty-state"><div class="empty-icon">📊</div><div class="empty-title">Selecione uma peça</div></div>`;
    return;
  }
  content.innerHTML = `<div class="loading-overlay"><div class="spinner"></div> A carregar…</div>`;
  try {
    const movimentos = await api.getMovimentosPeca(pecaId) || [];
    if (!movimentos.length) {
      content.innerHTML = `<div class="empty-state"><div class="empty-icon">📊</div><div class="empty-title">Sem movimentos registados</div></div>`;
      return;
    }
    content.innerHTML = `
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Data/Hora</th>
              <th>Tipo</th>
              <th>Quantidade</th>
              <th>Utilizador</th>
              <th>Observações</th>
            </tr>
          </thead>
          <tbody>
            ${movimentos.map(m => {
              const isEntrada = m.tipo === 'ENTRADA' || (m.quantidade && m.quantidade > 0);
              return `
                <tr>
                  <td>${formatDateTime(m.dataHora || m.createdAt)}</td>
                  <td>${isEntrada
                    ? '<span class="badge badge-success">📥 Entrada</span>'
                    : '<span class="badge badge-warning">📤 Saída</span>'}</td>
                  <td><strong class="${isEntrada ? 'text-success' : 'text-warning'}">${isEntrada ? '+' : '-'}${Math.abs(m.quantidade)}</strong></td>
                  <td>${escapeHtml(m.utilizador?.name || m.utilizador?.username || '—')}</td>
                  <td>${escapeHtml(m.observacoes || '—')}</td>
                </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>`;
  } catch (err) {
    content.innerHTML = `<div class="alert alert-danger"><span class="alert-icon">❌</span> ${escapeHtml(err.message)}</div>`;
  }
}