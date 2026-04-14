/* ========================================================
   SGO - faturas.js  |  Billing & Invoice Management
   ======================================================== */

'use strict';

let todasReparacoes = [];
let faturasFiltrado = [];
let chartMensal     = null;

document.addEventListener('DOMContentLoaded', async () => {
  if (!initProtectedPage(['MANAGER'])) return;
  startClock();
  await loadFaturas();
});

/* ── Carregar todas as reparações concluídas ── */
async function loadFaturas() {
  showTableLoading();
  try {
    const todas = await api.getReparacoes() || [];
    todasReparacoes = todas.filter(r => r.estado === 'CONCLUIDA');
    applyFiltros();
    renderGraficoMensal();
  } catch (err) {
    document.getElementById('faturas-tbody').innerHTML = `
      <tr><td colspan="7">
        <div class="alert alert-danger" style="margin:1rem">❌ Erro: ${escapeHtml(err.message)}</div>
      </td></tr>`;
  }
}

/* ── Aplicar filtros da UI ── */
function applyFiltros() {
  const searchVal = (document.getElementById('f-search')?.value || '').toLowerCase();
  const mesVal    = document.getElementById('f-mes')?.value || '';
  const anoVal    = document.getElementById('f-ano')?.value || '';
  const minVal    = parseFloat(document.getElementById('f-min')?.value) || 0;
  const maxVal    = parseFloat(document.getElementById('f-max')?.value) || Infinity;

  faturasFiltrado = todasReparacoes.filter(r => {
    if (searchVal) {
      const hay = `${r.clienteNome || ''} ${r.viaturaMatricula || ''} ${r.mecanicoNome || ''}`.toLowerCase();
      if (!hay.includes(searchVal)) return false;
    }
    if (mesVal || anoVal) {
      const d = r.dataFim ? new Date(r.dataFim) : null;
      if (!d) return false;
      if (mesVal && String(d.getMonth() + 1).padStart(2, '0') !== mesVal) return false;
      if (anoVal && String(d.getFullYear()) !== anoVal) return false;
    }
    const val = parseFloat(r.valorTotal) || 0;
    if (val < minVal || val > maxVal) return false;
    return true;
  });

  // Sort by dataFim desc
  faturasFiltrado.sort((a, b) => new Date(b.dataFim || 0) - new Date(a.dataFim || 0));

  renderFaturasTable();
  renderKpisFaturacao();
}

/* ── Render KPIs ── */
function renderKpisFaturacao() {
  const total     = faturasFiltrado.reduce((s, r) => s + (parseFloat(r.valorTotal) || 0), 0);
  const count     = faturasFiltrado.length;
  const media     = count > 0 ? total / count : 0;
  const semValor  = faturasFiltrado.filter(r => !r.valorTotal || parseFloat(r.valorTotal) === 0).length;

  const setEl = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  setEl('kpi-total-fat',  formatCurrency(total));
  setEl('kpi-count-fat',  count);
  setEl('kpi-media-fat',  formatCurrency(media));
  setEl('kpi-sem-valor',  semValor);
  setEl('faturas-count',  `${count} fatura${count !== 1 ? 's' : ''} encontrada${count !== 1 ? 's' : ''}`);
}

/* ── Render table ── */
function renderFaturasTable() {
  const tbody = document.getElementById('faturas-tbody');
  if (!tbody) return;

  if (!faturasFiltrado.length) {
    tbody.innerHTML = `
      <tr><td colspan="7">
        <div class="empty-state" style="padding:2rem">
          <div class="empty-icon">💰</div>
          <div class="empty-title">Sem faturas</div>
          <div class="empty-desc">Nenhuma reparação concluída com os filtros selecionados.</div>
        </div>
      </td></tr>`;
    return;
  }

  tbody.innerHTML = faturasFiltrado.map((r, idx) => {
    const num    = `FAT-${String(r.id).padStart(4, '0')}`;
    const val    = parseFloat(r.valorTotal) || 0;
    const semPag = val === 0;
    return `
      <tr>
        <td><code style="font-weight:700;color:var(--primary)">${num}</code></td>
        <td>${formatDate(r.dataFim || r.dataInicio)}</td>
        <td>
          <div style="font-weight:600">${escapeHtml(r.clienteNome || '—')}</div>
        </td>
        <td>
          <span style="font-family:monospace;font-weight:700;letter-spacing:1px">${escapeHtml(r.viaturaMatricula || '—')}</span>
          <div style="font-size:.75rem;color:var(--text-secondary)">${escapeHtml((r.viaturaMarca||'') + ' ' + (r.viaturaModelo||'')).trim()}</div>
        </td>
        <td>${escapeHtml(r.mecanicoNome || '—')}</td>
        <td>
          <span style="font-size:1.1rem;font-weight:800;color:${semPag ? '#ef4444' : 'var(--success)'}">
            ${semPag ? '<span class="badge badge-warning">Por lançar</span>' : formatCurrency(val)}
          </span>
        </td>
        <td>
          <button class="btn btn-outline-primary btn-sm" onclick="verDetalhe(${r.id})">📄 Ver</button>
          <button class="btn btn-secondary btn-sm" onclick="imprimirFatura(${r.id})">🖨️</button>
          ${semPag ? `<button class="btn btn-success btn-sm" onclick="lancarValor(${r.id})">💶 Lançar</button>` : ''}
        </td>
      </tr>`;
  }).join('');
}

