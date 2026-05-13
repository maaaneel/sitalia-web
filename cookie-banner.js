/* ============================================================
   SITALIA — cookie-banner.js
   Banner informativo de cookies técnicas (sin tracking).

   Comportamiento:
   - Si el usuario ya lo aceptó (cookie sitalia_cookies_ok), no se muestra.
   - Si no, aparece en la esquina inferior derecha cuando carga la página.
   - Al pulsar "Entendido", se marca como aceptado (1 año) y se oculta.

   Si en el futuro se añaden cookies de tracking (analytics, ads),
   este banner deberá pasar a consentimiento granular con opciones.
   ============================================================ */
(function () {
  'use strict';

  var COOKIE_NAME = 'sitalia_cookies_ok';

  // Lee una cookie por nombre. Devuelve string vacío si no existe.
  function readCookie(name) {
    var m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
    return m ? decodeURIComponent(m[1]) : '';
  }

  // Marca como aceptado durante 1 año.
  function setAccepted() {
    var d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    document.cookie = COOKIE_NAME + '=1; expires=' + d.toUTCString() + '; path=/; SameSite=Lax';
  }

  function showBanner() {
    if (document.getElementById('sitalia-cookie-banner')) return;

    var div = document.createElement('div');
    div.id = 'sitalia-cookie-banner';
    div.className = 'sitalia-cookie-banner';
    div.setAttribute('role', 'dialog');
    div.setAttribute('aria-live', 'polite');
    div.setAttribute('aria-label', 'Aviso de cookies');
    div.innerHTML =
      '<div class="scb-inner">' +
        '<div class="scb-text">' +
          'Este sitio usa únicamente <strong>cookies técnicas</strong> necesarias para su funcionamiento. ' +
          'Más información en nuestra <a href="/cookies.html">política de cookies</a>.' +
        '</div>' +
        '<button type="button" class="scb-btn" id="scb-accept">Entendido</button>' +
      '</div>';
    document.body.appendChild(div);

    document.getElementById('scb-accept').addEventListener('click', function () {
      setAccepted();
      div.classList.add('scb-hide');
      setTimeout(function () { div.remove(); }, 250);
    });
  }

  function init() {
    if (readCookie(COOKIE_NAME) === '1') return;
    // Pequeño retraso para que no aparezca antes del primer pintado.
    setTimeout(showBanner, 400);
  }

  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();
