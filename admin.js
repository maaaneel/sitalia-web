/* ============================================================
   SITALIA — admin.js  v2  (Ausencias + Servicios)
   Lógica del panel de administración.
   Configuración por negocio: window.NEGOCIO_ID y window.NEGOCIO_NOMBRE
   deben definirse en el HTML antes de cargar este script.
   ============================================================ */
console.log('[admin.js] v2 cargado — Ausencias + Servicios activos');

/* ── Constantes y estado ──────────────────────────────── */
var NEGOCIO = window.NEGOCIO_ID || 'negocio';

var _token    = '';
var _view     = 'day';
var _baseDate = new Date();
var _workers  = [];                  // caché de trabajadores cargados

var DAYS_SHORT  = ['Lu','Ma','Mi','Ju','Vi','Sá','Do'];
var DAYS_LONG   = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
var MONTHS      = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
var MONTHS_LONG = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
var MONTHS_C    = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

/* ── Auth ─────────────────────────────────────────────── */
// Helpers para no repetir el header Authorization en cada fetch.
// Uso:
//   fetch(url, { headers: authHeaders() })                          → GET
//   fetch(url, { method:'POST', headers: authHeaders({json:true}),  → POST
//                body: JSON.stringify(payload) })
function authHeaders(opts) {
  var h = { 'Authorization': 'Bearer ' + _token };
  if (opts && opts.json) h['Content-Type'] = 'application/json';
  return h;
}

function login() {
  var pwd = document.getElementById('pwd-input').value.trim();
  if (!pwd) return;
  // Probamos el token con un GET inocuo. El token va en el header Authorization
  // — ya no en la query string para que no quede en logs/historial.
  fetch('/api/admin-reservas?negocio=' + NEGOCIO + '&fecha=' + isoDate(_baseDate), {
    headers: { 'Authorization': 'Bearer ' + pwd }
  })
    .then(function (r) {
      if (r.ok) {
        _token = pwd;
        sessionStorage.setItem('admin_token', pwd);
        document.getElementById('login-screen').style.display  = 'none';
        document.getElementById('admin-screen').style.display  = 'block';
        document.getElementById('fecha-input').value = isoDate(_baseDate);
        loadTodayStats();
        render();
      } else {
        document.getElementById('login-error').style.display = 'block';
      }
    })
    .catch(function () { document.getElementById('login-error').style.display = 'block'; });
}

function logout() {
  sessionStorage.removeItem('admin_token');
  _token = '';
  document.getElementById('admin-screen').style.display = 'none';
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('pwd-input').value = '';
}

(function autoLogin() {
  var saved = sessionStorage.getItem('admin_token');
  if (saved) { document.getElementById('pwd-input').value = saved; login(); }
})();

/* ── Helpers ──────────────────────────────────────────── */
function isoDate(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
function pad(n)     { return n < 10 ? '0' + n : '' + n; }
function enc(s)     { return encodeURIComponent(s); }
function fmt(m)     { var h = Math.floor(m / 60), mm = m % 60; return h + ':' + (mm < 10 ? '0' : '') + mm; }
function minsToTime(m) { return pad(Math.floor(m / 60)) + ':' + pad(m % 60); }
function timeToMins(t) { var p = t.split(':'); return parseInt(p[0]) * 60 + parseInt(p[1] || 0); }
function addDays(d, n) { var r = new Date(d); r.setDate(r.getDate() + n); return r; }
function weekStart(d) {
  var r = new Date(d), dow = r.getDay();
  r.setDate(r.getDate() + (dow === 0 ? -6 : 1 - dow));
  return r;
}
function isToday(d) {
  var t = new Date(); t.setHours(0, 0, 0, 0);
  var x = new Date(d); x.setHours(0, 0, 0, 0);
  return x.getTime() === t.getTime();
}
function shortDate(d) {
  return DAYS_SHORT[d.getDay() === 0 ? 6 : d.getDay() - 1] + ' ' + d.getDate() + ' ' + MONTHS_C[d.getMonth()];
}
function longDate(d) {
  var dow = d.getDay() === 0 ? 6 : d.getDay() - 1;
  return DAYS_LONG[dow] + ', ' + d.getDate() + ' de ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear();
}

/* ── Fetch helpers ────────────────────────────────────── */
function fetchDay(fecha) {
  return fetch('/api/admin-reservas?negocio=' + NEGOCIO + '&fecha=' + fecha, { headers: authHeaders() })
    .then(function (r) { return r.json(); })
    .then(function (d) { return d.reservas || []; });
}
function fetchWorkers() {
  return fetch('/api/trabajadores?negocio=' + NEGOCIO, { headers: authHeaders() })
    .then(function (r) { return r.json(); })
    .then(function (d) { return d.trabajadores || []; });
}
function soloReales(rs) {
  return rs.filter(function (r) { return !r.servicio || !r.servicio.startsWith('BLOQUEADO:'); });
}

/* ── Stats (siempre datos de hoy) ─────────────────────── */
function loadTodayStats() {
  var today = isoDate(new Date());
  var mon   = weekStart(new Date());

  ['s-total', 's-prox', 's-ing', 's-week'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el && el.textContent === '—') el.textContent = '…';
  });

  fetchDay(today).then(function (all) {
    var rs   = soloReales(all);
    var now  = new Date();
    var minN = now.getHours() * 60 + now.getMinutes();

    document.getElementById('s-total').textContent     = rs.length;
    document.getElementById('s-total-sub').textContent = rs.length === 1 ? 'cita confirmada' : 'citas confirmadas';

    var prox = rs.find(function (r) { return r.hora_inicio >= minN; });
    document.getElementById('s-prox').textContent     = prox ? fmt(prox.hora_inicio) : '—';
    document.getElementById('s-prox-sub').textContent = prox ? prox.nombre : (rs.length ? 'no quedan más hoy' : 'libre');

    var ing = rs.reduce(function (s, r) { return s + (parseFloat(r.precio) || 0); }, 0);
    document.getElementById('s-ing').textContent     = ing > 0 ? Math.round(ing) + '€' : (rs.length ? '0€' : '—');
    document.getElementById('s-ing-sub').textContent = 'ingresos estimados';
  }).catch(function () { document.getElementById('s-total').textContent = '?'; });

  var promises = [];
  for (var i = 0; i < 7; i++) promises.push(fetchDay(isoDate(addDays(mon, i))));
  Promise.all(promises).then(function (days) {
    var allRs = days.map(soloReales);
    var total = allRs.reduce(function (s, d) { return s + d.length; }, 0);
    var ing   = allRs.reduce(function (s, d) {
      return s + d.reduce(function (ss, r) { return ss + (parseFloat(r.precio) || 0); }, 0);
    }, 0);
    document.getElementById('s-week').textContent     = total;
    document.getElementById('s-week-sub').textContent = total + ' citas' + (ing > 0 ? ' · ' + Math.round(ing) + '€' : '');
  }).catch(function () { document.getElementById('s-week').textContent = '?'; });
}

/* ── Navegación y vistas ──────────────────────────────── */
function setView(v) {
  _view = v;
  document.querySelectorAll('.tab').forEach(function (t) {
    t.classList.toggle('active', t.dataset.view === v);
  });
  var isManagement = (v === 'equipo' || v === 'servicios');
  document.getElementById('nav-controls').style.display = isManagement ? 'none' : '';
  var statsEl = document.querySelector('.stats');
  if (statsEl) statsEl.style.display = isManagement ? 'none' : '';
  render();
}

