/* ══ fisioterapia.js — FisioActiva demo scripts ═════════════════════════════ */

// ─── Datos ───────────────────────────────────────────────────────────────────
var SVCS = [
  { n: 'Fisioterapia Musculoesquelética', dur: '45-60 min', price: '45€' },
  { n: 'Fisioterapia Deportiva',          dur: '60 min',    price: '55€' },
  { n: 'Electroterapia y Ultrasonidos',   dur: '30 min',    price: '35€' },
  { n: 'Fisioterapia de Suelo Pélvico',   dur: '50 min',    price: '55€' },
  { n: 'Fisioterapia Neurológica',        dur: '60 min',    price: '60€' },
  { n: 'Masaje Terapéutico',             dur: '45 min',    price: '40€' },
  { n: 'Primera Consulta',               dur: '20 min',    price: 'Gratuita' }
];
var SLOTS_M  = ['08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30'];
var BOOKED_M = [1, 3, 5];
var SLOTS_T  = ['16:00','16:30','17:00','17:30','18:00','18:30','19:00','19:30','20:00','20:30'];
var BOOKED_T = [0, 2, 6, 8];
var res = { svc: null, date: null, slot: null, physio: '', name: '', phone: '', notes: '' };

// ─── Wizard ──────────────────────────────────────────────────────────────────
function resSvcChange() {
  var v = document.getElementById('res-svc').value;
  res.svc = v !== '' ? parseInt(v) : null;
  document.getElementById('resbtn1').disabled = res.svc === null;
}

function resDateChange() {
  var d = document.getElementById('res-date').value;
  res.date = d || null;
  res.slot = null;
  document.getElementById('resbtn2').disabled = true;
  renderResSlots();
}

function resTo(n) {
  if (n > 1 && res.svc === null) return;
  if (n > 2 && !res.slot) return;
  document.querySelectorAll('.res-panel').forEach(function(p) { p.classList.remove('active'); });
  document.querySelectorAll('.res-step').forEach(function(s)  { s.classList.remove('active'); });
  document.getElementById('rspanel' + n).classList.add('active');
  document.getElementById('rstab' + n).classList.add('active');
  if (n === 2) {
    var svc = SVCS[res.svc];
    document.getElementById('res-svc-chip').innerHTML =
      '<div class="res-svc-selected"><span class="res-svc-selected-name">' + svc.n + '</span>' +
      '<span class="res-svc-selected-meta">' + svc.dur + ' · ' + svc.price + '</span></div>';
    renderResSlots();
  }
  if (n === 3) renderResSummary();
}

function renderResSlots() {
  var grid = document.getElementById('res-slots-grid');
  if (!res.date) {
    grid.innerHTML = '<p style="font-size:13px;color:var(--text-muted);padding:12px 0">Selecciona una fecha.</p>';
    return;
  }
  var d = new Date(res.date + 'T12:00:00'), dow = d.getDay();
  grid.innerHTML = '';
  if (dow === 0) {
    grid.innerHTML = '<p style="font-size:13px;color:var(--text-muted);padding:12px 0">Cerrado domingos.</p>';
    return;
  }
  addSlotGroup(grid, 'Mañana', SLOTS_M, BOOKED_M);
  if (dow !== 6) addSlotGroup(grid, 'Tarde', SLOTS_T, BOOKED_T);
}

function addSlotGroup(grid, label, slots, booked) {
  var t = document.createElement('div');
  t.style.cssText = 'grid-column:1/-1;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--text-muted);padding:14px 0 4px;border-top:1px solid var(--border-light);margin-top:6px';
  t.textContent = label;
  grid.appendChild(t);
  slots.forEach(function(slot, i) {
    var btn = document.createElement('button');
    var isBooked = booked.indexOf(i) > -1;
    btn.className = 'res-slot' + (isBooked ? ' booked' : '');
    btn.textContent = slot;
    btn.disabled = isBooked;
    if (!isBooked) btn.onclick = function() {
      document.querySelectorAll('.res-slot').forEach(function(s) { s.classList.remove('selected'); });
      btn.classList.add('selected');
      res.slot = slot;
      document.getElementById('resbtn2').disabled = false;
    };
    grid.appendChild(btn);
  });
}

function renderResSummary() {
  var d = new Date(res.date + 'T12:00:00');
  var DAYS = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  var MONS = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  var dateStr = DAYS[d.getDay()] + ', ' + d.getDate() + ' de ' + MONS[d.getMonth()] + ' de ' + d.getFullYear();
  var svc = SVCS[res.svc];
  res.physio = document.getElementById('res-physio').value || 'Sin preferencia';
  document.getElementById('res-summary').innerHTML =
    '<div class="res-confirm-row"><span class="res-confirm-label">Tratamiento</span><span>' + svc.n + '</span></div>' +
    '<div class="res-confirm-row"><span class="res-confirm-label">Fecha y hora</span><span>' + dateStr + ' a las ' + res.slot + 'h</span></div>' +
    '<div class="res-confirm-row"><span class="res-confirm-label">Fisioterapeuta</span><span>' + res.physio + '</span></div>' +
    '<div class="res-confirm-row"><span class="res-confirm-label">Precio</span><span>' + svc.price + '</span></div>';
  resCheckData();
}

function resCheckData() {
  res.name  = (document.getElementById('res-name')  || { value: '' }).value.trim();
  res.phone = (document.getElementById('res-phone') || { value: '' }).value.trim();
  res.notes = (document.getElementById('res-notes') || { value: '' }).value.trim();
  var btn = document.getElementById('resbtn3');
  if (btn) btn.disabled = !(res.name && res.phone);
}

function resWA() {
  var svc = SVCS[res.svc];
  var d = new Date(res.date + 'T12:00:00');
  var DAYS = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  var MONS = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  var dateStr = DAYS[d.getDay()] + ', ' + d.getDate() + ' de ' + MONS[d.getMonth()];
  var lines = [
    'Hola, quiero reservar una cita en FisioActiva:', '',
    'Tratamiento: ' + svc.n,
    'Fecha: ' + dateStr,
    'Hora: ' + res.slot + 'h',
    'Fisioterapeuta: ' + (res.physio || 'Sin preferencia'),
    'Nombre: ' + res.name,
    'Teléfono: ' + res.phone
  ];
  if (res.notes) lines.push('Síntomas: ' + res.notes);
  lines.push('', '¿Podéis confirmar? Gracias!');
  window.open('https://wa.me/34931234567?text=' + encodeURIComponent(lines.join('\n')), '_blank');
  document.getElementById('res-wizard').style.display = 'none';
  document.getElementById('res-success').style.display = 'block';
}

function resetRes() {
  res = { svc: null, date: null, slot: null, physio: '', name: '', phone: '', notes: '' };
  document.getElementById('res-svc').value  = '';
  document.getElementById('res-date').value = '';
  ['resbtn1', 'resbtn2'].forEach(function(id) { document.getElementById(id).disabled = true; });
  document.getElementById('res-wizard').style.display  = 'block';
  document.getElementById('res-success').style.display = 'none';
  resTo(1);
}

// ─── Date min = today ────────────────────────────────────────────────────────
(function() {
  var i = document.getElementById('res-date');
  if (i) {
    var t = new Date();
    i.min = t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0');
  }
})();
