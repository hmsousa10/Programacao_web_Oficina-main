/* ========================================================
   SGO - pecas.js  |  Armazém (Com Delete e Alertas de Stock)
   ======================================================== */

'use strict';

let allPecas    = [];
let filteredPecas = [];

// Paginação
let currentPage = 1;
const itemsPerPage = 10;
let showOnlyAlerts = false; // Estado do nosso botão novo!

document.addEventListener('DOMContentLoaded', () => {
  if (!initProtectedPage(['MANAGER', 'ADMIN', 'MECHANIC', 'RECEPTION'])) return;
  loadData();
});

async function loadData() {
  try {
    allPecas = await api.getPecas() || [];
    
    const catSelect = document.getElementById('category-filter');
    const categoriasUnicas = [...new Set(allPecas.map(p => p.categoria).filter(c => c))];
    
    catSelect.innerHTML = '<option value="">Todas as Secções</option>';
    categoriasUnicas.forEach(cat => {
        catSelect.innerHTML += `<option value="${escapeHtml(cat)}">${escapeHtml(cat)}</option>`;
    });

    updateKPIs();
    renderTable();
  } catch (err) {
    document.getElementById('table-body').innerHTML = `<tr><td colspan="6" class="text-center text-danger">Erro a carregar dados</td></tr>`;
  }
}

function updateKPIs() {
    document.getElementById('kpi-total-pecas').textContent = allPecas.length;
    document.getElementById('kpi-alertas').textContent = allPecas.filter(p => p.quantidadeStock <= p.stockMinimo).length;
}

// NOVO: Função para o Botão de Alertas!
function toggleAlertFilter() {
    showOnlyAlerts = !showOnlyAlerts;
    const btn = document.getElementById('btn-filter-alerts');
    
    if (showOnlyAlerts) {
        btn.className = 'btn btn-danger';
        btn.innerHTML = '🛑 Remover Filtro';
    } else {
        btn.className = 'btn btn-outline-danger';
        btn.innerHTML = '⚠️ Ver Alertas';
    }
    
    currentPage = 1;
    renderTable();
}

function renderTable() {
  const tbody = document.getElementById('table-body');
  if (!tbody) return;

  const searchQuery = document.getElementById('search-input').value.toLowerCase();
  const selectedCategory = document.getElementById('category-filter').value;

  filteredPecas = allPecas.filter(p => {
    const matchBusca = (p.designacao && p.designacao.toLowerCase().includes(searchQuery)) ||
                       (p.referencia && p.referencia.toLowerCase().includes(searchQuery));
    const matchCat = selectedCategory ? p.categoria === selectedCategory : true;
    const matchAlert = showOnlyAlerts ? p.quantidadeStock <= p.stockMinimo : true; // Lógica do Alerta

    return matchBusca && matchCat && matchAlert;
  });

  const totalPages = Math.ceil(filteredPecas.length / itemsPerPage) || 1;
  if (currentPage > totalPages) currentPage = totalPages;
  
  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const pageItems = filteredPecas.slice(start, end);

  document.getElementById('page-info').textContent = `Página ${currentPage} de ${totalPages}`;
  document.getElementById('btn-prev').disabled = currentPage === 1;
  document.getElementById('btn-next').disabled = currentPage === totalPages;

  if (pageItems.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted" style="padding: 2rem;">Nenhuma peça encontrada.</td></tr>`;
    return;
  }

  tbody.innerHTML = pageItems.map(p => {
    let stockClass = 'stock-good';
    if (p.quantidadeStock <= 0) stockClass = 'stock-danger';
    else if (p.quantidadeStock <= p.stockMinimo) stockClass = 'stock-warning';

    return `
    <tr>
      <td><strong><code>${escapeHtml(p.referencia)}</code></strong></td>
      <td><span class="badge badge-secondary">${escapeHtml(p.categoria || 'Sem secção')}</span></td>
      <td>${escapeHtml(p.designacao)}</td>
      <td>${formatCurrency(p.precoUnitario)}</td>
      <td><span class="stock-badge ${stockClass}">${p.quantidadeStock}</span></td>
      <td class="text-center" style="display:flex; justify-content:center; gap:5px;">
        <button class="btn btn-outline-secondary btn-sm" onclick="openHistorico(${p.id})" title="Ver Movimentos">📜 Histórico</button>
        <button class="btn btn-outline-primary btn-sm" onclick="openMovimento(${p.id}, '${escapeHtml(p.designacao)}', ${p.quantidadeStock})">📦 Stock</button>
        <button class="btn btn-secondary btn-sm" onclick="openEditModal(${p.id})" title="Editar">✏️</button>
        <button class="btn btn-outline-danger btn-sm" onclick="deleteItem(${p.id}, '${escapeHtml(p.referencia)}')" title="Eliminar Peça">🗑️</button>
      </td>
    </tr>
  `}).join('');
}