function showTableLoading() {
  const tbody = document.getElementById('faturas-tbody');
  if (tbody) tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:2rem"><div class="spinner"></div></td></tr>`;
}

/* ── Modal: Ver Detalhe de Fatura ── */
async function verDetalhe(id) {
  const r = faturasFiltrado.find(x => x.id === id) || todasReparacoes.find(x => x.id === id);
  if (!r) return;

  const num    = `FAT-${String(r.id).padStart(4, '0')}`;
  const val    = parseFloat(r.valorTotal) || 0;
  const pecas  = r.pecasUsadas || [];
  const ops    = r.operacoes  || [];

  const modal  = document.getElementById('modal-fatura-body');
  if (!modal)  return;

  modal.innerHTML = `
    <div id="fatura-print-area">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;padding-bottom:1rem;border-bottom:2px solid var(--primary)">
        <div>
          <div style="font-size:1.5rem;font-weight:900;color:var(--primary)">🔧 SGO Oficina</div>
          <div style="color:var(--text-secondary);font-size:.85rem">Sistema de Gestão Profissional</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:1.2rem;font-weight:700">${num}</div>
          <div style="color:var(--text-secondary);font-size:.85rem">Data: ${formatDate(r.dataFim || r.dataInicio)}</div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;margin-bottom:1.5rem">
        <div>
          <div style="font-size:.7rem;text-transform:uppercase;letter-spacing:1px;color:var(--text-secondary);margin-bottom:.5rem">Cliente</div>
          <div style="font-weight:700;font-size:1rem">${escapeHtml(r.clienteNome || '—')}</div>
        </div>
        <div>
          <div style="font-size:.7rem;text-transform:uppercase;letter-spacing:1px;color:var(--text-secondary);margin-bottom:.5rem">Viatura</div>
          <div style="font-weight:700;font-family:monospace;font-size:1rem">${escapeHtml(r.viaturaMatricula || '—')}</div>
          <div style="font-size:.8rem;color:var(--text-secondary)">${escapeHtml((r.viaturaMarca||'')+' '+(r.viaturaModelo||'')).trim()}</div>
        </div>
        <div>
          <div style="font-size:.7rem;text-transform:uppercase;letter-spacing:1px;color:var(--text-secondary);margin-bottom:.5rem">Mecânico</div>
          <div style="font-weight:600">${escapeHtml(r.mecanicoNome || 'Não atribuído')}</div>
        </div>
        <div>
          <div style="font-size:.7rem;text-transform:uppercase;letter-spacing:1px;color:var(--text-secondary);margin-bottom:.5rem">Período</div>
          <div style="font-weight:600">${formatDateTime(r.dataInicio)} → ${formatDateTime(r.dataFim)}</div>
        </div>
      </div>

      ${r.descricao ? `<div style="background:var(--bg);padding:.75rem;border-radius:var(--radius);margin-bottom:1rem;font-size:.875rem"><strong>Descrição:</strong> ${escapeHtml(r.descricao)}</div>` : ''}

      ${ops.length ? `
        <h4 style="margin-bottom:.5rem">🔩 Operações Realizadas</h4>
        <table style="width:100%;border-collapse:collapse;margin-bottom:1rem;font-size:.875rem">
          <thead><tr style="background:var(--bg)">
            <th style="padding:.5rem;text-align:left">Descrição</th>
            <th style="padding:.5rem;text-align:center">Tempo Est.</th>
            <th style="padding:.5rem;text-align:center">Tempo Real</th>
            <th style="padding:.5rem;text-align:center">Estado</th>
          </tr></thead>
          <tbody>${ops.map(o => `
            <tr style="border-top:1px solid var(--border)">
              <td style="padding:.5rem">${escapeHtml(o.descricao)}</td>
              <td style="padding:.5rem;text-align:center">${o.tempoEstimadoMinutos ? formatDuration(o.tempoEstimadoMinutos) : '—'}</td>
              <td style="padding:.5rem;text-align:center">${o.tempoRealMinutos ? formatDuration(o.tempoRealMinutos) : '—'}</td>
              <td style="padding:.5rem;text-align:center">${getStatusBadge(o.estado)}</td>
            </tr>`).join('')}
          </tbody>
        </table>` : ''}

      ${pecas.length ? `
        <h4 style="margin-bottom:.5rem">📦 Materiais Utilizados</h4>
        <table style="width:100%;border-collapse:collapse;margin-bottom:1rem;font-size:.875rem">
          <thead><tr style="background:var(--bg)">
            <th style="padding:.5rem;text-align:left">Peça</th>
            <th style="padding:.5rem;text-align:center">Qtd</th>
            <th style="padding:.5rem;text-align:right">Preço Unit.</th>
            <th style="padding:.5rem;text-align:right">Subtotal</th>
          </tr></thead>
          <tbody>${pecas.map(p => `
            <tr style="border-top:1px solid var(--border)">
              <td style="padding:.5rem">${escapeHtml(p.designacao || '—')}</td>
              <td style="padding:.5rem;text-align:center">${p.quantidade || 1}</td>
              <td style="padding:.5rem;text-align:right">${formatCurrency(p.precoUnitario || 0)}</td>
              <td style="padding:.5rem;text-align:right">${formatCurrency((p.precoUnitario || 0) * (p.quantidade || 1))}</td>
            </tr>`).join('')}
          </tbody>
        </table>` : ''}

      <div style="text-align:right;padding-top:1rem;border-top:2px solid var(--border)">
        <div style="font-size:.85rem;color:var(--text-secondary)">Total a Pagar</div>
        <div style="font-size:2rem;font-weight:900;color:var(--primary)">${formatCurrency(val)}</div>
        ${val === 0 ? '<div style="color:#ef4444;font-size:.8rem">⚠️ Valor não lançado</div>' : ''}
      </div>
    </div>
  `;
  showModal('modal-fatura');
}

