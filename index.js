/* ══ index.js — Sitalia landing page scripts ══════════════════════════════ */

// ─── Scroll Reveal ─────────────────────────────────────────────────────────
(function initReveal() {
  var obs = new IntersectionObserver(function(entries) {
    entries.forEach(function(e) {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(function(el) { obs.observe(el); });
})();

// ─── Formulario de contacto ────────────────────────────────────────────────
// Guarda el lead en Supabase + envía emails de notificación (vía /api/contact)
async function enviarContacto() {
  var nombre      = (document.getElementById('cf-nombre')   || {}).value || '';
  var apellido    = (document.getElementById('cf-apellido') || {}).value || '';
  var email       = (document.getElementById('cf-email')    || {}).value || '';
  var telefono    = (document.getElementById('cf-tel')      || {}).value || '';
  var tipo_negocio = (document.getElementById('cf-tipo')    || {}).value || '';
  var mensaje     = (document.getElementById('cf-msg')      || {}).value || '';

  if (!nombre || !apellido || !email || !tipo_negocio) {
    alert('Por favor rellena los campos obligatorios: nombre, apellido, email y tipo de negocio.');
    return;
  }

  var btn    = document.getElementById('cf-btn');
  var btnTxt = document.getElementById('cf-btn-txt');
  var okDiv  = document.getElementById('cf-ok');

  btn.disabled   = true;
  btnTxt.textContent = 'Enviando…';

  try {
    var res = await fetch('/api/contact', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ nombre, apellido, email, telefono, tipo_negocio, mensaje }),
    });

    if (!res.ok) throw new Error('Error ' + res.status);

    // Éxito: ocultar botón y mostrar confirmación
    btn.style.display    = 'none';
    okDiv.style.display  = 'block';

  } catch (err) {
    console.error('enviarContacto:', err);
    btn.disabled   = false;
    btnTxt.textContent = 'Enviar mensaje';
    alert('Hubo un error al enviar el formulario. Por favor inténtalo de nuevo o escríbenos a hola@sitalia.es');
  }
}
