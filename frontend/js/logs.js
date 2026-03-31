/* ========================================================
   SGO - logs.js  |  Activity Logs Viewer
   ======================================================== */

'use strict';

const LOG_STORAGE_KEY = 'sgo_logs';
const MAX_LOGS = 500;

let allLogs      = [];
let filteredLogs = [];

document.addEventListener('DOMContentLoaded', () => {
  if (!initProtectedPage(['MANAGER', 'RECEPTION', 'MECHANIC'])) return;
  seedDemoLogs();
  loadLogs();
});

/* ── Load logs from localStorage ── */
function loadLogs() {
  const stored = localStorage.getItem(LOG_STORAGE_KEY);
  allLogs = stored ? JSON.parse(stored) : [];
  allLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  filterLogs();
}

/* ── Save logs to localStorage ── */
function saveLogs() {
  if (allLogs.length > MAX_LOGS) {
    allLogs = allLogs.slice(0, MAX_LOGS);
  }
  localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(allLogs));
}

/* ── Add a log entry (can be called from other modules) ── */
function addLog(severity, source, message, user) {
  const entry = {
    id: Date.now() + Math.random().toString(36).substring(2, 7),
    timestamp: new Date().toISOString(),
    severity: severity.toUpperCase(),
    source: source.toUpperCase(),
    message: message,
    user: user || getCurrentUserName()
  };
  allLogs.unshift(entry);
  saveLogs();
  return entry;
}

/* ── Get current user name helper ── */
function getCurrentUserName() {
  const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
  return user ? (user.name || user.username || 'Sistema') : 'Sistema';
}