/* ── Imprimir Fatura ── */
function imprimirFatura(id) {
  verDetalhe(id).then(() => {
    setTimeout(() => window.print(), 600);
  });
}

/* ── Lançar Valor ── */
async function lancarValor(id) {
  const r = todasReparacoes.find(x => x.id === id);
  if (!r) return;
  const val = prompt(`Introduza o valor total da reparação #${id} em €:`);
  if (val === null) return;
  const num = parseFloat(val.replace(',', '.'));
  if (isNaN(num) || num < 0) { showToast('Valor inválido.', 'error'); return; }
  try {
    await api.updateReparacao(id, {
      clienteId:  r.clienteId,
      viaturaId:  r.viaturaId,
      mecanicoId: r.mecanicoId || null,
      valorTotal: num,
    });
    showToast(`Valor de ${formatCurrency(num)} lançado com sucesso!`, 'success');
    loadFaturas();
  } catch (err) {
    showToast('Erro: ' + err.message, 'error');
  }
}

/* ── Gráfico de Evolução Mensal ── */
function renderGraficoMensal() {
  const canvas = document.getElementById('chart-mensal');
  if (!canvas) return;

  // Agrupar por mês/ano dos últimos 12 meses
  const now = new Date();
  const labels = [];
  const valores = [];

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mes = d.toLocaleDateString('pt-PT', { month: 'short', year: '2-digit' });
    labels.push(mes);
    const total = todasReparacoes
      .filter(r => {
        if (!r.dataFim) return false;
        const df = new Date(r.dataFim);
        return df.getMonth() === d.getMonth() && df.getFullYear() === d.getFullYear();
      })
      .reduce((s, r) => s + (parseFloat(r.valorTotal) || 0), 0);
    valores.push(Math.round(total * 100) / 100);
  }

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  if (chartMensal) chartMensal.destroy();

  chartMensal = new Chart(canvas.getContext('2d'), {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Faturação (€)',
        data: valores,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59,130,246,.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#3b82f6',
        pointRadius: 5,
        pointHoverRadius: 8,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: isDark ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.05)' },
          ticks: { color: isDark ? '#94a3b8' : '#64748b', callback: v => '€' + v }
        },
        x: {
          grid: { display: false },
          ticks: { color: isDark ? '#94a3b8' : '#64748b' }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: { label: ctx => ` ${formatCurrency(ctx.raw)}` }
        }
      }
    }
  });
}