function navigate(dir) {
  if (_view === 'month') {
    var m = _baseDate.getMonth() + dir;
    var y = _baseDate.getFullYear();
    _baseDate = new Date(y, m, 1);
  } else {
    var step = _view === 'week' ? 7 : 1;
    _baseDate = addDays(_baseDate, dir * step);
  }
  document.getElementById('fecha-input').value = isoDate(_baseDate);
  render();
}

function irHoy() {
  _baseDate = new Date();
  document.getElementById('fecha-input').value = isoDate(_baseDate);
  render();
}

function onDateChange() {
  var v = document.getElementById('fecha-input').value;
  if (v) { _baseDate = new Date(v + 'T12:00:00'); render(); }
}

function render() {
  if      (_view === 'day')    renderDay();
  else if (_view === 'week')   renderMulti(7);
  else if (_view === 'month')  renderMonth();
  else if (_view === 'equipo')    renderEquipo();
  else if (_view === 'servicios') renderServicios();
}

/* ── Vista diaria ─────────────────────────────────────── */
function renderDay() {
  var fecha = isoDate(_baseDate);
  document.getElementById('date-heading').textContent = longDate(_baseDate);
  document.getElementById('view-content').innerHTML =
    '<div class="block-panel">' +
      '<div class="block-panel-title">Bloquear franja horaria</div>' +
      '<div class="block-form">' +
        '<div class="form-group"><label class="form-label">Fecha</label><input type="date" id="bl-fecha" class="form-input" value="' + fecha + '"></div>' +
        '<div class="form-group"><label class="form-label">Hora inicio</label><input type="time" id="bl-ini" class="form-input" value="09:00"></div>' +
        '<div class="form-group"><label class="form-label">Hora fin</label><input type="time" id="bl-fin" class="form-input" value="10:00"></div>' +
        '<div class="form-group"><label class="form-label">Motivo (opcional)</label><input type="text" id="bl-motivo" class="form-input" style="width:180px" placeholder="Reunión, festivo…"></div>' +
        '<div class="form-group"><label class="form-label">&nbsp;</label><button class="btn-save" onclick="bloquearFranja()">Bloquear</button></div>' +
      '</div>' +
    '</div>' +
    '<div class="section-label">Citas del día</div>' +
    '<div id="day-list"><div class="loading-state">Cargando…</div></div>';

  fetchDay(fecha).then(function (rs) {
    renderDayList(rs, fecha, 'day-list');
  }).catch(function () {
    document.getElementById('day-list').innerHTML = '<div class="empty-state">Error al cargar</div>';
  });
}

