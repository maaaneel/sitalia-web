/* ══ restaurante.js — Casa Lola demo scripts ════════════════════════════════ */

// ─── Carta Tabs ─────────────────────────────────────────────────────────────
function showTab(id, btn) {
  document.querySelectorAll('.menu-panel').forEach(function(p){ p.classList.remove('active'); });
  document.querySelectorAll('.menu-tab').forEach(function(t){ t.classList.remove('active'); });
  document.getElementById('tab-' + id).classList.add('active');
  btn.classList.add('active');
}

// ─── Reservas ────────────────────────────────────────────────────────────────
var RES_SLOTS_COMIDA = ['13:30','14:00','14:30','15:00','15:30'];
var RES_SLOTS_CENA   = ['20:00','20:30','21:00','21:30','22:00','22:30'];
var RES_BOOKED_C = [1, 3];
var RES_BOOKED_N = [0, 2, 4];
var res = { date: null, pax: null, slot: null, name: '', phone: '' };

function resDateChange() {
  res.date = document.getElementById('res-date').value || null;
  res.slot = null;
  var btn2 = document.getElementById('resbtn2');
  if (btn2) btn2.disabled = true;
  checkResBtn1();
}
function resPaxChange() { res.pax = document.getElementById('res-pax').value || null; checkResBtn1(); }
function checkResBtn1() { document.getElementById('resbtn1').disabled = !(res.date && res.pax); }

function resTo(n) {
  if (n > 1 && !(res.date && res.pax)) return;
  if (n > 2 && !res.slot) return;
  document.querySelectorAll('.res-panel').forEach(function(p){ p.classList.remove('active'); });
  document.querySelectorAll('.res-step').forEach(function(s){ s.classList.remove('active'); });
  document.getElementById('rspanel' + n).classList.add('active');
  document.getElementById('rstab' + n).classList.add('active');
  if (n === 2) renderResSlots();
  if (n === 3) renderResSummary();
}

function renderResSlots() {
  var d = res.date ? new Date(res.date + 'T12:00:00') : null;
  var dow = d ? d.getDay() : -1;
  var grid = document.getElementById('res-slots-grid');
  grid.innerHTML = '';
  if (dow === 1) {
    grid.innerHTML = '<p style="font-size:13px;color:var(--text-muted);padding:16px 0">Cerrado los lunes. Elige otra fecha.</p>';
    return;
  }
  renderSlotGroup(grid, RES_SLOTS_COMIDA, RES_BOOKED_C, 'Comida');
  if (dow !== 0) renderSlotGroup(grid, RES_SLOTS_CENA, RES_BOOKED_N, 'Cena');
}

function renderSlotGroup(grid, slots, booked, label) {
  var title = document.createElement('div');
  title.style.cssText = 'grid-column:1/-1;font-size:10px;letter-spacing:.15em;text-transform:uppercase;color:var(--text-muted);padding:12px 0 4px;border-top:1px solid var(--border-light);margin-top:8px';
  title.textContent = label;
  grid.appendChild(title);
  slots.forEach(function(slot, i) {
    var btn = document.createElement('button');
    btn.className = 'res-slot' + (booked.indexOf(i) > -1 ? ' booked' : '');
    btn.textContent = slot;
    btn.disabled = booked.indexOf(i) > -1;
    btn.onclick = function() {
      if (btn.classList.contains('booked')) return;
      document.querySelectorAll('.res-slot').forEach(function(s){ s.classList.remove('selected'); });
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
  var paxLabel = res.pax === '8' ? '8+ personas' : res.pax + (res.pax === '1' ? ' persona' : ' personas');
  document.getElementById('res-summary').innerHTML =
    '<div class="res-confirm-row"><span style="font-size:11px;color:var(--text-muted)">FECHA</span><span>' + dateStr + '</span></div>' +
    '<div class="res-confirm-row"><span style="font-size:11px;color:var(--text-muted)">HORA</span><span>' + res.slot + 'h</span></div>' +
    '<div class="res-confirm-row"><span style="font-size:11px;color:var(--text-muted)">PERSONAS</span><span>' + paxLabel + '</span></div>';
  resCheckData();
}

function resCheckData() {
  var name  = (document.getElementById('res-name')  || {value:''}).value.trim();
  var phone = (document.getElementById('res-phone') || {value:''}).value.trim();
  res.name = name; res.phone = phone;
  var btn = document.getElementById('resbtn3');
  if (btn) btn.disabled = !(name && phone);
}

function resWA() {
  var d = new Date(res.date + 'T12:00:00');
  var DAYS = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  var MONS = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  var dateStr = DAYS[d.getDay()] + ', ' + d.getDate() + ' de ' + MONS[d.getMonth()];
  var paxLabel = res.pax === '8' ? '8+ personas' : res.pax + (res.pax === '1' ? ' persona' : ' personas');
  var msg = 'Hola, quiero reservar una mesa en Casa Lola:\n\nFecha: ' + dateStr + '\nHora: ' + res.slot + 'h\nPersonas: ' + paxLabel + '\nNombre: ' + res.name + '\nTeléfono: ' + res.phone + '\n\n¿Podéis confirmar? Gracias!';
  window.open('https://wa.me/34912345678?text=' + encodeURIComponent(msg), '_blank');
  document.getElementById('res-wizard').style.display = 'none';
  document.getElementById('res-success').style.display = 'block';
}

function resetRes() {
  res = { date: null, pax: null, slot: null, name: '', phone: '' };
  document.getElementById('res-date').value = '';
  document.getElementById('res-pax').value = '';
  document.getElementById('resbtn1').disabled = true;
  document.getElementById('res-wizard').style.display = 'block';
  document.getElementById('res-success').style.display = 'none';
  resTo(1);
}

// ─── Date min = today ────────────────────────────────────────────────────────
(function() {
  var input = document.getElementById('res-date');
  if (input) {
    var t = new Date();
    input.min = t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0');
  }
})();
