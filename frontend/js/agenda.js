/* ========================================================
   SGO - agenda.js  |  Weekly Calendar & Bookings
   ======================================================== */

'use strict';

const MAX_SLOTS    = 3;      // max bookings per hour slot
const START_HOUR   = 8;
const END_HOUR     = 18;
const DAY_NAMES    = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

let currentWeekStart = getMonday(new Date());
let agendaData       = [];      // raw API response
let clientes         = [];
let mecanicos        = [];
let currentAgId      = null;    // currently viewed agendamento id

document.addEventListener('DOMContentLoaded', async () => {
  if (!initProtectedPage(['MANAGER', 'RECEPTION'])) return;
  await Promise.allSettled([loadClientes(), loadMecanicos()]);
  await loadAgenda();
});

/* ── Week Navigation ── */
function prevWeek() { currentWeekStart = addDays(currentWeekStart, -7); loadAgenda(); }
function nextWeek() { currentWeekStart = addDays(currentWeekStart,  7); loadAgenda(); }
function goToToday()  { currentWeekStart = getMonday(new Date()); loadAgenda(); }

function updateWeekLabel() {
  const start = currentWeekStart;
  const end   = addDays(start, 5);
  const label = document.getElementById('week-label');
  if (!label) return;
  const fmt = d => d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' });
  const yr  = end.getFullYear();
  label.textContent = `${fmt(start)} – ${fmt(end)} de ${yr}`;
}

/* ── Load Agenda from API ── */
async function loadAgenda() {
  updateWeekLabel();
  const grid = document.getElementById('calendar-grid');
  if (!grid) return;
  grid.innerHTML = `<div class="loading-overlay"><div class="spinner"></div> A carregar…</div>`;

  try {
    const dateStr = toInputDate(currentWeekStart);
    const data    = await api.getAgendaSemana(dateStr);
    agendaData    = Array.isArray(data) ? data : (data?.agendamentos || []);
    buildCalendar();
  } catch (err) {
    grid.innerHTML = `
      <div class="alert alert-danger" style="margin:1.5rem">
        <span class="alert-icon">❌</span> Erro ao carregar agenda: ${escapeHtml(err.message)}
      </div>`;
  }
}

/* ── Build Calendar Grid ── */
function buildCalendar() {
  const grid = document.getElementById('calendar-grid');
  if (!grid) return;

  const today = new Date();

  // Build header
  let html = `<div class="calendar-header-row">
    <div class="cal-header-cell"></div>`;
  for (let d = 0; d < 6; d++) {
    const day  = addDays(currentWeekStart, d);
    const isTd = isSameDay(day, today);
    html += `
      <div class="cal-header-cell ${isTd ? 'today' : ''}">
        ${DAY_NAMES[d]}<span class="cal-date">${day.getDate()}</span>
      </div>`;
  }
  html += `</div><div class="calendar-body">`;

  // Build time rows
  for (let h = START_HOUR; h < END_HOUR; h++) {
    html += `<div class="calendar-row">
      <div class="cal-time">${String(h).padStart(2,'0')}:00</div>`;

    // VERIFICAÇÃO DA HORA DE ALMOÇO
    if (h === 13) {
      html += `
        <div class="cal-slot lunch-break" style="grid-column: span 6; background: rgba(0,0,0,0.15); color: var(--text-secondary); display: flex; align-items: center; justify-content: center; font-weight: 800; letter-spacing: 2px; cursor: not-allowed; text-transform: uppercase; border-right: 1px solid var(--border);">
          🍽️ Hora de Almoço - Fechado
        </div>
      `;
    } else {
      // HORAS NORMAIS DE TRABALHO
      for (let d = 0; d < 6; d++) {
        const slotDay   = addDays(currentWeekStart, d);
        const slotAppts = getSlotAppointments(slotDay, h);
        const count     = slotAppts.length;
        const isPast    = isPastSlot(slotDay, h);
        html += buildSlotCell(slotDay, h, count, slotAppts, isPast);
      }
    }
    
    html += `</div>`;
  }
  html += `</div>`;
  grid.innerHTML = html;
}

