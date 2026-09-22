/* ══ academia.js — Academia Talento demo scripts ══════════════════════════════ */

// ─── Tab de actividades ───────────────────────────────────────────────────────
function showAct(id, btn) {
  document.querySelectorAll('.act-panel').forEach(function(p) { p.classList.remove('active'); });
  document.querySelectorAll('.act-tab').forEach(function(t) { t.classList.remove('active'); });
  document.getElementById('act-' + id).classList.add('active');
  btn.classList.add('active');
}

// ─── Formulario de inscripción ────────────────────────────────────────────────
function submitInsc() {
  var alumno = document.getElementById('f-alumno').value.trim();
  var edad   = document.getElementById('f-edad').value.trim();
  var act    = document.getElementById('f-actividad').value;
  var tel    = document.getElementById('f-tel').value.trim();
  if (!alumno || !edad || !tel) {
    alert('Rellena nombre, edad y teléfono.');
    return;
  }
  var como = document.getElementById('f-como').value;
  var lines = [
    'Hola, quiero solicitar una plaza en Academia Talento:',
    '',
    'Alumno: ' + alumno + ' (' + edad + ' años)',
    'Actividad: ' + (act || 'Por confirmar'),
    'Teléfono: ' + tel
  ];
  if (como) lines.push('Cómo nos conocisteis: ' + como);
  lines.push('', 'Nos gustaría hacer la semana de prueba gratuita. Gracias!');
  window.open('https://wa.me/34954123456?text=' + encodeURIComponent(lines.join('\n')), '_blank');
  document.getElementById('form-fields').style.display  = 'none';
  document.getElementById('form-success').style.display = 'block';
}