function prevPage() { if (currentPage > 1) { currentPage--; renderTable(); } }
function nextPage() { const total = Math.ceil(filteredPecas.length / itemsPerPage); if (currentPage < total) { currentPage++; renderTable(); } }

/* --- HISTÓRICO --- */
function openHistorico(id) {
  const p = allPecas.find(x => x.id === id);
  if (!p) return;
  
  document.getElementById('hist-peca-desc').textContent = `${p.designacao} (Ref: ${p.referencia})`;
  const tbody = document.getElementById('hist-body');
  
  if (!p.movimentos || p.movimentos.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:20px; color:#94a3b8;">Sem histórico registado.</td></tr>`;
  } else {
      const movsOrdenados = p.movimentos.sort((a,b) => new Date(b.dataMovimento) - new Date(a.dataMovimento));
      
      tbody.innerHTML = movsOrdenados.map(m => {
          const d = new Date(m.dataMovimento);
          const dataFormat = d.toLocaleDateString('pt-PT') + ' ' + d.toLocaleTimeString('pt-PT', {hour:'2-digit', minute:'2-digit'});
          const isEntrada = m.tipoMovimento === 'ENTRADA';
          
          return `
          <tr>
            <td style="font-size:13px; color:#64748b;">${dataFormat}</td>
            <td class="${isEntrada ? 'mov-entrada' : 'mov-saida'}">${isEntrada ? '📥 Entrada' : '📤 Saída'}</td>
            <td style="font-weight:bold; font-size:16px;">${m.quantidade > 0 ? '+'+m.quantidade : m.quantidade}</td>
            <td style="font-size:13px;">${escapeHtml(m.observacoes || '—')}</td>
          </tr>
          `;
      }).join('');
  }
  showModal('modal-historico');
}

/* --- CRUD DA PEÇA --- */
function toggleOutrosCategoria() {
  const select = document.getElementById('item-categoria');
  const input = document.getElementById('item-categoria-outros');
  if (select.value === 'Outros') {
      input.style.display = 'block';
      input.required = true;
  } else {
      input.style.display = 'none';
      input.required = false;
  }
}

function openCreateModal() {
  document.getElementById('modal-title').textContent = 'Adicionar Nova Peça';
  document.getElementById('data-form').reset();
  document.getElementById('item-id').value = '';
  document.getElementById('item-stock').disabled = false;
  document.getElementById('item-categoria-outros').style.display = 'none';
  showModal('modal-form');
}