/* ── Get appointments for a day+hour ── */
function getSlotAppointments(day, hour) {
  return agendaData.filter(ag => {
    if (!ag.dataHoraInicio) return false;
    const dt = new Date(ag.dataHoraInicio);
    return isSameDay(dt, day) && dt.getHours() === hour && ag.estado !== 'CANCELADO';
  });
}

function isPastSlot(day, hour) {
  const now = new Date();
  const slotEnd = new Date(day);
  slotEnd.setHours(hour + 1, 0, 0, 0);
  return slotEnd < now;
}

/* ── Build a single slot cell ── */
function buildSlotCell(day, hour, count, appts, isPast) {
  const dateStr = toInputDate(day);
  const full    = count >= MAX_SLOTS;
  let cls = 'cal-slot ';
  if (isPast)      cls += 'slot-past';
  else if (full)   cls += 'slot-full';
  else if (count === 2) cls += 'slot-busy';
  else if (count === 1) cls += 'slot-partial';
  else             cls += 'slot-empty';

  const countLabel = `${count}/${MAX_SLOTS}`;
  const badge = full ? '<span class="slot-badge">CHEIO</span>' :
                count > 0 ? `<span class="slot-badge">${count} marcação${count > 1 ? 'ões' : ''}</span>` :
                '<span class="slot-badge">Livre</span>';

  const clickHandler = isPast
    ? ''
    : full
      ? `onclick="showSlotInfo('${dateStr}',${hour})"`
      : `onclick="openCreateModal('${dateStr}','${String(hour).padStart(2,'0')}:00')"`; 

  const apptHtml = appts.map(a => {
    const name = escapeHtml(a.cliente?.nome || a.viatura?.matricula || `#${a.id}`);
    return `<div class="slot-appt" onclick="event.stopPropagation(); viewAgendamento(${a.id})" title="${name}">${name}</div>`;
  }).join('');

  return `
    <div class="${cls}" ${clickHandler}>
      <span class="slot-count">${countLabel}</span>
      ${badge}
      ${apptHtml ? `<div class="slot-appointments">${apptHtml}</div>` : ''}
    </div>`;
}

/* ── Show info for a full slot ── */
function showSlotInfo(date, hour) {
  const day   = new Date(date + 'T00:00:00');
  const appts = getSlotAppointments(day, hour);
  showToast(
    `Slot ${String(hour).padStart(2,'0')}:00 – ${date} está cheio (${appts.length}/${MAX_SLOTS} marcações).`,
    'warning'
  );
}

/* ── View agendamento detail ── */
async function viewAgendamento(id) {
  currentAgId = id;
  try {
    const ag   = agendaData.find(a => a.id === id);
    const body = document.getElementById('modal-view-agenda-body');
    if (!body) return;

    body.innerHTML = `
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">Data/Hora Início</span>
          <span class="info-value">${formatDateTime(ag?.dataHoraInicio)}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Data/Hora Fim</span>
          <span class="info-value">${formatDateTime(ag?.dataHoraFim)}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Cliente</span>
          <span class="info-value">${escapeHtml(ag?.cliente?.nome || '—')}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Viatura</span>
          <span class="info-value">${escapeHtml(ag?.viatura?.matricula || '—')} ${escapeHtml(ag?.viatura?.marca || '')} ${escapeHtml(ag?.viatura?.modelo || '')}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Mecânico</span>
          <span class="info-value">${escapeHtml(ag?.mecanico?.name || 'Não atribuído')}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Tipo</span>
          <span class="info-value">${escapeHtml(ag?.tipoServico || '—')}</span>
        </div>
        <div class="info-item" style="grid-column:1/-1">
          <span class="info-label">Estado</span>
          <span class="info-value">${getStatusBadge(ag?.estado || '')}</span>
        </div>
        ${ag?.observacoes ? `
          <div class="info-item" style="grid-column:1/-1">
            <span class="info-label">Observações</span>
            <span class="info-value">${escapeHtml(ag.observacoes)}</span>
          </div>` : ''}
      </div>`;
    showModal('modal-view-agenda');
  } catch (err) {
    showToast('Erro ao carregar marcação: ' + err.message, 'error');
  }
}

