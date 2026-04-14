/* ========================================================
   SGO - logs.js  |  Activity Logs — Real DB via API
   ======================================================== */

'use strict';

let allLogs      = [];
let filteredLogs = [];

document.addEventListener('DOMContentLoaded', () => {
  if (!initProtectedPage(['MANAGER', 'RECEPTION', 'MECHANIC'])) return;
  loadLogs();
});

/* ── Load logs from REST API (real DB) ── */
async function loadLogs() {
  const tbody = document.getElementById('logs-tbody');
  if (tbody) tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:2rem"><div class="spinner"></div></td></tr>`;
  
  try {
    const severity  = document.getElementById('log-filter-severity')?.value || '';
    const source    = document.getElementById('log-filter-source')?.value   || '';
    const search    = document.getElementById('log-search')?.value          || '';
    const dateFrom  = document.getElementById('log-date-from')?.value       || '';
    const dateTo    = document.getElementById('log-date-to')?.value         || '';

    const params = new URLSearchParams();
    if (severity) params.set('severity', severity);
    if (source)   params.set('source',   source);
    if (search)   params.set('username', search);
    if (dateFrom) params.set('from', dateFrom + 'T00:00:00');
    if (dateTo)   params.set('to',   dateTo   + 'T23:59:59');
    params.set('limit', '300');

    const data = await api.getLogs(params.toString());
    allLogs      = data.logs      || [];
    filteredLogs = allLogs;
    
    // Aplicar filtro de pesquisa no texto (client-side)
    if (search) {
      filteredLogs = allLogs.filter(l =>
        (l.message  || '').toLowerCase().includes(search.toLowerCase()) ||
        (l.username || '').toLowerCase().includes(search.toLowerCase()) ||
        (l.source   || '').toLowerCase().includes(search.toLowerCase())
      );
    }

    renderLogs(filteredLogs);
    renderSummary(data);
    updateCount(filteredLogs.length, allLogs.length);
  } catch (err) {
    if (tbody) tbody.innerHTML = `
      <tr><td colspan="5">
        <div class="alert alert-danger" style="margin:1.5rem">
          ❌ Erro ao carregar logs: ${escapeHtml(err.message)}
          <br><small>Verifique se o servidor está a correr.</small>
        </div>
      </td></tr>`;
  }
}

/* ── Filter (client-side search supplement) ── */
function filterLogs() {
  // Re-load from API with new filters
  loadLogs();
}

/* ── Render logs table ── */
function renderLogs(logs) {
  const tbody = document.getElementById('logs-tbody');
  if (!tbody) return;

  if (logs.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5">
          <div class="empty-state">
            <div class="empty-icon">📋</div>
            <div class="empty-title">Sem registos</div>
            <div class="empty-desc">Não foram encontrados logs com os critérios selecionados.</div>
          </div>
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = logs.map(log => `
    <tr>
      <td><span class="log-timestamp">${formatLogTimestamp(log.timestamp)}</span></td>
      <td>${getSeverityBadge(log.severity)}</td>
      <td><span class="log-source">${escapeHtml(log.source)}</span></td>
      <td><span class="log-user">${escapeHtml(log.username || '—')}</span></td>
      <td>
        <span class="log-message">${escapeHtml(log.message)}</span>
        ${log.entityType ? `<small style="color:var(--text-secondary);display:block;margin-top:.25rem;">${escapeHtml(log.entityType)} #${log.entityId || ''}</small>` : ''}
      </td>
    </tr>
  `).join('');
}

/* ── Render summary stats ── */
function renderSummary(data) {
  const container = document.getElementById('logs-summary');
  if (!container) return;

  const stats = [
    { label: 'INFO',    icon: 'ℹ️', cls: 'log-severity-info',    count: data.info    || 0 },
    { label: 'SUCESSO', icon: '✅', cls: 'log-severity-success', count: data.success || 0 },
    { label: 'AVISO',   icon: '⚠️', cls: 'log-severity-warning', count: data.warning || 0 },
    { label: 'ERRO',    icon: '❌', cls: 'log-severity-error',   count: data.error   || 0 },
    { label: 'TOTAL',   icon: '📊', cls: 'log-severity-debug',   count: data.total   || 0 },
  ];

  container.innerHTML = stats.map(s => `
    <div class="log-stat">
      <span class="log-severity ${s.cls}">${s.icon} ${s.label}</span>
      <span class="log-stat-count">${s.count}</span>
    </div>
  `).join('');
}

/* ── Update count label ── */
function updateCount(shown, total) {
  const el = document.getElementById('log-count');
  if (el) {
    el.textContent = `${shown} de ${total} registo${total !== 1 ? 's' : ''}`;
  }
}

/* ── Severity badge helper ── */
function getSeverityBadge(severity) {
  const map = {
    INFO:    '<span class="log-severity log-severity-info">ℹ️ INFO</span>',
    SUCCESS: '<span class="log-severity log-severity-success">✅ SUCESSO</span>',
    WARNING: '<span class="log-severity log-severity-warning">⚠️ AVISO</span>',
    ERROR:   '<span class="log-severity log-severity-error">❌ ERRO</span>',
    DEBUG:   '<span class="log-severity log-severity-debug">🔍 DEBUG</span>',
  };
  return map[severity] || `<span class="log-severity log-severity-debug">${escapeHtml(severity)}</span>`;
}

/* ── Format timestamp ── */
function formatLogTimestamp(isoStr) {
  if (!isoStr) return '—';
  const d = new Date(isoStr);
  if (isNaN(d)) return isoStr;
  const pad = n => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/* ── Clear all logs from DB (só MANAGER) ── */
async function clearLogs() {
  const ok = await confirmDialog('Tem a certeza que deseja limpar TODOS os logs da base de dados?', 'Limpar Logs', '⚠️');
  if (!ok) return;
  try {
    await api.deleteLogs();
    showToast('Logs limpos com sucesso.', 'success');
    loadLogs();
  } catch (err) {
    showToast('Erro ao limpar logs: ' + err.message, 'error');
  }
}
