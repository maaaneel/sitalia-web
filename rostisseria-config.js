/* ============================================================
   SITALIA — rostisseria-config.js   (v3 — catálogo visual + modal)

   Flujo:
   - Catálogo visual en el cuerpo de la página, agrupado por
     categorías (tabs). Cada producto tiene imagen, nombre y
     precio con botón "+ Añadir" / stepper.
   - Cuando hay items en el carrito, aparece un FAB flotante.
   - Al pulsar FAB → modal con widget de 4 pasos.
   - Paso 1 (carrito) → 2 (día) → 3 (hora) → 4 (confirmar).
   ============================================================ */

(function () {
  'use strict';

  var NEGOCIO = 'rostisseria';

  /* Catálogo por defecto (fallback si la API no devuelve nada) */
  var defaultProducts = [
    { id: 'd1', n: 'Pollo a l\'ast entero',     d: 30, p: '14.50', display: 'Listo en 30 min',                              categoria: 'Pollos' },
    { id: 'd2', n: 'Medio pollo a l\'ast',      d: 25, p: '8.00',  display: 'Listo en 25 min',                              categoria: 'Pollos' },
    { id: 'd3', n: 'Cuarto de pollo',           d: 20, p: '5.50',  display: 'Listo en 20 min',                              categoria: 'Pollos' },
    { id: 'd4', n: 'Pack familiar',             d: 30, p: '22.00', display: 'Pollo + 2 patatas + ensalada',  pop: true,    categoria: 'Pollos' },
    { id: 'd5', n: 'Costilla de cerdo adobada', d: 25, p: '9.00',  display: 'Asada lentamente',                             categoria: 'Carnes' },
    { id: 'd6', n: 'Butifarra a la brasa',      d: 15, p: '6.00',  display: '2 unidades',                                   categoria: 'Carnes' },
    { id: 'd7', n: 'Patatas asadas',            d: 10, p: '4.50',  display: 'Asadas con jugos del pollo',                   categoria: 'Guarniciones' },
    { id: 'd8', n: 'Ensalada de la casa',       d: 10, p: '4.50',  display: 'Lechuga, tomate, atún, olivas',                categoria: 'Guarniciones' },
    { id: 'd9', n: 'Crema catalana',            d: 5,  p: '4.00',  display: 'Receta tradicional',                           categoria: 'Postres' },
    { id: 'd10', n: 'Vino tinto Penedès',       d: 5,  p: '8.00',  display: 'Botella 75cl',                                 categoria: 'Bebidas' }
  ];

  var allProducts = [];
  var cart = {};      // { id: { product, qty } }
  var activeCat = ''; // categoría activa (vacío = todas)
  var slotDur = 30;   // duración del slot (se sobreescribe desde /api/schedule si el negocio tiene capacidad)

  /* ── Carga inicial ──────────────────────────────────── */
  Promise.all([
    fetch('/api/servicios?negocio=' + NEGOCIO)
      .then(function (r) { return r.json(); })
      .catch(function () { return { servicios: [] }; }),
    fetch('/api/ausencias?negocio=' + NEGOCIO)
      .then(function (r) { return r.json(); })
      .catch(function () { return { ausencias: {} }; })
  ]).then(function (results) {
    var svcsApi  = (results[0] && results[0].servicios) || [];
    var ausByWid = (results[1] && results[1].ausencias) || {};

    if (svcsApi.length > 0) {
      allProducts = svcsApi.map(function (s) {
        return {
          id:         'p' + s.id,
          n:          s.nombre,
          d:          s.duracion_min,
          display:    s.duracion_display,
          p:          (s.precio !== null && s.precio !== undefined) ? String(s.precio) : '0',
          pop:        !!s.pop,
          imagen_url: s.imagen_url || null,
          categoria:  s.categoria  || 'Otros'
        };
      });
    } else {
      allProducts = defaultProducts;
    }

    var dateMap = {};
    Object.keys(ausByWid).forEach(function (wid) {
      (ausByWid[wid] || []).forEach(function (d) { dateMap[d] = true; });
    });
    var absentDates = Object.keys(dateMap).length > 0 ? dateMap : null;

    /* Inicializar widget con svcs vacíos (los pondremos según el carrito) */
    Sitalia.loadScheduleAndInit({
      negocio: NEGOCIO,
      preselectSvc: null,
      sched: [
        null,           // Lunes — cerrado
        [690, 930],     // Mar  11:30–15:30
        [690, 930],     // Mié
        [690, 930],     // Jue
        [690, 930],     // Vie
        [690, 930],     // Sáb
        [690, 930]      // Dom
      ],
      svcs: [],
      absentDates: absentDates,
      phone: '34936661234'
    });

    /* Leer capacidad del negocio (si está configurada) — define la duración
       del slot que usaremos para todas las reservas. Independiente del producto. */
    fetch('/api/schedule?negocio=' + NEGOCIO)
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d && d.capacidad && d.capacidad.duracion_slot_min) {
          slotDur = d.capacidad.duracion_slot_min;
        }
      })
      .catch(function () { /* fallback al default de 30 */ });

    renderTabs();
    renderProducts();
    setupPaso4Hook();
  });

  /* ── Tabs de categorías ─────────────────────────────── */
  function renderTabs() {
    var tabsEl = document.getElementById('rost-cat-tabs');
    if (!tabsEl) return;
    var cats = [];
    allProducts.forEach(function (p) {
      if (cats.indexOf(p.categoria) === -1) cats.push(p.categoria);
    });
    if (cats.length <= 1) { tabsEl.hidden = true; return; }

    var html = '<button class="rost-cat-tab' + (activeCat === '' ? ' active' : '') + '" type="button" data-cat="">Todo</button>';
    html += cats.map(function (c) {
      return '<button class="rost-cat-tab' + (activeCat === c ? ' active' : '') + '" type="button" data-cat="' + c + '">' + c + '</button>';
    }).join('');
    tabsEl.innerHTML = html;

    tabsEl.querySelectorAll('.rost-cat-tab').forEach(function (btn) {
      btn.addEventListener('click', function () {
        activeCat = btn.getAttribute('data-cat');
        renderTabs();
        renderProducts();
      });
    });
  }

  /* ── Grid visual de productos ───────────────────────── */
  function renderProducts() {
    var grid = document.getElementById('rost-product-grid');
    if (!grid) return;
    var prods = activeCat === ''
      ? allProducts
      : allProducts.filter(function (p) { return p.categoria === activeCat; });

    grid.innerHTML = prods.map(function (p) {
      var qty = (cart[p.id] || {}).qty || 0;
      var imgHtml = p.imagen_url
        ? '<div class="rost-card-img"><img src="' + p.imagen_url + '" alt="' + p.n + '" loading="lazy"></div>'
        : '<div class="rost-card-img rost-card-img-placeholder"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="1.5"/><polyline points="3 17 8 12 14 18"/></svg></div>';

      var actionHtml = qty > 0
        ? '<div class="rost-card-stepper">' +
            '<button type="button" onclick="window.RostCart.dec(\'' + p.id + '\')" aria-label="Quitar uno">−</button>' +
            '<span class="rost-card-stepper-qty">' + qty + '</span>' +
            '<button type="button" onclick="window.RostCart.inc(\'' + p.id + '\')" aria-label="Añadir uno">+</button>' +
          '</div>'
        : '<button class="rost-card-add" type="button" onclick="window.RostCart.inc(\'' + p.id + '\')">+ Añadir</button>';

      return '<div class="rost-card' + (qty > 0 ? ' in-cart' : '') + (p.pop ? ' popular' : '') + '">' +
          imgHtml +
          '<div class="rost-card-body">' +
            (p.pop ? '<span class="rost-card-pop">Popular</span>' : '') +
            '<div class="rost-card-name">' + p.n + '</div>' +
            (p.display ? '<div class="rost-card-desc">' + p.display + '</div>' : '') +
            '<div class="rost-card-bottom">' +
              '<span class="rost-card-price">' + formatPrice(p.p) + '</span>' +
              actionHtml +
            '</div>' +
          '</div>' +
        '</div>';
    }).join('');
  }

  /* ── Mini-carrito (dentro del modal) ─────────────────── */
  function renderCart() {
    var listEl  = document.getElementById('rost-cart-list');
    var totalEl = document.getElementById('rost-cart-total');
    if (!listEl || !totalEl) return;

    var ids = Object.keys(cart);
    if (ids.length === 0) {
      listEl.innerHTML = '<div class="rost-cart-empty">El pedido está vacío. Añade productos desde la carta.</div>';
      totalEl.textContent = '0,00€';
      return;
    }
    listEl.innerHTML = ids.map(function (id) {
      var item = cart[id];
      var subtotal = parseFloat(item.product.p) * item.qty;
      return '<div class="rost-cart-row">' +
        '<span class="rost-cart-name">' + item.product.n +
          ' <span class="rost-cart-qty">× ' + item.qty + '</span>' +
        '</span>' +
        '<div class="rost-cart-mini-stepper">' +
          '<button type="button" onclick="window.RostCart.dec(\'' + id + '\')">−</button>' +
          '<button type="button" onclick="window.RostCart.inc(\'' + id + '\')">+</button>' +
        '</div>' +
        '<span class="rost-cart-amt">' + formatPrice(subtotal) + '</span>' +
      '</div>';
    }).join('');
    totalEl.textContent = formatPrice(totalCart());
  }

  function totalCart() {
    var t = 0;
    Object.keys(cart).forEach(function (id) {
      t += parseFloat(cart[id].product.p) * cart[id].qty;
    });
    return t;
  }
  function countCart() {
    var n = 0;
    Object.keys(cart).forEach(function (id) { n += cart[id].qty; });
    return n;
  }

  /* ── FAB flotante ───────────────────────────────────── */
  function updateFab() {
    var fab = document.getElementById('rost-fab');
    if (!fab) return;
    var count = countCart();
    if (count === 0) {
      fab.classList.remove('visible');
      return;
    }
    fab.classList.add('visible');
    document.getElementById('rost-fab-count').textContent = count;
    document.getElementById('rost-fab-total').textContent = formatPrice(totalCart());
  }

  /* ── Pseudo-servicio para el widget ─────────────────── */
  function updatePseudoSvc() {
    var ids = Object.keys(cart);
    var btn = document.getElementById('bkbtn1');
    if (!btn) return;

    if (ids.length === 0) {
      btn.disabled = true;
      Sitalia.setBkConfig({ svcs: [] });
      Sitalia.getBkState().svc = null;
      return;
    }

    var total  = totalCart();
    var desglose = [];
    ids.forEach(function (id) {
      var item = cart[id];
      desglose.push(item.product.n + ' × ' + item.qty);
    });

    /* IMPORTANTE: en modo "capacidad" la duración del slot es FIJA (slotDur).
       No depende de los productos del carrito — el asador prepara en paralelo. */
    var pseudo = {
      n:       'Pedido: ' + desglose.join(', '),
      d:       slotDur,
      display: 'Recogida a la hora elegida',
      p:       total.toFixed(2),
      pop:     false
    };
    Sitalia.setBkConfig({ svcs: [pseudo] });
    Sitalia.getBkState().svc = 0;
    btn.disabled = false;
  }

  /* ── API expuesta para los onclick ───────────────────── */
  window.RostCart = {
    inc: function (id) {
      var p = findProduct(id);
      if (!p) return;
      cart[id] = cart[id] || { product: p, qty: 0 };
      cart[id].qty++;
      onCartChange();
    },
    dec: function (id) {
      if (!cart[id]) return;
      cart[id].qty--;
      if (cart[id].qty <= 0) delete cart[id];
      onCartChange();
    }
  };

  function onCartChange() {
    renderProducts();   // refresca botones/steppers en el catálogo
    renderCart();       // refresca lista en el modal
    updateFab();        // FAB visible/oculto
    updatePseudoSvc();  // pasa al widget
  }

  function findProduct(id) {
    for (var i = 0; i < allProducts.length; i++) {
      if (allProducts[i].id === id) return allProducts[i];
    }
    return null;
  }

  function formatPrice(p) {
    var n = typeof p === 'number' ? p : parseFloat(p);
    if (isNaN(n)) return '0,00€';
    return n.toFixed(2).replace('.', ',') + '€';
  }

  /* ── Modal de reserva ────────────────────────────────── */
  window.abrirReserva = function () {
    var modal = document.getElementById('rost-modal');
    if (!modal) return;
    renderCart();
    Sitalia.bkTo(1);
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
  };

  window.cerrarReserva = function () {
    var modal = document.getElementById('rost-modal');
    if (!modal) return;
    modal.hidden = true;
    document.body.style.overflow = '';
  };

  /* Cerrar con ESC */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      var modal = document.getElementById('rost-modal');
      if (modal && !modal.hidden) cerrarReserva();
    }
  });
  /* Cerrar al hacer click en el overlay (no en el contenido) */
  document.addEventListener('click', function (e) {
    if (e.target.id === 'rost-modal') cerrarReserva();
  });

  /* ── Hook del paso 4 para mostrar desglose bonito ───── */
  function setupPaso4Hook() {
    var origBkTo = Sitalia.bkTo;
    Sitalia.bkTo = function (n) {
      origBkTo(n);
      if (n === 4) injectBreakdown();
    };
  }

  function injectBreakdown() {
    var confirmEl = document.getElementById('bk-confirm');
    if (!confirmEl) return;
    var ids = Object.keys(cart);
    if (ids.length === 0) return;

    var bk = Sitalia.getBkState();
    var dateStr = bk.date ? bk.date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }) : '';
    var total = totalCart();

    var rows = ids.map(function (id) {
      var item = cart[id];
      var subtotal = parseFloat(item.product.p) * item.qty;
      return '<div class="rost-confirm-item">' +
        '<span class="rost-confirm-name">' + item.product.n +
          ' <span class="rost-confirm-qty">× ' + item.qty + '</span></span>' +
        '<span class="rost-confirm-sub">' + formatPrice(subtotal) + '</span>' +
      '</div>';
    }).join('');

    confirmEl.innerHTML =
      '<div class="rost-confirm-section">Tu pedido</div>' +
      '<div class="rost-confirm-list">' + rows + '</div>' +
      '<div class="rost-confirm-total">' +
        '<span class="rost-confirm-total-lbl">Total</span>' +
        '<span class="rost-confirm-total-amt">' + formatPrice(total) + '</span>' +
      '</div>' +
      '<div class="rost-confirm-section">Recogida</div>' +
      '<div class="bk-confirm-row"><span class="bk-confirm-label">Fecha</span><span class="bk-confirm-val">' + dateStr + '</span></div>' +
      '<div class="bk-confirm-row"><span class="bk-confirm-label">Hora</span><span class="bk-confirm-val">' + bk.st + '</span></div>';
  }
})();
