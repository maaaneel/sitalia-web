/* ============================================================
   Anna Acosta Psicología — script.js
   Menú móvil · enlace activo · filtros de recursos ·
   acordeón FAQ · formulario · animación al hacer scroll
   ============================================================ */
(function () {
  'use strict';

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

    // cerrar al pulsar un enlace
    navLinks.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        navLinks.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.textContent = '☰';
      });
    });
  }

  /* ---------- 2. Enlace de navegación activo ---------- */
  var sections = Array.prototype.slice.call(
    document.querySelectorAll('section[id], header[id]')
  );
  var navAnchors = navLinks
    ? Array.prototype.slice.call(navLinks.querySelectorAll('a[href^="#"]'))
    : [];

  function setActiveLink() {
    var pos = window.scrollY + 100;
    var current = null;
    sections.forEach(function (s) {
      if (s.offsetTop <= pos) current = s.id;
    });
    navAnchors.forEach(function (a) {
      a.classList.toggle('active', a.getAttribute('href') === '#' + current);
    });
  }

  var ticking = false;
  window.addEventListener(
    'scroll',
    function () {
      if (!ticking) {
        window.requestAnimationFrame(function () {
          setActiveLink();
          ticking = false;
        });
        ticking = true;
      }
    },
    { passive: true }
  );
  setActiveLink();

  /* ---------- 3. Filtros de recursos (doble filtro) ---------- */
  var state = { tipo: 'all', tema: 'all' };
  var resCards = Array.prototype.slice.call(document.querySelectorAll('.res-card'));
  var resEmpty = document.getElementById('resEmpty');

  function applyFilters() {
    var visible = 0;
    resCards.forEach(function (card) {
      var okTipo = state.tipo === 'all' || card.dataset.tipo === state.tipo;
      var okTema = state.tema === 'all' || card.dataset.tema === state.tema;
      var show = okTipo && okTema;
      card.hidden = !show;
      if (show) visible++;
    });
    if (resEmpty) resEmpty.hidden = visible !== 0;
  }

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

  /* ---------- 4. Acordeón FAQ: solo una abierta por columna ---------- */
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

  /* ---------- 5. Formulario de contacto ----------
     PENDIENTE: conectar a un servicio real de envío.
     Opción rápida (Formspree):
        <form action="https://formspree.io/f/TU_ID" method="POST">
     y elimina este bloque JS de validación/simulación.
  ------------------------------------------------- */
  var form = document.getElementById('contactForm');
  var status = document.getElementById('formStatus');

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!status) return;

      var nombre = form.nombre.value.trim();
      var email = form.email.value.trim();
      var rgpd = form.rgpd.checked;

      if (!nombre || !email) {
        status.textContent = 'Por favor, completa tu nombre y tu email.';
        status.className = 'form-status err';
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        status.textContent = 'Revisa el formato del email.';
        status.className = 'form-status err';
        return;
      }
      if (!rgpd) {
        status.textContent = 'Necesito que aceptes la política de privacidad.';
        status.className = 'form-status err';
        return;
      }

      status.textContent =
        'Formulario validado correctamente (envío aún no conectado).';
      status.className = 'form-status ok';
    });
  }

  /* ---------- 6. Animación al entrar en pantalla ---------- */
  var revealSelectors =
    '.serv-card, .paso-card, .res-card, .stat-box, .about-text, .about-media, ' +
    '.summary-block, .booking-cta, .contact-form, .section-head';

  var revealEls = Array.prototype.slice.call(document.querySelectorAll(revealSelectors));
  revealEls.forEach(function (el) {
    el.classList.add('reveal');
  });

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
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    revealEls.forEach(function (el) {
      io.observe(el);
    });
  } else {
    revealEls.forEach(function (el) {
      el.classList.add('is-visible');
    });
  }

  /* ---------- 7. Año en el footer ---------- */
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
