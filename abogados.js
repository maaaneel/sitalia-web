/* ══ abogados.js — Vidal & Asociados demo scripts ════════════════════════════ */

// ─── Formulario de consulta gratuita ─────────────────────────────────────────
function submitLead() {
  var name  = document.getElementById('f-name').value.trim();
  var phone = document.getElementById('f-phone').value.trim();
  var caso  = document.getElementById('f-caso').value.trim();
  if (!name || !phone || !caso) {
    alert('Por favor, rellene nombre, teléfono y descripción del caso.');
    return;
  }
  var email = document.getElementById('f-email').value.trim();
  var area  = document.getElementById('f-area').value;
  var lines = ['Buenos días, desearía una consulta gratuita:', '', 'Nombre: ' + name, 'Teléfono: ' + phone];
  if (email) lines.push('Email: ' + email);
  if (area)  lines.push('Área legal: ' + area);
  lines.push('', 'Descripción del caso:', caso, '', 'Quedo a su disposición. Muchas gracias.');
  window.open('https://wa.me/34914123456?text=' + encodeURIComponent(lines.join('\n')), '_blank');
  document.getElementById('form-fields').style.display  = 'none';
  document.getElementById('form-success').style.display = 'block';
}
