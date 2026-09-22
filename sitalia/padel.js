/* ══ padel.js — Pádel Arena demo scripts ══════════════════════════════════════ */

// ─── Datos de pistas y slots ──────────────────────────────────────────────────
var PISTAS = [
  {n:'Pista 1', t:'Cubierta · Cristal', busy:false},
  {n:'Pista 2', t:'Cubierta · Cristal', busy:true},
  {n:'Pista 3', t:'Cubierta · Muro',    busy:false},
  {n:'Pista 4', t:'Cubierta · Muro',    busy:true},
  {n:'Pista 5', t:'Exterior · LED',     busy:false},
  {n:'Pista 6', t:'Exterior · LED',     busy:true},
  {n:'Pista 7', t:'Exterior · LED',     busy:false},
  {n:'Pista 8', t:'Cubierta · Cristal', busy:false}
];
var SLOTS = [
  '08:00','08:30','09:00','09:30','10:00','10:30','11:00','12:00',
  '16:00','16:30','17:00','17:30','18:00','18:30','19:00','20:00','20:30','21:00'
];
var BOOKED_SLOTS = [1, 3, 7, 10, 14];

// ─── Estado de la reserva ─────────────────────────────────────────────────────
var res = {date: null, tipo: '', pista: null, slot: null, name: '', phone: ''};

// ─── Paso 1: fecha y tipo ─────────────────────────────────────────────────────
function resDateChange() {
  res.date  = document.getElementById('res-date').value || null;
  res.pista = null;
  res.slot  = null;
  document.getElementById('resbtn1').disabled = !res.date;
}
function resTipoChange() {
  res.tipo = document.getElementById('res-tipo').value;
}

// ─── Navegación entre pasos ───────────────────────────────────────────────────
function resTo(n) {
  if (n > 1 && !res.date) return;
  if (n > 2 && (!res.pista || !res.slot)) return;
  document.querySelectorAll('.res-panel').forEach(function(p) { p.classList.remove('active'); });
  document.querySelectorAll('.res-step').forEach(function(s)  { s.classList.remove('active'); });
  document.getElementById('rspanel' + n).classList.add('active');
  document.getElementById('rstab'   + n).classList.add('active');
  if (n === 2) renderPistas();
  if (n === 3) renderSummary();
}

// ─── Renderizar pistas disponibles ───────────────────────────────────────────
function renderPistas() {
  var grid = document.getElementById('res-pistas-grid');
  grid.innerHTML = '';
  var tipo = document.getElementById('res-tipo').value;
  PISTAS.forEach(function(p) {
    if (tipo === 'cubierta' && p.t.indexOf('Cubierta') < 0) return;
    if (tipo === 'exterior' && p.t.indexOf('Exterior') < 0) return;
    var btn = document.createElement('button');
    btn.className = 'res-pista' + (p.busy ? ' busy' : '');
    btn.disabled  = p.busy;
    btn.innerHTML = '<div class="res-pista-name">' + p.n + '</div><div class="res-pista-type">' + p.t + '</div>';
    if (!p.busy) {
      btn.onclick = function() {
        document.querySelectorAll('.res-pista').forEach(function(b) { b.classList.remove('selected'); });
        btn.classList.add('selected');
        res.pista = p.n;
        res.slot  = null;
        document.getElementById('resbtn2').disabled = true;
        document.getElementById('res-slots-wrap').style.display = 'block';
        renderSlots();
      };
    }
    grid.appendChild(btn);
  });
}

// ─── Renderizar slots de hora ─────────────────────────────────────────────────
function renderSlots() {
  var grid = document.getElementById('res-slots-grid');
  grid.innerHTML = '';
  SLOTS.forEach(function(slot, i) {
    var busy = BOOKED_SLOTS.indexOf(i) > -1;
    var btn  = document.createElement('button');
    btn.className  = 'res-slot' + (busy ? ' booked' : '');
    btn.textContent = slot;
    btn.disabled   = busy;
    if (!busy) {
      btn.onclick = function() {
        document.querySelectorAll('.res-slot').forEach(function(b) { b.classList.remove('selected'); });
        btn.classList.add('selected');
        res.slot = slot;
        document.getElementById('resbtn2').disabled = false;
      };
    }
    grid.appendChild(btn);
  });
}

// ─── Renderizar resumen paso 3 ────────────────────────────────────────────────
function renderSummary() {
  var d      = new Date(res.date + 'T12:00:00');
  var days   = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  var months = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  var dateStr = days[d.getDay()] + ', ' + d.getDate() + ' de ' + months[d.getMonth()];
  document.getElementById('res-summary').innerHTML =
    '<div class="res-confirm-row"><span class="res-confirm-label">Pista</span><span class="res-confirm-value">' + res.pista + '</span></div>' +
    '<div class="res-confirm-row"><span class="res-confirm-label">Fecha</span><span class="res-confirm-value">' + dateStr + '</span></div>' +
    '<div class="res-confirm-row"><span class="res-confirm-label">Hora</span><span class="res-confirm-value">' + res.slot + 'h (90 min)</span></div>';
  resCheckData();
}

// ─── Validar datos paso 3 ─────────────────────────────────────────────────────
function resCheckData() {
  var name  = (document.getElementById('res-name')  || {value: ''}).value.trim();
  var phone = (document.getElementById('res-phone') || {value: ''}).value.trim();
  res.name  = name;
  res.phone = phone;
  var btn = document.getElementById('resbtn3');
  if (btn) btn.disabled = !(name && phone);
}

// ─── Envío por WhatsApp ───────────────────────────────────────────────────────
function resWA() {
  var d      = new Date(res.date + 'T12:00:00');
  var days   = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  var months = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  var dateStr = days[d.getDay()] + ', ' + d.getDate() + ' de ' + months[d.getMonth()];
  var socio = (document.getElementById('res-socio') || {value: 'no'}).value;
  var socioLabel = {no:'No socio', basico:'Socio Básico', premium:'Socio Premium', pro:'Socio Club Pro'}[socio] || '';
  var lines = [
    'Hola, quiero reservar una pista en Pádel Arena:',
    '',
    'Pista: '    + res.pista,
    'Fecha: '    + dateStr,
    'Hora: '     + res.slot + 'h (90 min)',
    'Nombre: '   + res.name,
    'Teléfono: ' + res.phone,
    'Condición: '+ socioLabel,
    '',
    'Podéis confirmar? Gracias!'
  ];
  window.open('https://wa.me/34961123456?text=' + encodeURIComponent(lines.join('\n')), '_blank');
  document.getElementById('res-wizard').style.display  = 'none';
  document.getElementById('res-success').style.display = 'block';
}

// ─── Reset del wizard ─────────────────────────────────────────────────────────
function resetRes() {
  res = {date: null, tipo: '', pista: null, slot: null, name: '', phone: ''};
  document.getElementById('res-date').value      = '';
  document.getElementById('resbtn1').disabled    = true;
  document.getElementById('resbtn2').disabled    = true;
  document.getElementById('res-slots-wrap').style.display = 'none';
  document.getElementById('res-wizard').style.display  = 'block';
  document.getElementById('res-success').style.display = 'none';
  resTo(1);
}

// ─── Fecha mínima = hoy ───────────────────────────────────────────────────────
(function() {
  var i = document.getElementById('res-date');
  if (i) {
    var t = new Date();
    i.min = t.getFullYear() + '-' +
            String(t.getMonth() + 1).padStart(2, '0') + '-' +
            String(t.getDate()).padStart(2, '0');
  }
})();
