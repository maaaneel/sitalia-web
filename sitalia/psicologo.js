/* ══ psicologo.js — Elena Vidal Psicóloga demo scripts ══════════════════════ */

// ─── FAQ accordion ──────────────────────────────────────────────────────────
function toggleFaq(btn) {
  var a = btn.nextElementSibling;
  var isOpen = a.classList.contains('open');
  document.querySelectorAll('.faq-a').forEach(function(x) { x.classList.remove('open'); });
  document.querySelectorAll('.faq-q').forEach(function(x) { x.classList.remove('open'); });
  if (!isOpen) {
    a.classList.add('open');
    btn.classList.add('open');
  }
}

// ─── Contacto / pedir cita ──────────────────────────────────────────────────
function submitForm() {
  var name    = document.getElementById('f-name').value.trim();
  var contact = document.getElementById('f-contact').value.trim();
  if (!name || !contact) {
    alert('Por favor, rellena tu nombre y teléfono o email.');
    return;
  }
  var type    = document.getElementById('f-type').value;
  var horario = document.getElementById('f-horario').value;
  var msg_txt = document.getElementById('f-msg').value.trim();
  var lines = ['Hola Elena, quiero pedir una cita:', '', 'Nombre: ' + name, 'Contacto: ' + contact];
  if (type)    lines.push('Tipo: ' + type);
  if (horario) lines.push('Horario: ' + horario);
  if (msg_txt) lines.push('', msg_txt);
  lines.push('', 'Gracias.');
  window.open('https://wa.me/34912345678?text=' + encodeURIComponent(lines.join('\n')), '_blank');
  document.getElementById('form-fields').style.display  = 'none';
  document.getElementById('form-success').style.display = 'block';
}