function openEditModal(id) {
  const p = allPecas.find(x => x.id === id);
  if (!p) return;
  document.getElementById('modal-title').textContent = 'Editar Peça';
  document.getElementById('item-id').value = p.id;
  document.getElementById('item-ref').value = p.referencia || '';
  
  const catSelect = document.getElementById('item-categoria');
  const inputOutros = document.getElementById('item-categoria-outros');
  
  let found = false;
  for (let i = 0; i < catSelect.options.length; i++) {
      if (catSelect.options[i].value === p.categoria) {
          found = true; break;
      }
  }
  
  if (p.categoria && !found) {
      catSelect.value = 'Outros';
      inputOutros.style.display = 'block';
      inputOutros.value = p.categoria;
  } else {
      catSelect.value = p.categoria || '';
      inputOutros.style.display = 'none';
  }
  
  document.getElementById('item-desc').value = p.designacao || '';
  document.getElementById('item-stock').value = p.quantidadeStock || 0;
  document.getElementById('item-stock').disabled = true;
  document.getElementById('item-minimo').value = p.stockMinimo || 0;
  document.getElementById('item-preco').value = p.precoUnitario || 0;
  showModal('modal-form');
}

async function submitForm(e) {
  e.preventDefault();
  const id = document.getElementById('item-id').value;
  
  let cat = document.getElementById('item-categoria').value.trim();
  if (cat === 'Outros') {
      cat = document.getElementById('item-categoria-outros').value.trim(); 
  }

  const payload = {
    referencia: document.getElementById('item-ref').value.trim(),
    categoria: cat,
    designacao: document.getElementById('item-desc').value.trim(),
    stockMinimo: parseInt(document.getElementById('item-minimo').value) || 0,
    precoUnitario: parseFloat(document.getElementById('item-preco').value) || 0
  };
  
  if (!id) payload.quantidadeStock = parseInt(document.getElementById('item-stock').value) || 0;

  try {
    if (id) await api.updatePeca(id, payload);
    else await api.createPeca(payload);
    showToast(id ? 'Peça atualizada!' : 'Peça criada!', 'success');
    hideModal('modal-form');
    loadData();
  } catch (err) { showToast('Erro: ' + err.message, 'error'); }
}

// Apagar Corrigido
async function deleteItem(id, ref) {
  const ok = await confirmDialog(`Tem a certeza que deseja eliminar a referência ${ref}? Todo o histórico será perdido!`);
  if (!ok) return;
  try {
    await api.deletePeca(id);
    showToast('Peça eliminada com sucesso.', 'success');
    loadData();
  } catch (err) { showToast('Erro: ' + err.message, 'error'); }
}

/* --- MOVIMENTOS --- */
function openMovimento(id, desc, atual) {
  document.getElementById('form-movimento').reset();
  document.getElementById('mov-peca-id').value = id;
  document.getElementById('mov-peca-desc').textContent = desc;
  document.getElementById('mov-peca-atual').textContent = atual + ' un';
  selectMovimento('ENTRADA');
  showModal('modal-movimento');
}

function selectMovimento(tipo) {
  document.getElementById('btn-entrada').classList.remove('active');
  document.getElementById('btn-saida').classList.remove('active');
  document.getElementById('mov-tipo').value = tipo;
  const lbl = document.getElementById('lbl-quantidade');
  const btn = document.getElementById('btn-confirmar-mov');

  if (tipo === 'ENTRADA') {
    document.getElementById('btn-entrada').classList.add('active');
    lbl.textContent = 'Quantidade a Receber:';
    btn.textContent = 'Confirmar Entrada';
    btn.className = 'btn btn-primary';
  } else if (tipo === 'SAIDA') {
    document.getElementById('btn-saida').classList.add('active');
    lbl.textContent = 'Quantidade a Retirar:';
    btn.textContent = 'Confirmar Saída';
    btn.className = 'btn btn-warning';
  }
}

async function submitMovimento(e) {
  e.preventDefault();
  const pecaId = document.getElementById('mov-peca-id').value;
  const payload = {
    tipo: document.getElementById('mov-tipo').value,
    quantidade: parseInt(document.getElementById('mov-qtd').value),
    observacoes: document.getElementById('mov-obs').value.trim()
  };

  try {
    await api.registerMovimentoStock(pecaId, payload);
    showToast('Movimento registado!', 'success');
    hideModal('modal-movimento');
    loadData();
  } catch (err) { showToast('Erro: ' + err.message, 'error'); }
}