function editCurrentAgendamento() {
  if (!currentAgId) return;
  const ag = agendaData.find(a => a.id === currentAgId);
  if (!ag) return;
  hideModal('modal-view-agenda');
  openEditModal(ag);
}

/* ── Open Create Modal ── */
function openCreateModal(dateStr, timeStr) {
  document.getElementById('modal-agenda-title').textContent = 'Nova Marcação';
  document.getElementById('form-agenda').reset();
  document.getElementById('ag-id').value = '';
  document.getElementById('btn-cancelar-ag').classList.add('hidden');
  document.getElementById('ag-viatura').innerHTML = '<option value="">Selecionar cliente primeiro…</option>';

  if (dateStr) document.getElementById('ag-data').value = dateStr;
  if (timeStr) {
    document.getElementById('ag-hora-inicio').value = timeStr;
    const [h] = timeStr.split(':').map(Number);
    if (h < END_HOUR) {
      // Impede que acabe automaticamente na hora de almoço, empurrando para as 14h
      let endH = h + 1;
      if (endH === 13) endH = 14; 
      document.getElementById('ag-hora-fim').value = `${String(endH).padStart(2,'0')}:00`;
    }
  }
  populateClientesSelect();
  populateMecanicosSelect();
  showModal('modal-agenda');
}

/* ── Open Edit Modal ── */
function openEditModal(ag) {
  document.getElementById('modal-agenda-title').textContent = 'Editar Marcação';
  document.getElementById('ag-id').value = ag.id;
  document.getElementById('btn-cancelar-ag').classList.remove('hidden');

  const inicio = ag.dataHoraInicio ? new Date(ag.dataHoraInicio) : null;
  const fim    = ag.dataHoraFim    ? new Date(ag.dataHoraFim)    : null;
  const pad    = n => String(n).padStart(2, '0');

  if (inicio) {
    document.getElementById('ag-data').value        = toInputDate(inicio);
    document.getElementById('ag-hora-inicio').value = `${pad(inicio.getHours())}:${pad(inicio.getMinutes())}`;
  }
  if (fim) {
    document.getElementById('ag-hora-fim').value = `${pad(fim.getHours())}:${pad(fim.getMinutes())}`;
  }

  document.getElementById('ag-tipo').value   = ag.tipoServico || '';
  document.getElementById('ag-estado').value = ag.estado || 'AGENDADO';
  document.getElementById('ag-obs').value    = ag.observacoes || '';

  populateClientesSelect(ag.cliente?.id);
  populateMecanicosSelect(ag.mecanico?.id);

  if (ag.cliente?.id) {
    loadClienteViaturas(ag.viatura?.id);
  }
  showModal('modal-agenda');
}

/* ── Populate selects ── */
function populateClientesSelect(selectedId) {
  const sel = document.getElementById('ag-cliente');
  if (!sel) return;
  sel.innerHTML = '<option value="">Selecionar…</option>' +
    clientes.map(c =>
      `<option value="${c.id}" ${c.id == selectedId ? 'selected' : ''}>${escapeHtml(c.nome)} – ${escapeHtml(c.nif || '')}</option>`
    ).join('');
}

function populateMecanicosSelect(selectedId) {
  const sel = document.getElementById('ag-mecanico');
  if (!sel) return;
  sel.innerHTML = '<option value="">Não atribuído</option>' +
    mecanicos.map(m =>
      `<option value="${m.id}" ${m.id == selectedId ? 'selected' : ''}>${escapeHtml(m.name || m.username)}</option>`
    ).join('');
}

