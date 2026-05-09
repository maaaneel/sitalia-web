/* ============================================================
   SITALIA — shared.js
   Lógica común para todas las demos de nicho
   ============================================================ */

(function () {
  'use strict';

  /* ── Nav: toggle móvil + sombra en scroll ──────────────── */
  function initNav() {
    var nav = document.querySelector('nav');
    var toggle = document.getElementById('nav-toggle');
    var navlinks = document.getElementById('navlinks');

    if (toggle && navlinks) {
      toggle.addEventListener('click', function () {
        navlinks.classList.toggle('open');
      });
      // Cerrar al hacer clic en un enlace
      navlinks.querySelectorAll('a').forEach(function (a) {
        a.addEventListener('click', function () {
          navlinks.classList.remove('open');
        });
      });
    }

    if (nav) {
      window.addEventListener('scroll', function () {
        nav.classList.toggle('scrolled', window.scrollY > 20);
      }, { passive: true });
    }
  }

  /* ── Scroll Reveal ─────────────────────────────────────── */
  function initReveal() {
    var els = document.querySelectorAll('.reveal');
    if (!els.length) return;

    if (!('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('visible'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    els.forEach(function (el) { io.observe(el); });
  }

  /* ── Booking Widget ────────────────────────────────────── */
  var MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  var DOWS   = ["Lu","Ma","Mi","Ju","Vi","Sa","Do"];

  var bk = { svc: null, date: null, slot: null, st: '', se: '' };
  var calD;
  var bkConfig = {};  // se inyecta desde cada demo: { svcs, sched, bookedIdx, phone, preselectSvc }

  function initBooking(config) {
    if (!document.getElementById('bp1')) return; // no hay widget en esta demo

    bkConfig = config || {};
    bk.svc = (config.preselectSvc !== undefined) ? config.preselectSvc : null;

    calD = new Date();
    calD.setDate(1);

    renderSvcs();
    renderCal();

    // Botón de toggle móvil del nav (puede llamarse desde aquí)
    var navCta = document.querySelector('.nav-cta');
    if (navCta) {
      navCta.addEventListener('click', function () {
        var section = document.getElementById('contacto') || document.getElementById('reservas');
        if (section) section.scrollIntoView({ behavior: 'smooth' });
      });
    }
  }

  function renderSvcs() {
    var wrap = document.getElementById('bk-svcs');
    if (!wrap || !bkConfig.svcs) return;

    bkConfig.svcs.forEach(function (s, i) {
      var el = document.createElement('div');
      el.className = 'bk-svc' + (i === bk.svc ? ' selected' : '');
      el.innerHTML =
        '<div>' +
          '<div class="bk-svc-name">' + s.n + (s.pop ? ' <span style="font-size:10px;color:var(--accent);letter-spacing:.06em">POPULAR</span>' : '') + '</div>' +
          '<div class="bk-svc-dur">' + s.d + ' min</div>' +
        '</div>' +
        '<div class="bk-svc-price">' + s.p + '&#8364;</div>';

      el.addEventListener('click', function () {
        document.querySelectorAll('.bk-svc').forEach(function (x) { x.classList.remove('selected'); });
        el.classList.add('selected');
        bk.svc = i;
        bk.date = null; bk.slot = null; bk.st = ''; bk.se = '';
        var btn = document.getElementById('bkbtn1');
        if (btn) btn.disabled = false;
      });
      wrap.appendChild(el);
    });

    var btn1 = document.getElementById('bkbtn1');
    if (btn1) btn1.disabled = (bk.svc === null);
  }

  function bkTo(n) {
    if (n > 1 && bk.svc === null) return;
    if (n > 2 && !bk.date) return;
    if (n > 3 && (bk.slot === null || bk.st === '')) return;

    [1, 2, 3, 4].forEach(function (i) {
      var panel = document.getElementById('bp' + i);
      var step  = document.querySelector('.bk-step[data-s="' + i + '"]');
      if (panel) panel.classList.toggle('active', i === n);
      if (step) {
        step.classList.remove('active', 'done');
        if (i === n)    step.classList.add('active');
        else if (i < n) step.classList.add('done');
      }
    });

    if (n === 2) renderCalView();
    if (n === 3) renderSlots();
    if (n === 4) renderConfirm();
  }

  function bkMon(dir) {
    calD.setMonth(calD.getMonth() + dir);
    renderCalView();
  }

  function renderCalView() {
    var dowWrap = document.getElementById('bk-dow');
    var grid    = document.getElementById('bk-cal');
    var monthEl = document.getElementById('bk-month');
    if (!dowWrap || !grid || !monthEl) return;

    dowWrap.innerHTML = DOWS.map(function (d) {
      return '<div class="bk-cal-dow">' + d + '</div>';
    }).join('');

    monthEl.textContent = MONTHS[calD.getMonth()] + ' ' + calD.getFullYear();
    grid.innerHTML = '';

    var today    = new Date(); today.setHours(0, 0, 0, 0);
    var firstDay = new Date(calD.getFullYear(), calD.getMonth(), 1);
    var lastDay  = new Date(calD.getFullYear(), calD.getMonth() + 1, 0);
    var off      = firstDay.getDay() - 1; if (off < 0) off = 6;

    for (var e = 0; e < off; e++) {
      var empty = document.createElement('div');
      empty.className = 'bk-cal-day';
      grid.appendChild(empty);
    }

    for (var d = 1; d <= lastDay.getDate(); d++) {
      (function (day) {
        var dt     = new Date(calD.getFullYear(), calD.getMonth(), day);
        var dow    = dt.getDay() === 0 ? 6 : dt.getDay() - 1;
        var isPast   = dt < today;
        var isClosed = bkConfig.sched && bkConfig.sched[dow] === null;
        var isToday  = dt.getTime() === today.getTime();
        var isSel    = bk.date && dt.toDateString() === bk.date.toDateString();

        var el  = document.createElement('div');
        var cls = 'bk-cal-day';
        if (isSel)         cls += ' sel';
        else if (isPast)   cls += ' past';
        else if (isClosed) cls += ' closed';
        else               cls += ' avail';
        if (isToday && !isSel) cls += ' today';
        el.className = cls;
        el.textContent = day;

        if (!isPast && !isClosed) {
          el.addEventListener('click', function () {
            document.querySelectorAll('.bk-cal-day').forEach(function (x) { x.classList.remove('sel'); });
            el.classList.add('sel');
            bk.date = dt;
            bk.slot = null; bk.st = ''; bk.se = '';
            var btn2 = document.getElementById('bkbtn2');
            var btn3 = document.getElementById('bkbtn3');
            if (btn2) btn2.disabled = false;
            if (btn3) btn3.disabled = true;
          });
        }
        grid.appendChild(el);
      })(d);
    }
  }

  function fmt(mins) {
    var h = Math.floor(mins / 60);
    var m = mins % 60;
    return h + ':' + (m < 10 ? '0' : '') + m;
  }

  function renderSlots() {
    if (!bk.date || bk.svc === null || !bkConfig.svcs || !bkConfig.sched) return;
    var svc   = bkConfig.svcs[bk.svc];
    var dow   = bk.date.getDay() === 0 ? 6 : bk.date.getDay() - 1;
    var range = bkConfig.sched[dow];
    if (!range) return;

    var slots = [];
    for (var t = range[0]; t + svc.d <= range[1]; t += svc.d) {
      slots.push(t);
    }

    var bookedSet = new Set((bkConfig.bookedIdx || []).filter(function (i) { return i < slots.length; }));

    var sinfo = document.getElementById('bk-sinfo');
    if (sinfo) {
      var dateStr = bk.date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
      sinfo.innerHTML = '<strong>' + svc.n + '</strong> &middot; ' + svc.d + ' min &middot; ' + dateStr;
    }

    var slotGrid = document.getElementById('bk-slots');
    if (!slotGrid) return;
    slotGrid.innerHTML = '';

    slots.forEach(function (t, i) {
      var te       = t + svc.d;
      var isBooked = bookedSet.has(i);
      var isSel    = (bk.slot === i);

      var el = document.createElement('div');
      el.className = 'bk-slot' + (isBooked ? ' booked' : isSel ? ' sel' : '');

      if (isBooked) {
        el.innerHTML = '<div style="color:var(--border);font-size:18px;line-height:1">&#8212;</div>';
      } else {
        el.innerHTML =
          '<div class="bk-slot-time">' + fmt(t) + '</div>' +
          '<div class="bk-slot-end">' + fmt(te) + '</div>';
        el.addEventListener('click', function () {
          document.querySelectorAll('.bk-slot').forEach(function (x) { x.classList.remove('sel'); });
          el.classList.add('sel');
          bk.slot = i; bk.st = fmt(t); bk.se = fmt(te);
          var btn3 = document.getElementById('bkbtn3');
          if (btn3) btn3.disabled = false;
        });
      }
      slotGrid.appendChild(el);
    });
  }

  function renderConfirm() {
    if (bk.svc === null || !bk.date || bk.st === '' || !bkConfig.svcs) return;
    var svc     = bkConfig.svcs[bk.svc];
    var dateStr = bk.date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    var conf    = document.getElementById('bk-confirm');
    if (!conf) return;
    conf.innerHTML =
      row('SERVICIO', svc.n) +
      row('DURACIÓN', svc.d + ' min') +
      row('PRECIO',   svc.p + '&#8364;') +
      row('FECHA',    dateStr) +
      row('HORA',     bk.st + ' &mdash; ' + bk.se);
  }

  function row(label, val) {
    return '<div class="bk-confirm-row">' +
      '<span class="bk-confirm-label">' + label + '</span>' +
      '<span class="bk-confirm-val">' + val + '</span>' +
    '</div>';
  }

  function bkWA() {
    if (bk.svc === null || !bk.date || bk.st === '' || !bkConfig.svcs) return;
    var svc     = bkConfig.svcs[bk.svc];
    var dateStr = bk.date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
    var lines   = [
      'Hola, quiero reservar una cita:',
      'Servicio: ' + svc.n + ' (' + svc.p + '€)',
      'Fecha: ' + dateStr,
      'Hora: ' + bk.st + ' - ' + bk.se,
      '',
      '¿Podéis confirmarlo? Gracias.'
    ];
    var phone = bkConfig.phone || '34600000000';
    window.open('https://wa.me/' + phone + '?text=' + encodeURIComponent(lines.join('\n')), '_blank');
  }

  /* ── Init on DOM ready ─────────────────────────────────── */
  function onReady(fn) {
    if (document.readyState !== 'loading') { fn(); }
    else { document.addEventListener('DOMContentLoaded', fn); }
  }

  onReady(function () {
    initNav();
    initReveal();
    // initBooking() se llama desde cada demo con su configuración específica
  });

  /* ── Exports globales ──────────────────────────────────── */
  window.Sitalia = {
    initBooking: initBooking,
    bkTo:        bkTo,
    bkMon:       bkMon,
    bkWA:        bkWA,
    // Acceso al estado interno del widget de reservas
    getBkState:  function() { return bk; },
    setBkConfig: function(cfg) { Object.assign(bkConfig, cfg); }
  };

})();
so al estado interno del widget de reservas
    getBkState:  function() { return bk; },
    setBkConfig: function(cfg) { Object.assign(bkConfig, cfg); }
  };

})();
