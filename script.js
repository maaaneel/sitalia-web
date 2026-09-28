/* ============================================================
   Anna Acosta Psicología — script común a todas las páginas
   Menú móvil · filtros de recursos · formulario a WhatsApp ·
   animación al hacer scroll · año del footer
   ============================================================ */
(function () {
  'use strict';

  var WA_NUMERO = '34663260601';

  /* ---------- 1. Menú móvil ---------- */
  var navToggle = document.getElementById('navToggle');
  var navLinks = document.getElementById('navLinks');

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function () {
      var open = navLinks.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      navToggle.textContent = open ? '✕' : '☰';
      navToggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    });
    navLinks.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        navLinks.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.textContent = '☰';
      });
    });
  }

  /* ---------- 2. Filtros de recursos (doble filtro) ---------- */
  var resCards = Array.prototype.slice.call(document.querySelectorAll('.res-card'));

  if (resCards.length) {
    var state = { tipo: 'all', tema: 'all' };
    var resEmpty = document.getElementById('resEmpty');

    var applyFilters = function () {
      var visible = 0;
      resCards.forEach(function (card) {
        var okTipo = state.tipo === 'all' || card.dataset.tipo === state.tipo;
        var okTema = state.tema === 'all' || card.dataset.tema === state.tema;
        var show = okTipo && okTema;
        card.hidden = !show;
        if (show) visible++;
      });
      if (resEmpty) resEmpty.hidden = visible !== 0;
    };

    document.querySelectorAll('[data-filter-group]').forEach(function (group) {
      var key = group.dataset.filterGroup; // "tipo" | "tema"
      group.addEventListener('click', function (e) {
        var chip = e.target.closest('.chip');
        if (!chip) return;
        group.querySelectorAll('.chip').forEach(function (c) {
          c.classList.remove('is-active');
        });
        chip.classList.add('is-active');
        state[key] = chip.dataset.value;
        applyFilters();
      });
    });
    applyFilters();
  }

  /* ---------- 3. Acordeón FAQ: una abierta por columna ---------- */
  document.querySelectorAll('.faq-col').forEach(function (col) {
    var items = Array.prototype.slice.call(col.querySelectorAll('details.faq-item'));
    items.forEach(function (item) {
      item.addEventListener('toggle', function () {
        if (!item.open) return;
        items.forEach(function (other) {
          if (other !== item) other.open = false;
        });
      });
    });
  });

  /* ---------- 4. Formulario -> WhatsApp ----------
     No hay backend: compone el mensaje y abre WhatsApp.
  ------------------------------------------------- */
  var form = document.getElementById('contactForm');
  var status = document.getElementById('formStatus');

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var nombre = form.nombre.value.trim();
      var servicio = form.servicio.value;
      var mensaje = form.mensaje.value.trim();

      if (!nombre) {
        if (status) {
          status.textContent = 'Escribe tu nombre para poder saludarte.';
          status.className = 'form-status err';
        }
        form.nombre.focus();
        return;
      }

      var texto = 'Hola Anna, soy ' + nombre + '.\nMe interesa: ' + servicio + '.';
      if (mensaje) texto += '\n\n' + mensaje;

      if (status) {
        status.textContent = 'Abriendo WhatsApp…';
        status.className = 'form-status ok';
      }

      window.open(
        'https://wa.me/' + WA_NUMERO + '?text=' + encodeURIComponent(texto),
        '_blank',
        'noopener'
      );
    });
  }

  /* ---------- 5. Animación al entrar en pantalla ---------- */
  var revealEls = Array.prototype.slice.call(
    document.querySelectorAll(
      '.serv-card, .paso, .res-card, .bene article, .tres article, ' +
      '.compara div, .suena-list li, .summary, .head, .about-photo, .prose'
    )
  );
  revealEls.forEach(function (el) { el.classList.add('reveal'); });

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- 6. Año en el footer ---------- */
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