function renderDayList(rs, fecha, elId) {
  var el = document.getElementById(elId);
  if (!el) return;

  var reales     = rs.filter(function (r) { return !r.servicio || !r.servicio.startsWith('BLOQUEADO:'); });
  var bloqueados = rs.filter(function (r) { return r.servicio && r.servicio.startsWith('BLOQUEADO:'); });

  if (rs.length === 0) { el.innerHTML = '<div class="empty-state">No hay citas para este día</div>'; return; }

  var now   = new Date();
  var minN  = now.getHours() * 60 + now.getMinutes();
  var today = isToday(new Date(fecha + 'T12:00:00'));
  var html  = '';

  if (reales.length === 0) {
    html += '<div class="empty-state" style="margin-bottom:12px">Sin citas de clientes</div>';
  } else {
    html += reales.map(function (r) {
      var horaFin = r.hora_fin || (r.hora_inicio + r.duracion_min);
      var done    = today && horaFin <= minN;
      var active  = today && r.hora_inicio <= minN && horaFin > minN;
      return '<div class="reserva-card' + (done ? ' done' : '') + '" id="card-' + r.id + '">' +
        '<div><div class="r-hora">' + fmt(r.hora_inicio) + '</div><div class="r-hora-end">' + fmt(horaFin) + '</div></div>' +
        '<div class="r-sep' + (active ? ' active' : '') + '"></div>' +
        '<div class="r-info">' +
          '<div class="r-nombre">' + r.nombre + '</div>' +
          '<div class="r-svc">' + r.servicio + ' &middot; ' + r.duracion_min + ' min' + (r.precio ? ' &middot; ' + r.precio + '€' : '') + '</div>' +
          '<div class="r-contact">' +
            (r.telefono ? '<a href="tel:' + r.telefono + '" class="btn-sm">' + r.telefono + '</a>' : '') +
            '<a href="mailto:' + r.email + '" class="btn-sm">' + r.email + '</a>' +
          '</div>' +
        '</div>' +
        '<div class="r-actions">' +
          '<span class="badge-ok"><span class="dot-green"></span>Confirmada</span>' +
          (r.telefono ? '<a href="https://wa.me/' + r.telefono.replace(/\D/g, '') + '?text=' + enc('Hola ' + r.nombre + ', te escribimos desde ' + (window.NEGOCIO_NOMBRE || 'el negocio') + '.') + '" target="_blank" class="btn-sm">WhatsApp</a>' : '') +
          '<button class="btn-sm btn-danger" onclick="cancelar(' + r.id + ')">Cancelar</button>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  if (bloqueados.length > 0) {
    html += '<div class="section-label" style="margin-top:20px">Franjas bloqueadas</div>';
    html += bloqueados.map(function (r) {
      var horaFin = r.hora_fin || (r.hora_inicio + r.duracion_min);
      var motivo  = r.servicio.replace('BLOQUEADO: ', '');
      return '<div class="reserva-card done" id="card-' + r.id + '" style="background:#fafafa;border-style:dashed">' +
        '<div><div class="r-hora" style="font-size:15px;color:#71717a">' + fmt(r.hora_inicio) + '</div><div class="r-hora-end">' + fmt(horaFin) + '</div></div>' +
        '<div class="r-sep"></div>' +
        '<div class="r-info">' +
          '<div class="r-nombre" style="color:#71717a;font-size:13px">Franja bloqueada</div>' +
          '<div class="r-svc">' + motivo + '</div>' +
        '</div>' +
        '<div class="r-actions"><button class="btn-sm btn-danger" onclick="cancelar(' + r.id + ')" title="Eliminar bloqueo">Desbloquear</button></div>' +
      '</div>';
    }).join('');
  }

  el.innerHTML = html;
}

/* ── Vista semana ─────────────────────────────────────── */
function renderMulti(nDays) {
  var start = nDays === 7 ? weekStart(_baseDate) : _baseDate;
  var dates = [];
  for (var i = 0; i < nDays; i++) dates.push(addDays(start, i));

  var f = dates[0], l = dates[dates.length - 1];
  document.getElementById('date-heading').textContent =
    f.getDate() + ' ' + MONTHS_C[f.getMonth()] + ' — ' + l.getDate() + ' ' + MONTHS_C[l.getMonth()] + ' ' + l.getFullYear();

  var cls      = nDays === 7 ? 'g7' : 'g3';
  var innerHtml = '<div class="multi-grid ' + cls + '">';
  dates.forEach(function (d) {
    var key  = isoDate(d);
    var head = isToday(d) ? 'today-col' : '';
    innerHtml +=
      '<div class="day-col">' +
        '<div class="day-col-head ' + head + '">' +
          '<span class="day-col-title">' + shortDate(d) + '</span>' +
          '<span class="day-col-cnt" id="cnt-' + key + '">…</span>' +
        '</div>' +
        '<div class="day-col-body" id="body-' + key + '"><div class="loading-state" style="padding:16px 8px;font-size:12px">…</div></div>' +
      '</div>';
  });
  innerHtml += '</div>';

  document.getElementById('view-content').innerHTML =
    nDays === 7 ? '<div class="week-scroll">' + innerHtml + '</div>' : innerHtml;

  dates.forEach(function (d) {
    var key = isoDate(d);
    fetchDay(key).then(function (all) {
      var rs  = soloReales(all);
      var blq = all.length - rs.length;
      var cntEl  = document.getElementById('cnt-' + key);
      var bodyEl = document.getElementById('body-' + key);
      if (cntEl)  cntEl.textContent = rs.length;
      if (!bodyEl) return;

      if (rs.length === 0 && blq === 0) { bodyEl.innerHTML = '<div class="mini-empty">Sin citas</div>'; return; }

      var now  = new Date();
      var minN = now.getHours() * 60 + now.getMinutes();
      var tod  = isToday(d);
      var html = rs.map(function (r) {
        var horaFin = r.hora_fin || (r.hora_inicio + r.duracion_min);
        var done    = tod && horaFin <= minN;
        return '<div class="mini-card' + (done ? ' past' : '') + '" title="' + r.nombre + ' · ' + r.servicio + '">' +
          '<div class="mini-time">' + fmt(r.hora_inicio) + '</div>' +
          '<div class="mini-name">' + r.nombre + '</div>' +
          '<div class="mini-svc">' + r.servicio + '</div>' +
        '</div>';
      }).join('');
      if (blq > 0) html += '<div class="mini-empty" style="color:#d1d5db;font-size:11px;padding:6px 8px">' + blq + ' franja' + (blq > 1 ? 's' : '') + ' bloqueada' + (blq > 1 ? 's' : '') + '</div>';
      bodyEl.innerHTML = html || '<div class="mini-empty">Sin citas</div>';
    }).catch(function () {
      var c = document.getElementById('cnt-' + key);
      var b = document.getElementById('body-' + key);
      if (c) c.textContent = '!';
      if (b) b.innerHTML = '<div class="mini-empty">Error</div>';
    });
  });
}

/* ── Vista mes ────────────────────────────────────────── */
function renderMonth() {
  var year  = _baseDate.getFullYear();
  var month = _baseDate.getMonth();

  document.getElementById('date-heading').textContent = MONTHS_LONG[month] + ' ' + year;

  var firstDay = new Date(year, month, 1);
  var lastDay  = new Date(year, month + 1, 0);
  var startOff = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
  var today    = new Date(); today.setHours(0, 0, 0, 0);

  var dowRow = DAYS_SHORT.map(function (d) { return '<div class="month-dow-cell">' + d + '</div>'; }).join('');

  var cells    = '';
  var allDates = [];
  for (var e = 0; e < startOff; e++) cells += '<div class="month-cell mc-empty"></div>';

  for (var d = 1; d <= lastDay.getDate(); d++) {
    var dt   = new Date(year, month, d);
    var key  = isoDate(dt);
    var isT  = dt.getTime() === today.getTime();
    var isPt = dt < today;
    var cls  = 'month-cell' + (isT ? ' mc-today' : '') + (isPt ? ' mc-past' : '');
    cells += '<div class="' + cls + '" id="mc-' + key + '" onclick="goToDay(\'' + key + '\')" title="Ver día ' + d + '">' +
      '<div class="mc-day">' + d + '</div>' +
      '<div id="mcb-' + key + '" class="mc-badge mc-badge-0"></div>' +
    '</div>';
    allDates.push({ dt: dt, key: key });
  }

  var total    = startOff + lastDay.getDate();
  var reminder = total % 7;
  if (reminder > 0) { for (var f = reminder; f < 7; f++) cells += '<div class="month-cell mc-empty"></div>'; }

  document.getElementById('view-content').innerHTML =
    '<div id="month-summary" class="month-summary">Calculando…</div>' +
    '<div class="month-cal">' +
      '<div class="month-dow-row">' + dowRow + '</div>' +
      '<div class="month-weeks-grid">' + cells + '</div>' +
    '</div>';

  var totales = { citas: 0, ingresos: 0, cargados: 0, total: allDates.length };

  allDates.forEach(function (item) {
    fetchDay(item.key).then(function (all) {
      var rs  = soloReales(all);
      var cnt = rs.length;
      var ing = rs.reduce(function (s, r) { return s + (parseFloat(r.precio) || 0); }, 0);

      totales.citas    += cnt;
      totales.ingresos += ing;
      totales.cargados++;

      var bdg = document.getElementById('mcb-' + item.key);
      if (bdg) {
        if (cnt === 0)       { bdg.className = 'mc-badge mc-badge-0';    bdg.textContent = ''; }
        else if (cnt <= 2)   { bdg.className = 'mc-badge mc-badge-lo';   bdg.textContent = cnt === 1 ? '1 cita' : cnt + ' citas'; }
        else if (cnt <= 4)   { bdg.className = 'mc-badge mc-badge-hi';   bdg.textContent = cnt + ' citas'; }
        else                 { bdg.className = 'mc-badge mc-badge-full'; bdg.textContent = cnt + ' citas'; }
      }

      if (totales.cargados === totales.total) {
        var sumEl = document.getElementById('month-summary');
        if (sumEl) {
          var txt = totales.citas === 0
            ? 'Sin citas este mes'
            : totales.citas + (totales.citas === 1 ? ' cita' : ' citas') + ' este mes';
          if (totales.ingresos > 0) txt += ' · ' + Math.round(totales.ingresos) + '€ estimados';
          sumEl.textContent = txt;
        }
      }
    }).catch(function () { totales.cargados++; });
  });
}

function goToDay(dateStr) {
  _baseDate = new Date(dateStr + 'T12:00:00');
  document.getElementById('fecha-input').value = dateStr;
  setView('day');
}

/* ── Cancelar reserva ─────────────────────────────────── */
function cancelar(id) {
  if (!confirm('¿Cancelar esta reserva? Se enviará un email de aviso al cliente.')) return;
  fetch('/api/admin-reservas?id=' + id, { method: 'DELETE', headers: authHeaders() })
    .then(function (r) { return r.json(); })
    .then(function (d) {
      if (d.ok) {
        var c = document.getElementById('card-' + id);
        if (c) { c.style.opacity = '.2'; c.style.pointerEvents = 'none'; }
        setTimeout(function () { loadTodayStats(); render(); }, 600);
      } else { alert('Error: ' + (d.error || '')); }
    });
}

/* ── Bloquear franja ──────────────────────────────────── */
function bloquearFranja() {
  var fecha  = document.getElementById('bl-fecha').value;
  var ini    = document.getElementById('bl-ini').value;
  var fin    = document.getElementById('bl-fin').value;
  var motivo = (document.getElementById('bl-motivo').value || '').trim() || 'Bloqueado';
  if (!fecha || !ini || !fin) { alert('Completa fecha y horas.'); return; }
  var iniM = timeToMins(ini), finM = timeToMins(fin);
  if (finM <= iniM) { alert('La hora de fin debe ser posterior a la de inicio.'); return; }
  fetch('/api/booking', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      negocio: NEGOCIO, servicio: 'BLOQUEADO: ' + motivo,
      duracion_min: finM - iniM, precio: 0,
      fecha: fecha, hora_inicio: iniM, hora_fin: finM,
      nombre: 'Admin', email: 'admin@sitalia.es'
    })
  }).then(function (r) { return r.json(); }).then(function (d) {
    if (d.ok) { document.getElementById('bl-motivo').value = ''; loadTodayStats(); render(); }
    else { alert('Error: ' + (d.error || 'No se pudo bloquear')); }
  }).catch(function () { alert('Error de conexión'); });
}

/* ── Pestaña Equipo ───────────────────────────────────── */
var _editingId = null;