/* ── Filter logs ── */
function filterLogs() {
  const search   = (document.getElementById('log-search')?.value || '').toLowerCase();
  const severity = document.getElementById('log-filter-severity')?.value || '';
  const source   = document.getElementById('log-filter-source')?.value || '';

  filteredLogs = allLogs.filter(log => {
    if (severity && log.severity !== severity) return false;
    if (source && log.source !== source) return false;
    if (search) {
      const haystack = `${log.message} ${log.user} ${log.source}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });

  renderLogs(filteredLogs);
  renderSummary();
  updateCount();
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
            <div class="empty-desc">Não foram encontrados logs com os filtros selecionados.</div>
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
      <td><span class="log-user">${escapeHtml(log.user)}</span></td>
      <td><span class="log-message">${escapeHtml(log.message)}</span></td>
    </tr>
  `).join('');
}

/* ── Render summary stats ── */
function renderSummary() {
  const container = document.getElementById('logs-summary');
  if (!container) return;

  const counts = { INFO: 0, SUCCESS: 0, WARNING: 0, ERROR: 0, DEBUG: 0 };
  allLogs.forEach(log => {
    if (counts[log.severity] !== undefined) counts[log.severity]++;
  });

  container.innerHTML = `
    <div class="log-stat">
      <span class="log-severity log-severity-info">ℹ️ INFO</span>
      <span class="log-stat-count">${counts.INFO}</span>
    </div>
    <div class="log-stat">
      <span class="log-severity log-severity-success">✅ SUCESSO</span>
      <span class="log-stat-count">${counts.SUCCESS}</span>
    </div>
    <div class="log-stat">
      <span class="log-severity log-severity-warning">⚠️ AVISO</span>
      <span class="log-stat-count">${counts.WARNING}</span>
    </div>
    <div class="log-stat">
      <span class="log-severity log-severity-error">❌ ERRO</span>
      <span class="log-stat-count">${counts.ERROR}</span>
    </div>
    <div class="log-stat">
      <span class="log-severity log-severity-debug">🔍 DEBUG</span>
      <span class="log-stat-count">${counts.DEBUG}</span>
    </div>
  `;
}

/* ── Update count label ── */
function updateCount() {
  const el = document.getElementById('log-count');
  if (el) {
    el.textContent = `${filteredLogs.length} de ${allLogs.length} registo${allLogs.length !== 1 ? 's' : ''}`;
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

/* ── Clear all logs ── */
async function clearLogs() {
  const ok = await confirmDialog('Tem a certeza que deseja limpar todos os logs?');
  if (!ok) return;
  allLogs = [];
  saveLogs();
  filterLogs();
  showToast('Logs limpos com sucesso.', 'success');
}

/* ── Seed demo logs (only if empty) ── */
function seedDemoLogs() {
  const stored = localStorage.getItem(LOG_STORAGE_KEY);
  if (stored && JSON.parse(stored).length > 0) return;

  const now = new Date();
  const demoLogs = [
    { severity: 'INFO',    source: 'SISTEMA',    message: 'Sistema SGO iniciado com sucesso.',                          user: 'Sistema',        offset: -1 },
    { severity: 'SUCCESS', source: 'AUTH',        message: 'Login efetuado com sucesso.',                                user: 'admin',          offset: -2 },
    { severity: 'INFO',    source: 'CLIENTES',    message: 'Novo cliente criado: João Silva (NIF: 123456789).',          user: 'admin',          offset: -5 },
    { severity: 'INFO',    source: 'VIATURAS',    message: 'Viatura registada: 00-AA-00 (BMW Série 3).',                 user: 'admin',          offset: -8 },
    { severity: 'SUCCESS', source: 'REPARACOES',  message: 'Reparação #1024 concluída com sucesso.',                     user: 'mec.carlos',     offset: -12 },
    { severity: 'WARNING', source: 'PECAS',       message: 'Stock baixo: Filtro de óleo (3 unidades restantes).',        user: 'Sistema',        offset: -15 },
    { severity: 'ERROR',   source: 'SISTEMA',     message: 'Falha na ligação à API externa de peças.',                   user: 'Sistema',        offset: -20 },
    { severity: 'INFO',    source: 'AGENDA',      message: 'Agendamento criado para 15/03/2026 às 10:00.',               user: 'rec.maria',      offset: -25 },
    { severity: 'SUCCESS', source: 'REPARACOES',  message: 'Operação "Troca de pastilhas" concluída em 45 minutos.',     user: 'mec.carlos',     offset: -30 },
    { severity: 'WARNING', source: 'AGENDA',      message: 'Capacidade máxima atingida para 16/03/2026 às 14:00.',       user: 'Sistema',        offset: -35 },
    { severity: 'DEBUG',   source: 'SISTEMA',     message: 'Cache de dados atualizado (tempo: 120ms).',                  user: 'Sistema',        offset: -40 },
    { severity: 'INFO',    source: 'CLIENTES',    message: 'Dados do cliente atualizado: Maria Santos.',                 user: 'rec.maria',      offset: -45 },
    { severity: 'ERROR',   source: 'AUTH',        message: 'Tentativa de login falhada para utilizador "teste".',        user: 'Sistema',        offset: -50 },
    { severity: 'SUCCESS', source: 'PECAS',       message: 'Entrada de stock: 20x Filtro de ar adicionados.',            user: 'admin',          offset: -55 },
    { severity: 'INFO',    source: 'VIATURAS',    message: 'Viatura 11-BB-22 associada ao cliente António Ferreira.',    user: 'rec.maria',      offset: -60 },
    { severity: 'WARNING', source: 'REPARACOES',  message: 'Reparação #1028 aguarda peças há mais de 48 horas.',        user: 'Sistema',        offset: -70 },
    { severity: 'DEBUG',   source: 'SISTEMA',     message: 'Limpeza automática de sessões expiradas concluída.',         user: 'Sistema',        offset: -80 },
    { severity: 'SUCCESS', source: 'AUTH',        message: 'Palavra-passe alterada com sucesso.',                        user: 'mec.carlos',     offset: -90 },
    { severity: 'INFO',    source: 'REPARACOES',  message: 'Nova reparação #1030 criada para viatura 33-CC-44.',         user: 'rec.maria',      offset: -100 },
    { severity: 'ERROR',   source: 'PECAS',       message: 'Erro ao processar requisição de peças: stock insuficiente.', user: 'mec.carlos',     offset: -110 },
  ];

  allLogs = demoLogs.map(log => ({
    id: Date.now() + Math.random().toString(36).substring(2, 7),
    timestamp: new Date(now.getTime() + log.offset * 60000).toISOString(),
    severity: log.severity,
    source: log.source,
    message: log.message,
    user: log.user,
  }));

  saveLogs();
}