async function loadClienteViaturas(preselect) {
  const clienteId = document.getElementById('ag-cliente').value;
  const sel       = document.getElementById('ag-viatura');
  if (!sel) return;
  if (!clienteId) {
    sel.innerHTML = '<option value="">Selecionar cliente primeiro…</option>';
    return;
  }
  try {
    const viaturas = await api.getClienteViaturas(clienteId);
    sel.innerHTML = '<option value="">Selecionar viatura…</option>' +
      (viaturas || []).map(v =>
        `<option value="${v.id}" ${v.id == preselect ? 'selected' : ''}>${escapeHtml(v.matricula)} – ${escapeHtml(v.marca)} ${escapeHtml(v.modelo)}</option>`
      ).join('');
  } catch {
    sel.innerHTML = '<option value="">Erro ao carregar viaturas</option>';
  }
}

/* ── Load supporting data ── */
async function loadClientes() {
  try { clientes = await api.getClientes() || []; }
  catch { clientes = []; }
}

async function loadMecanicos() {
  try { mecanicos = await api.getMecanicos() || []; }
  catch { mecanicos = []; }
}

/* ── Submit agendamento ── */
async function submitAgendamento(e) {
  e.preventDefault();
  const id       = document.getElementById('ag-id').value;
  const data     = document.getElementById('ag-data').value;
  const hInicio  = document.getElementById('ag-hora-inicio').value;
  const hFim     = document.getElementById('ag-hora-fim').value;
  const tipo     = document.getElementById('ag-tipo').value;
  const clienteId = document.getElementById('ag-cliente').value;
  const viaturaId = document.getElementById('ag-viatura').value;
  const mecId    = document.getElementById('ag-mecanico').value;
  const estado   = document.getElementById('ag-estado').value;
  const obs      = document.getElementById('ag-obs').value.trim();

  if (hInicio >= hFim) { showToast('A hora de início deve ser anterior à hora de fim.', 'warning'); return; }
  
  // Bloquear gravação se tentar sobrepor a hora de almoço (ex: 13:00)
  const hInicioNum = parseInt(hInicio.split(':')[0]);
  const hFimNum = parseInt(hFim.split(':')[0]);
  if ((hInicioNum <= 13 && hFimNum > 13) || hInicioNum === 13) {
      showToast('Atenção: Não pode marcar serviços a sobrepor a hora de almoço (13:00 - 14:00).', 'error');
      return;
  }

  const payload = {
    dataHoraInicio: `${data}T${hInicio}:00`,
    dataHoraFim:    `${data}T${hFim}:00`,
    tipoServico:    tipo,
    clienteId:      parseInt(clienteId),
    viaturaId:      parseInt(viaturaId),
    mecanicoId:     mecId ? parseInt(mecId) : null,
    estado,
    observacoes:    obs || null,
  };

  try {
    if (id) {
      await api.updateAgendamento(id, payload);
      showToast('Marcação atualizada!', 'success');
    } else {
      await api.createAgendamento(payload);
      showToast('Marcação criada com sucesso!', 'success');
    }
    hideModal('modal-agenda');
    await loadAgenda();
  } catch (err) {
    showToast('Erro: ' + err.message, 'error');
  }
}

/* ── Cancel agendamento ── */
async function cancelarAgendamento() {
  const id = document.getElementById('ag-id').value;
  if (!id) return;
  const ok = await confirmDialog('Cancelar esta marcação?');
  if (!ok) return;
  try {
    await api.cancelarAgendamento(id);
    showToast('Marcação cancelada.', 'success');
    hideModal('modal-agenda');
    await loadAgenda();
  } catch (err) {
    showToast('Erro: ' + err.message, 'error');
  }
}