function renderEquipo() {
  document.getElementById('date-heading').textContent = 'Gestión del equipo';
  document.getElementById('view-content').innerHTML =
    '<div id="capacidad-box"></div>' +
    '<div class="equipo-header">' +
      '<div class="equipo-title">Trabajadores</div>' +
      '<button class="btn-add" onclick="showWorkerForm(null)">+ Añadir trabajador</button>' +
    '</div>' +
    '<div id="worker-form-wrap" style="display:none"></div>' +
    '<div id="workers-list"><div class="loading-state">Cargando…</div></div>';
  loadWorkers();
}

function loadWorkers() {
  // Cargar capacidad del negocio (si está configurada → modo rostisseria)
  loadCapacidad();

  // Precargamos trabajadores y ausencias en paralelo. Las ausencias se usan
  // para pintar el badge con el contador junto al nombre del trabajador.
  Promise.all([fetchWorkers(), fetchAusencias()]).then(function (results) {
    var ws = results[0];
    _workers = ws;
    var el = document.getElementById('workers-list');
    if (!el) return;
    if (ws.length === 0) {
      el.innerHTML = '<div class="empty-state">No hay trabajadores. Añade el primero para gestionar la disponibilidad de citas.</div>';
      return;
    }
    el.innerHTML = ws.map(function (w) {
      var ausCount = getWorkerAusTotal(w.id);
      return '<div class="worker-group">' +
        '<div class="worker-card" id="wcard-' + w.id + '">' +
          '<div class="worker-avatar">' + initials(w.nombre) + '</div>' +
          '<div class="worker-info">' +
            '<div class="worker-name">' + w.nombre + '</div>' +
            '<div class="worker-sched">' + schedSummary(w.horario) + '</div>' +
          '</div>' +
          '<div class="worker-actions">' +
            '<button class="btn-sm" onclick="showWorkerForm(' + JSON.stringify(w).replace(/"/g, '&quot;') + ')">Editar horario</button>' +
            '<button class="btn-sm btn-aus" onclick="showAusencias(\'' + w.id + '\')" id="aus-btn-' + w.id + '">' +
              'Ausencias' + (ausCount > 0 ? ' <span class="aus-badge">' + ausCount + '</span>' : '') +
            '</button>' +
            '<button class="btn-sm btn-danger" onclick="deleteWorker(' + w.id + ',\'' + w.nombre.replace(/'/g, "\\'") + '\')">Eliminar</button>' +
          '</div>' +
        '</div>' +
        '<div class="aus-wrap" id="aus-wrap-' + w.id + '" style="display:none">' +
          '<div id="aus-inner-' + w.id + '"></div>' +
        '</div>' +
      '</div>';
    }).join('');
  }).catch(function () {
    var el = document.getElementById('workers-list');
    if (el) el.innerHTML = '<div class="empty-state">Error al cargar los trabajadores</div>';
  });
}

function initials(name) {
  return name.split(' ').slice(0, 2).map(function (p) { return p[0]; }).join('').toUpperCase();
}

function schedSummary(horario) {
  if (!horario || horario.length === 0) return 'Sin horario configurado';
  var working = (horario || []).filter(function (d) { return d.inicio !== null; });
  if (working.length === 0) return 'Sin días laborables';
  return working.map(function (d) { return DAYS_SHORT[d.dow] + ' ' + minsToTime(d.inicio) + '-' + minsToTime(d.fin); }).join(' &middot; ');
}

function showWorkerForm(worker) {
  _editingId = worker ? worker.id : null;
  var wrap   = document.getElementById('worker-form-wrap');
  if (!wrap) return;

  var defaultSched = [
    { dow: 0, inicio: 540, fin: 1080 }, { dow: 1, inicio: 540, fin: 1080 },
    { dow: 2, inicio: 540, fin: 1080 }, { dow: 3, inicio: 540, fin: 1080 },
    { dow: 4, inicio: 540, fin: 1080 }, { dow: 5, inicio: null, fin: null },
    { dow: 6, inicio: null, fin: null }
  ];
  var sched = worker ? (worker.horario && worker.horario.length ? worker.horario : defaultSched) : defaultSched;

  var rows = '';
  for (var i = 0; i < 7; i++) {
    var dayData = sched.find(function (d) { return d.dow === i; }) || { dow: i, inicio: null, fin: null };
    var works   = dayData.inicio !== null;
    var iniVal  = works ? minsToTime(dayData.inicio) : '09:00';
    var finVal  = works ? minsToTime(dayData.fin)    : '18:00';
    rows +=
      '<div class="sched-row' + (works ? '' : ' off') + '" id="srow-' + i + '">' +
        '<label class="sched-day-label">' +
          '<input type="checkbox" class="day-toggle" id="dcheck-' + i + '" ' + (works ? 'checked' : '') + ' onchange="toggleDayRow(' + i + ')">' +
          DAYS_LONG[i] +
        '</label>' +
        '<div class="sched-times" id="stimes-' + i + '" style="' + (works ? '' : 'display:none') + '">' +
          '<input type="time" class="time-input" id="dini-' + i + '" value="' + iniVal + '">' +
          '<span class="time-sep">—</span>' +
          '<input type="time" class="time-input" id="dfin-' + i + '" value="' + finVal + '">' +
        '</div>' +
        '<span class="sched-off-label" id="soff-' + i + '" style="' + (works ? 'display:none' : '') + '">Libre</span>' +
      '</div>';
  }

  wrap.innerHTML =
    '<div class="worker-form">' +
      '<h3>' + (worker ? 'Editar trabajador' : 'Nuevo trabajador') + '</h3>' +
      '<div class="form-row">' +
        '<div class="form-group">' +
          '<label class="form-label">Nombre</label>' +
          '<input type="text" id="w-nombre" class="form-input w-name" placeholder="Nombre completo" value="' + (worker ? worker.nombre : '') + '">' +
        '</div>' +
      '</div>' +
      '<div class="form-label" style="margin-bottom:10px">Horario laboral</div>' +
      '<div class="sched-grid">' + rows + '</div>' +
      '<div class="form-actions">' +
        '<button class="btn-save" onclick="saveWorker()">Guardar</button>' +
        '<button class="btn-cancel-form" onclick="hideWorkerForm()">Cancelar</button>' +
      '</div>' +
    '</div>';

  wrap.style.display = 'block';
  wrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function toggleDayRow(i) {
  var checked = document.getElementById('dcheck-' + i).checked;
  var row     = document.getElementById('srow-' + i);
  var times   = document.getElementById('stimes-' + i);
  var off     = document.getElementById('soff-' + i);
  if (checked) { row.classList.remove('off'); times.style.display = ''; off.style.display = 'none'; }
  else         { row.classList.add('off');    times.style.display = 'none'; off.style.display = ''; }
}

function hideWorkerForm() {
  var wrap = document.getElementById('worker-form-wrap');
  if (wrap) wrap.style.display = 'none';
  _editingId = null;
}

function saveWorker() {
  var nombre = (document.getElementById('w-nombre').value || '').trim();
  if (!nombre) { alert('El nombre es obligatorio.'); return; }

  var horario = [];
  for (var i = 0; i < 7; i++) {
    var works = document.getElementById('dcheck-' + i).checked;
    horario.push({ dow: i, inicio: works ? timeToMins(document.getElementById('dini-' + i).value) : null, fin: works ? timeToMins(document.getElementById('dfin-' + i).value) : null });
  }

  var body = { negocio: NEGOCIO, nombre: nombre, horario: horario };
  if (_editingId) body.id = _editingId;

  fetch('/api/trabajadores', {
    method: 'POST',
    headers: authHeaders({ json: true }),
    body: JSON.stringify(body)
  }).then(function (r) {
    return r.text().then(function (txt) {
      try {
        var d = JSON.parse(txt);
        if (d.ok) { hideWorkerForm(); loadWorkers(); }
        else { alert('Error del servidor: ' + (d.error || 'error desconocido')); }
      } catch (e) {
        alert('Error: el servidor devolvió una respuesta inesperada (HTTP ' + r.status + ').\n\n' + txt.slice(0, 200));
      }
    });
  }).catch(function (e) { alert('Error de red: ' + e.message); });
}

function deleteWorker(id, nombre) {
  if (!confirm('¿Eliminar a ' + nombre + ' del equipo?')) return;
  fetch('/api/trabajadores?id=' + id, { method: 'DELETE', headers: authHeaders() })
    .then(function (r) { return r.json(); })
    .then(function (d) { if (d.ok) { loadWorkers(); } else { alert('Error: ' + (d.error || '')); } });
}

/* ════════════════════════════════════════════════════════════
   MÓDULO: CAPACIDAD POR SLOT (rostisserias, take-away, etc.)
   Solo aparece si el negocio tiene una entrada en negocio_capacidad.
   ════════════════════════════════════════════════════════════ */

function loadCapacidad() {
  fetch('/api/capacidad?negocio=' + NEGOCIO)
    .then(function (r) { return r.json(); })
    .then(function (d) {
      var box = document.getElementById('capacidad-box');
      if (!box) return;
      if (!d.capacidad) {
        // El negocio NO tiene capacidad configurada → no mostramos nada
        box.innerHTML = '';
        return;
      }
      renderCapacidadBox(d.capacidad);
    })
    .catch(function () {});
}

function renderCapacidadBox(cap) {
  var box = document.getElementById('capacidad-box');
  if (!box) return;
  box.innerHTML =
    '<div class="cap-box">' +
      '<div class="cap-box-head">' +
        '<div>' +
          '<div class="cap-box-title">Capacidad por slot</div>' +
          '<div class="cap-box-sub">' +
            'Cuántos pedidos puedes asumir en cada franja horaria. ' +
            'Útil para negocios donde la cocina prepara en paralelo (rostisseria, take-away).' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="cap-box-form">' +
        '<div class="cap-field">' +
          '<label class="cap-label">Pedidos por slot</label>' +
          '<input id="cap-pedidos" class="cap-input" type="number" min="1" step="1" value="' + cap.capacidad_por_slot + '">' +
        '</div>' +
        '<div class="cap-field">' +
          '<label class="cap-label">Duración slot (min)</label>' +
          '<input id="cap-duracion" class="cap-input" type="number" min="5" step="5" value="' + cap.duracion_slot_min + '">' +
        '</div>' +
        '<button class="btn-save cap-save" onclick="saveCapacidad()">Guardar</button>' +
      '</div>' +
      '<div id="cap-msg" class="cap-msg" hidden></div>' +
    '</div>';
}

function saveCapacidad() {
  var pedidos  = parseInt((document.getElementById('cap-pedidos')  || {}).value);
  var duracion = parseInt((document.getElementById('cap-duracion') || {}).value);
  if (!pedidos || pedidos < 1) { alert('Pedidos por slot debe ser un número >= 1'); return; }
  if (!duracion || duracion < 5) { alert('Duración mínima 5 min'); return; }

  var btn = document.querySelector('.cap-save');
  if (btn) { btn.disabled = true; btn.textContent = 'Guardando…'; }

  fetch('/api/capacidad', {
    method: 'POST',
    headers: authHeaders({ json: true }),
    body: JSON.stringify({
      negocio: NEGOCIO,
      capacidad_por_slot: pedidos,
      duracion_slot_min: duracion
    })
  })
    .then(function (r) { return r.json(); })
    .then(function (d) {
      if (!d.ok) throw new Error(d.error || 'Error');
      if (btn) { btn.disabled = false; btn.textContent = 'Guardado ✓'; }
      var msg = document.getElementById('cap-msg');
      if (msg) {
        msg.hidden = false;
        msg.textContent = 'Configuración actualizada. Los cambios se aplican inmediatamente.';
      }
      setTimeout(function () {
        if (btn) btn.textContent = 'Guardar';
      }, 2500);
    })
    .catch(function (e) {
      if (btn) { btn.disabled = false; btn.textContent = 'Guardar'; }
      alert('No se pudo guardar: ' + e.message);
    });
}

/* ════════════════════════════════════════════════════════════
   MÓDULO: AUSENCIAS DE TRABAJADORES
   Almacenamiento: Supabase via /api/ausencias

   Flujo NUEVO (mayo 2026): los cambios NO se guardan al instante.
   - Cada clic en un día se acumula en _ausPending por trabajador.
   - Aparece una barra "Guardar (N cambios)" / "Descartar".
   - Al pulsar Guardar se envían todos los cambios en paralelo a la API.
     Si alguno falla, se reintroduce en la lista de pendientes.

   Estados visuales de cada día:
     aus-work     → día trabajable, sin cambios
     aus-absent   → día ausente guardado (estado real en BD)
     aus-pending-add    → día que se quiere marcar como ausente
     aus-pending-remove → día actualmente ausente que se quiere quitar
   ════════════════════════════════════════════════════════════ */

var _ausencias             = null;   // { workerId: ['2026-07-01', ...], ... } (estado guardado)
var _ausPending            = {};     // { workerId: { 'YYYY-MM-DD': 'add' | 'remove' } } cambios pendientes
var _viewingAusenciasId    = null;   // id del trabajador cuyo calendario está abierto
var _ausCalMonth           = new Date(); // mes que muestra el calendario de ausencias

// Carga inicial desde Supabase.
function fetchAusencias() {
  return fetch('/api/ausencias?negocio=' + NEGOCIO)
    .then(function (r) { return r.json(); })
    .then(function (d) {
      _ausencias = d.ausencias || {};
      return _ausencias;
    })
    .catch(function () {
      _ausencias = {};
      return _ausencias;
    });
}

function getWorkerAusList(wid) {
  if (_ausencias === null) return [];
  return _ausencias[String(wid)] || [];
}

// Total que VA A QUEDAR si se guardan los pendientes (lo usamos para el badge).
function getWorkerAusTotal(wid) {
  var key      = String(wid);
  var current  = (_ausencias && _ausencias[key]) ? _ausencias[key].length : 0;
  var pending  = _ausPending[key] || {};
  var delta    = 0;
  for (var d in pending) {
    if (!Object.prototype.hasOwnProperty.call(pending, d)) continue;
    if (pending[d] === 'add')    delta++;
    if (pending[d] === 'remove') delta--;
  }
  return current + delta;
}

// Cuenta de cambios pendientes para un trabajador.
function pendingCount(wid) {
  var p = _ausPending[String(wid)] || {};
  return Object.keys(p).length;
}

// Estado efectivo de un día tras aplicar pendientes:
//   'absent'         → ausencia confirmada o pendiente de añadir
//   'absent-pending' → idem pero todavía sin guardar
//   'work'           → trabaja
//   'work-pending'   → estaba ausente, se ha pedido quitar
function dayState(wid, dateStr) {
  var key       = String(wid);
  var isSaved   = (_ausencias && _ausencias[key] || []).indexOf(dateStr) > -1;
  var pendOp    = (_ausPending[key] || {})[dateStr];

  if (pendOp === 'add')    return 'absent-pending';
  if (pendOp === 'remove') return 'work-pending';
  return isSaved ? 'absent' : 'work';
}

// Clic en un día: toggle en el buffer de pendientes.
function toggleAusencia(wid, dateStr) {
  var key = String(wid);
  if (!_ausPending[key]) _ausPending[key] = {};

  var isSaved = (_ausencias && _ausencias[key] || []).indexOf(dateStr) > -1;
  var pendOp  = _ausPending[key][dateStr];

  if (pendOp) {
    // Ya había un cambio pendiente: cancelarlo (volver al estado guardado).
    delete _ausPending[key][dateStr];
  } else {
    // No había cambio pendiente: añadir el opuesto al estado guardado.
    _ausPending[key][dateStr] = isSaved ? 'remove' : 'add';
  }

  renderAusCalendar(wid);
  refreshAusBadge(wid);
}

// Persiste todos los cambios pendientes del trabajador. Llama a la API
// en paralelo. Si alguno falla, se mantiene en pendientes y se avisa.
function saveAusencias(wid) {
  var key     = String(wid);
  var pending = _ausPending[key] || {};
  var entries = Object.keys(pending).map(function (date) {
    return { date: date, op: pending[date] };
  });
  if (entries.length === 0) return;

  // Bloquear los botones de la barra de acciones mientras guardamos.
  var saveBtn = document.getElementById('aus-save-' + wid);
  var discBtn = document.getElementById('aus-discard-' + wid);
  if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Guardando…'; }
  if (discBtn) { discBtn.disabled = true; }

  var promises = entries.map(function (e) {
    return fetch('/api/ausencias', {
      method:  'POST',
      headers: authHeaders({ json: true }),
      body: JSON.stringify({
        negocio:       NEGOCIO,
        trabajador_id: wid,
        fecha:         e.date,
        accion:        e.op   // 'add' o 'remove'
      })
    })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (!d.ok) throw new Error(d.error || 'Error');
        return e;
      });
  });

  Promise.allSettled(promises).then(function (results) {
    // Aplicar los cambios exitosos al estado "guardado" en memoria
    // y dejar los fallidos en _ausPending para reintento manual.
    if (!_ausencias)         _ausencias = {};
    if (!_ausencias[key])    _ausencias[key] = [];
    if (!_ausPending[key])   _ausPending[key] = {};

    var failed = [];
    results.forEach(function (r, i) {
      var e = entries[i];
      if (r.status === 'fulfilled') {
        if (e.op === 'add' && _ausencias[key].indexOf(e.date) === -1) {
          _ausencias[key].push(e.date);
        } else if (e.op === 'remove') {
          var idx = _ausencias[key].indexOf(e.date);
          if (idx > -1) _ausencias[key].splice(idx, 1);
        }
        delete _ausPending[key][e.date];
      } else {
        failed.push(e.date);
      }
    });

    renderAusCalendar(wid);
    refreshAusBadge(wid);

    if (failed.length > 0) {
      alert('No se pudieron guardar ' + failed.length + ' cambio(s). Inténtalo de nuevo.');
    }
  });
}

// Descarta TODOS los cambios pendientes del trabajador.
function discardAusencias(wid) {
  var key = String(wid);
  if (!_ausPending[key] || Object.keys(_ausPending[key]).length === 0) return;
  if (!confirm('¿Descartar los cambios pendientes de este trabajador?')) return;
  _ausPending[key] = {};
  renderAusCalendar(wid);
  refreshAusBadge(wid);
}

function refreshAusBadge(wid) {
  var btn = document.getElementById('aus-btn-' + wid);
  if (!btn) return;
  var count = getWorkerAusTotal(wid);
  var pend  = pendingCount(wid);
  // Si hay cambios pendientes, los marcamos visualmente con un asterisco.
  var suffix = (count > 0 ? ' <span class="aus-badge">' + count + (pend > 0 ? '*' : '') + '</span>' : '');
  btn.innerHTML = 'Ausencias' + suffix;
}

function showAusencias(wid) {
  // cierra cualquier otro panel abierto
  document.querySelectorAll('.aus-wrap').forEach(function (el) {
    if (el.id !== 'aus-wrap-' + wid) el.style.display = 'none';
  });

  var wrap = document.getElementById('aus-wrap-' + wid);
  if (!wrap) return;

  if (_viewingAusenciasId === wid && wrap.style.display === 'block') {
    wrap.style.display   = 'none';
    _viewingAusenciasId  = null;
    return;
  }

  _viewingAusenciasId = wid;
  var now = new Date();
  _ausCalMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  wrap.style.display = 'block';
  renderAusCalendar(wid);
  wrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function ausCalNav(dir) {
  _ausCalMonth = new Date(_ausCalMonth.getFullYear(), _ausCalMonth.getMonth() + dir, 1);
  renderAusCalendar(_viewingAusenciasId);
}

function renderAusCalendar(wid) {
  var el = document.getElementById('aus-inner-' + wid);
  if (!el) return;

  var worker = _workers.find(function (w) { return String(w.id) === String(wid); });
  if (!worker) { el.innerHTML = '<div class="loading-state">Error: trabajador no encontrado</div>'; return; }

  var year  = _ausCalMonth.getFullYear();
  var month = _ausCalMonth.getMonth();

  // días laborables del trabajador (0=Lun … 6=Dom)
  var workingDows = (worker.horario || [])
    .filter(function (d) { return d.inicio !== null; })
    .map(function (d) { return d.dow; });

  var firstDay = new Date(year, month, 1);
  var lastDay  = new Date(year, month + 1, 0);
  var startOff = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;

  var dowRow = DAYS_SHORT.map(function (d) { return '<div class="aus-dow">' + d + '</div>'; }).join('');

  var cells = '';
  for (var e = 0; e < startOff; e++) cells += '<div class="aus-cell aus-empty"></div>';

  for (var d = 1; d <= lastDay.getDate(); d++) {
    var dt    = new Date(year, month, d);
    var dowJS = dt.getDay();
    var dow   = dowJS === 0 ? 6 : dowJS - 1;
    var key   = isoDate(dt);
    var isWork  = workingDows.indexOf(dow) > -1;
    var isTod   = isToday(dt);
    var state   = dayState(wid, key);   // 'absent' | 'absent-pending' | 'work' | 'work-pending'

    var cls = 'aus-cell';
    if (!isWork)                      cls += ' aus-nowork';
    else if (state === 'absent')      cls += ' aus-absent';
    else if (state === 'absent-pending') cls += ' aus-absent aus-pending';
    else if (state === 'work-pending')   cls += ' aus-work aus-pending';
    else                              cls += ' aus-work';
    if (isTod) cls += ' aus-today';

    var title;
    if (!isWork)                          title = 'Día libre habitual';
    else if (state === 'absent')          title = 'Ausente (clic para quitar)';
    else if (state === 'absent-pending')  title = 'Se marcará ausente al guardar';
    else if (state === 'work-pending')    title = 'Se quitará la ausencia al guardar';
    else                                  title = 'Marcar ausente';

    var click = isWork
      ? 'onclick="toggleAusencia(\'' + wid + '\',\'' + key + '\')" title="' + title + '"'
      : 'title="' + title + '"';

    cells += '<div class="' + cls + '" ' + click + '>' + d + '</div>';
  }

  var total = startOff + lastDay.getDate();
  var rem   = total % 7;
  if (rem > 0) for (var f = rem; f < 7; f++) cells += '<div class="aus-cell aus-empty"></div>';

  // Contar ausencias del mes (estado efectivo tras pendientes).
  var monthStr = year + '-' + pad(month + 1);
  var monthSaved   = (getWorkerAusList(wid) || []).filter(function (s) { return s.indexOf(monthStr) === 0; });
  var monthPending = _ausPending[String(wid)] || {};
  var monthEffective = monthSaved.slice();
  Object.keys(monthPending).forEach(function (date) {
    if (date.indexOf(monthStr) !== 0) return;
    if (monthPending[date] === 'add' && monthEffective.indexOf(date) === -1) monthEffective.push(date);
    if (monthPending[date] === 'remove') {
      var i = monthEffective.indexOf(date);
      if (i > -1) monthEffective.splice(i, 1);
    }
  });
  var monthAus = monthEffective.length;

  // Barra de acciones — solo aparece si hay cambios pendientes.
  var pendN = pendingCount(wid);
  var actionsBar = pendN > 0
    ? '<div class="aus-actions">' +
        '<div class="aus-pending-info">' + pendN + ' cambio' + (pendN > 1 ? 's' : '') + ' sin guardar</div>' +
        '<div class="aus-actions-btns">' +
          '<button class="btn-sm" id="aus-discard-' + wid + '" onclick="discardAusencias(\'' + wid + '\')">Descartar</button>' +
          '<button class="btn-save" id="aus-save-' + wid + '" onclick="saveAusencias(\'' + wid + '\')">Guardar (' + pendN + ')</button>' +
        '</div>' +
      '</div>'
    : '';

  el.innerHTML =
    '<div class="aus-header">' +
      '<div class="aus-worker-name">' + worker.nombre + ' — Calendario de ausencias</div>' +
      '<div class="aus-nav-row">' +
        '<button class="aus-nav" onclick="ausCalNav(-1)">&#8249;</button>' +
        '<span class="aus-cal-title">' +
          MONTHS_LONG[month] + ' ' + year +
          (monthAus > 0 ? ' <span class="aus-month-badge">' + monthAus + ' aus.</span>' : '') +
        '</span>' +
        '<button class="aus-nav" onclick="ausCalNav(1)">&#8250;</button>' +
      '</div>' +
    '</div>' +
    '<div class="aus-legend">' +
      '<span class="aus-leg"><span class="aus-dot aus-dot-work"></span>Trabaja</span>' +
      '<span class="aus-leg"><span class="aus-dot aus-dot-absent"></span>Ausente / vacaciones</span>' +
      '<span class="aus-leg"><span class="aus-dot aus-dot-pending"></span>Cambio sin guardar</span>' +
      '<span class="aus-leg"><span class="aus-dot aus-dot-nowork"></span>Libre habitual</span>' +
    '</div>' +
    '<div class="aus-grid-wrap">' +
      '<div class="aus-dow-row">' + dowRow + '</div>' +
      '<div class="aus-weeks">' + cells + '</div>' +
    '</div>' +
    actionsBar +
    '<div class="aus-footer-note">Haz clic en los días para marcarlos/desmarcarlos como ausencia. Los cambios aparecen rayados hasta que pulses <strong>Guardar</strong>.</div>';
}

/* ════════════════════════════════════════════════════════════
   MÓDULO: GESTIÓN DE SERVICIOS
   Almacenamiento: Supabase via /api/servicios
   (antes era localStorage — ver REVISION-CODIGO.md punto #1)

   Cada servicio tiene:
     - id              : number   ← lo asigna Supabase
     - nombre          : string
     - duracion_display: string   ← lo que ve el cliente ("3 horas", "45 min")
     - duracion_min    : number   ← minutos que bloquea el calendario
     - precio          : number   (opcional)
     - pop             : boolean  (marca "POPULAR" en la web pública)
     - orden           : number   (orden manual; lo gestiona Supabase por id)

   Patrón:
     - _svcs es caché en memoria. La primera vez se carga async.
     - saveSvc / deleteSvc hacen fetch a la API y luego refrescan _svcs.
   ════════════════════════════════════════════════════════════ */

var _svcs         = null;
var _editingSvcId = null;

// Carga inicial async. Devuelve una promesa con la lista cacheada.
function fetchSvcs() {
  return fetch('/api/servicios?negocio=' + NEGOCIO)
    .then(function (r) { return r.json(); })
    .then(function (d) { _svcs = d.servicios || []; return _svcs; })
    .catch(function () { _svcs = []; return _svcs; });
}

function renderServicios() {
  document.getElementById('date-heading').textContent = 'Catálogo de servicios';
  document.getElementById('view-content').innerHTML =
    '<div class="equipo-header">' +
      '<div class="equipo-title">Servicios</div>' +
      '<button class="btn-add" onclick="showSvcForm(null)">+ Añadir servicio</button>' +
    '</div>' +
    '<div class="svc-intro">Define los servicios que ofrece el negocio. Para servicios con tiempo de espera (tinte, mechas…) puedes indicar una duración visible diferente a la duración real en agenda.</div>' +
    '<div id="svc-form-wrap" style="display:none"></div>' +
    '<div id="svcs-list"><div class="loading-state">Cargando…</div></div>';

  fetchSvcs().then(renderSvcsList);
}

// Pinta solo la parte del listado (sin tocar el formulario). Se usa también
// tras guardar/eliminar para refrescar sin parpadeo.
function renderSvcsList() {
  var el = document.getElementById('svcs-list');
  if (!el) return;
  var svcs = _svcs || [];

  if (svcs.length === 0) {
    el.innerHTML = '<div class="empty-state">Sin servicios. Añade el primero.</div>';
    return;
  }

  el.innerHTML = svcs.map(function (s) {
    var sameTime = (s.duracion_display === s.duracion_min + ' min') || !s.duracion_display;
    var displayLabel = s.duracion_display || (s.duracion_min + ' min');
    return '<div class="svc-card" id="scard-' + s.id + '">' +
      (s.imagen_url
        ? '<div class="svc-thumb"><img src="' + s.imagen_url + '" alt="" loading="lazy"></div>'
        : '') +
      '<div class="svc-info">' +
        '<div class="svc-name">' + s.nombre + '</div>' +
        '<div class="svc-pills">' +
          (s.categoria ? '<span class="svc-pill svc-pill-cat">' + s.categoria + '</span>' : '') +
          '<span class="svc-pill svc-pill-client" title="Duración que ve el cliente">' + displayLabel + '</span>' +
          (!sameTime
            ? '<span class="svc-pill svc-pill-agenda" title="Tiempo que ocupa en la agenda del trabajador">' + s.duracion_min + ' min agenda</span>'
            : '') +
          (s.precio ? '<span class="svc-pill svc-pill-price">' + s.precio + '€</span>' : '') +
        '</div>' +
        (!sameTime
          ? '<div class="svc-note-inline">El cliente espera ' + displayLabel + ' pero el trabajador queda libre tras ' + s.duracion_min + ' min</div>'
          : '') +
      '</div>' +
      '<div class="worker-actions">' +
        '<button class="btn-sm" onclick="showSvcForm(' + JSON.stringify(s).replace(/"/g, '&quot;') + ')">Editar</button>' +
        '<button class="btn-sm btn-danger" onclick="deleteSvc(' + s.id + ',\'' + s.nombre.replace(/'/g, "\\'") + '\')">Eliminar</button>' +
      '</div>' +
    '</div>';
  }).join('');
}

function showSvcForm(svc) {
  _editingSvcId = svc ? svc.id : null;
  var wrap = document.getElementById('svc-form-wrap');
  if (!wrap) return;

  wrap.innerHTML =
    '<div class="worker-form svc-form">' +
      '<h3>' + (svc ? 'Editar servicio' : 'Nuevo servicio') + '</h3>' +
      '<div class="form-row">' +
        '<div class="form-group" style="flex:1">' +
          '<label class="form-label">Nombre del servicio *</label>' +
          '<input type="text" id="sv-nombre" class="form-input" placeholder="Ej: Tinte + corte" ' +
            'value="' + (svc ? svc.nombre : '') + '" style="width:100%">' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-label">Precio (€)</label>' +
          '<input type="number" id="sv-precio" class="form-input" placeholder="0" min="0" step="0.5" ' +
            'value="' + (svc ? (svc.precio || '') : '') + '" style="width:90px">' +
        '</div>' +
      '</div>' +
      '<div class="svc-dur-section">' +
        '<div class="svc-dur-col">' +
          '<label class="form-label">Duración visible al cliente *</label>' +
          '<input type="text" id="sv-display" class="form-input" placeholder="Ej: 3 horas, 45 min…" ' +
            'value="' + (svc ? svc.duracion_display : '') + '" oninput="updateSvcExample()">' +
          '<div class="svc-dur-hint">Texto libre que verá el cliente al reservar</div>' +
        '</div>' +
        '<div class="svc-dur-arrow">→</div>' +
        '<div class="svc-dur-col">' +
          '<label class="form-label">Minutos que ocupa en agenda *</label>' +
          '<input type="number" id="sv-durmin" class="form-input" placeholder="30" min="5" step="5" ' +
            'value="' + (svc ? svc.duracion_min : '') + '" oninput="updateSvcExample()" style="width:90px">' +
          '<div class="svc-dur-hint">Tiempo que se bloquea en el calendario del trabajador</div>' +
        '</div>' +
      '</div>' +
      '<div class="svc-example" id="sv-example"></div>' +

      '<div class="form-row" style="margin-top:8px">' +
        '<div class="form-group" style="flex:1">' +
          '<label class="form-label">Categoría <span style="font-weight:400;color:#9ca3af">(opcional)</span></label>' +
          '<input type="text" id="sv-categoria" class="form-input" list="sv-cat-list" ' +
            'placeholder="Pollos · Carnes · Guarniciones · Postres · Bebidas" ' +
            'value="' + (svc && svc.categoria ? svc.categoria : '') + '" style="width:100%">' +
          '<datalist id="sv-cat-list">' +
            '<option value="Pollos">' +
            '<option value="Carnes">' +
            '<option value="Guarniciones">' +
            '<option value="Postres">' +
            '<option value="Bebidas">' +
            '<option value="Otros">' +
          '</datalist>' +
        '</div>' +
      '</div>' +

      '<div class="form-row">' +
        '<div class="form-group" style="flex:1">' +
          '<label class="form-label">URL de imagen <span style="font-weight:400;color:#9ca3af">(opcional)</span></label>' +
          '<input type="url" id="sv-imagen" class="form-input" ' +
            'placeholder="https://… (enlace a la foto del producto)" ' +
            'value="' + (svc && svc.imagen_url ? svc.imagen_url : '') + '" style="width:100%">' +
          '<div class="svc-dur-hint">Pega aquí la URL pública de una foto del producto. Aparecerá en la carta del cliente.</div>' +
        '</div>' +
      '</div>' +

      '<div class="form-actions">' +
        '<button class="btn-save" onclick="saveSvc()">Guardar servicio</button>' +
        '<button class="btn-cancel-form" onclick="hideSvcForm()">Cancelar</button>' +
      '</div>' +
    '</div>';

  updateSvcExample();
  wrap.style.display = 'block';
  wrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function updateSvcExample() {
  var display = (document.getElementById('sv-display') || {}).value || '';
  var durMin  = parseInt((document.getElementById('sv-durmin') || {}).value) || 0;
  var el      = document.getElementById('sv-example');
  if (!el) return;
  display = display.trim();
  if (!display || !durMin) { el.innerHTML = ''; el.style.display = 'none'; return; }
  el.style.display = 'block';
  var dispMins = parseDisplayDur(display);
  if (dispMins && dispMins !== durMin) {
    el.className = 'svc-example svc-example-split';
    el.innerHTML =
      '<strong>Ejemplo — Tinte:</strong> el cliente ve <em>"' + display + '"</em> de duración. ' +
      'El sistema bloquea solo <em>' + durMin + ' min</em> en el calendario — ' +
      'tras aplicar el producto el trabajador puede atender otra cita o tarea mientras el cliente espera.';
  } else {
    el.className = 'svc-example svc-example-same';
    el.innerHTML =
      'El cliente verá <em>"' + display + '"</em> y el sistema bloqueará <em>' + durMin + ' min</em> en la agenda.';
  }
}

function parseDisplayDur(s) {
  var h = s.match(/(\d+)\s*h/i);
  var m = s.match(/(\d+)\s*min/i);
  var total = (h ? parseInt(h[1]) * 60 : 0) + (m ? parseInt(m[1]) : 0);
  return total || null;
}

function hideSvcForm() {
  var wrap = document.getElementById('svc-form-wrap');
  if (wrap) wrap.style.display = 'none';
  _editingSvcId = null;
}

function saveSvc() {
  var nombre  = ((document.getElementById('sv-nombre')  || {}).value || '').trim();
  var display = ((document.getElementById('sv-display') || {}).value || '').trim();
  var durMin  = parseInt((document.getElementById('sv-durmin')  || {}).value) || 0;
  var precio  = parseFloat((document.getElementById('sv-precio') || {}).value) || 0;

  if (!nombre)  { alert('El nombre del servicio es obligatorio.'); return; }
  if (!display) { alert('La duración visible al cliente es obligatoria.'); return; }
  if (!durMin)  { alert('Los minutos en agenda son obligatorios (mínimo 5).'); return; }

  var categoria = ((document.getElementById('sv-categoria') || {}).value || '').trim();
  var imagenUrl = ((document.getElementById('sv-imagen')    || {}).value || '').trim();

  var body = {
    negocio:          NEGOCIO,
    nombre:           nombre,
    duracion_display: display,
    duracion_min:     durMin,
    precio:           precio || null,
    categoria:        categoria || null,
    imagen_url:       imagenUrl || null
  };
  if (_editingSvcId !== null) body.id = _editingSvcId;

  // Deshabilitar el botón mientras guardamos para evitar dobles envíos.
  var btn = document.querySelector('.svc-form .btn-save');
  if (btn) { btn.disabled = true; btn.textContent = 'Guardando…'; }

  fetch('/api/servicios', {
    method:  'POST',
    headers: authHeaders({ json: true }),
    body:    JSON.stringify(body)
  })
    .then(function (r) { return r.json(); })
    .then(function (d) {
      if (!d.ok) throw new Error(d.error || 'Error desconocido');

      // Actualizar caché local con la respuesta del servidor (que incluye el id real)
      if (!_svcs) _svcs = [];
      if (_editingSvcId !== null) {
        for (var i = 0; i < _svcs.length; i++) {
          if (_svcs[i].id === _editingSvcId) { _svcs[i] = d.servicio; break; }
        }
      } else {
        _svcs.push(d.servicio);
      }

      hideSvcForm();
      renderSvcsList();
    })
    .catch(function (e) {
      if (btn) { btn.disabled = false; btn.textContent = 'Guardar servicio'; }
      alert('No se pudo guardar el servicio: ' + e.message);
    });
}

function deleteSvc(id, nombre) {
  if (!confirm('¿Eliminar el servicio "' + nombre + '"?')) return;

  fetch('/api/servicios?id=' + id, { method: 'DELETE', headers: authHeaders() })
    .then(function (r) { return r.json(); })
    .then(function (d) {
      if (!d.ok) throw new Error(d.error || 'Error desconocido');
      _svcs = (_svcs || []).filter(function (s) { return s.id !== id; });
      renderSvcsList();
    })
    .catch(function (e) {
      alert('No se pudo eliminar el servicio: ' + e.message);
    });
}
