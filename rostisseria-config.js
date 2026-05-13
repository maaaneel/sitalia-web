/* ============================================================
   SITALIA — rostisseria-config.js   (v2 — carrito + 4 pasos)

   El flujo:
   - Paso 1 (custom): catálogo con stepper +/- por producto → mini-carrito
   - Paso 2-3-4: día / hora / confirmar (widget estándar de shared.js)
   - En el paso 4 inyectamos el desglose del pedido

   Truco técnico: el widget de shared.js trabaja con UN "servicio"
   seleccionado por reserva. Cuando el carrito cambia, generamos un
   "pseudo-servicio" virtual con el resumen del carrito (nombre
   concatenado, precio total, duración máxima) y se lo pasamos al
   widget. shared.js no necesita saber que es un carrito real.
   ============================================================ */

(function () {
  'use strict';

  var NEGOCIO = 'rostisseria';

  /* Catálogo por defecto (fallback si la API no devuelve nada) */
  var defaultProducts = [
    { id: 'pol-ent', n: 'Pollo a l\'ast entero',     d: 30, p: '14.50', display: 'Listo en 30 min' },
    { id: 'pol-med', n: 'Medio pollo a l\'ast',      d: 25, p: '8.00',  display: 'Listo en 25 min' },
    { id: 'pol-cua', n: 'Cuarto de pollo',           d: 20, p: '5.50',  display: 'Listo en 20 min' },
    { id: 'pol-fam', n: 'Pack familiar',             d: 30, p: '22.00', display: 'Pollo + 2 patatas + ensalada', pop: true },
    { id: 'car-cos', n: 'Costilla de cerdo adobada', d: 25, p: '9.00' },
    { id: 'car-but', n: 'Butifarra a la brasa',      d: 15, p: '6.00', display: '2 unidades' }
  ];

  var allProducts = [];
  var cart = {};   // { id: { product, qty } }

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
          id:      'p' + s.id,
          n:       s.nombre,
          d:       s.duracion_min,
          display: s.duracion_display,
          p:       (s.precio !== null && s.precio !== undefined) ? String(s.precio) : '0',
          pop:     !!s.pop
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

    /* Iniciar el widget con svcs vacíos.
       Cuando el carrito tenga items, le pasaremos un pseudo-servicio. */
    Sitalia.loadScheduleAndInit({
      negocio:      NEGOCIO,
      preselectSvc: null,
      sched: [
        null,           // Lunes — cerrado
        [690, 930],     // Martes  11:30–15:30
        [690, 930],     // Miércoles
        [690, 930],     // Jueves
        [690, 930],     // Viernes
        [690, 930],     // Sábado
        [690, 930]      // Domingo
      ],
      svcs: [],
      absentDates: absentDates,
      phone: '34936661234'
    });

    renderProducts();
    setupPaso4Hook();
  });

  /* ── Renderizado del catálogo (paso 1) ──────────────── */
  function renderProducts() {
    var wrap = document.getElementById('rost-products');
    if (!wrap) return;

    wrap.innerHTML = allProducts.map(function (p) {
      var qty = (cart[p.id] || {}).qty || 0;
      var stepperHtml = qty > 0
        ? '<div class="rost-stepper">' +
            '<button type="button" aria-label="Quitar uno" onclick="window.RostCart.dec(\'' + p.id + '\')">−</button>' +
            '<span class="rost-stepper-qty">' + qty + '</span>' +
            '<button type="button" aria-label="Añadir uno" onclick="window.RostCart.inc(\'' + p.id + '\')">+</button>' +
          '</div>'
        : '<button class="rost-add" type="button" onclick="window.RostCart.inc(\'' + p.id + '\')">+ Añadir</button>';

      return (
        '<div class="rost-product' + (qty > 0 ? ' in-cart' : '') + (p.pop ? ' popular' : '') + '">' +
          '<div class="rost-product-info">' +
            '<div class="rost-product-name">' + p.n + (p.pop ? ' <span class="rost-pop">Popular</span>' : '') + '</div>' +
            (p.display ? '<div class="rost-product-sub">' + p.display + '</div>' : '') +
          '</div>' +
          '<div class="rost-product-right">' +
            '<div class="rost-product-price">' + formatPrice(p.p) + '</div>' +
            stepperHtml +
          '</div>' +
        '</div>'
      );
    }).join('');
  }

  /* ── Renderizado del mini-carrito en el paso 1 ──────── */
  function renderCart() {
    var cartEl  = document.getElementById('rost-cart');
    var listEl  = document.getElementById('rost-cart-list');
    var totalEl = document.getElementById('rost-cart-total');
    if (!cartEl || !listEl || !totalEl) return;

    var ids = Object.keys(cart);
    if (ids.length === 0) {
      cartEl.hidden = true;
      return;
    }
    cartEl.hidden = false;

    listEl.innerHTML = ids.map(function (id) {
      var item = cart[id];
      var subtotal = parseFloat(item.product.p) * item.qty;
      return '<div class="rost-cart-row">' +
        '<span class="rost-cart-name">' + item.product.n +
          ' <span class="rost-cart-qty">× ' + item.qty + '</span>' +
        '</span>' +
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

  /* ── Sincronizar el carrito con el widget de shared.js ─
     Genera un pseudo-servicio con el resumen del pedido y lo
     mete en bkConfig.svcs. shared.js cree que hay UN servicio
     seleccionado y trabaja con él para los siguientes pasos. */
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
    var maxDur = 0;
    var desglose = [];
    ids.forEach(function (id) {
      var item = cart[id];
      if (item.product.d > maxDur) maxDur = item.product.d;
      desglose.push(item.product.n + ' × ' + item.qty);
    });

    var pseudo = {
      n:       'Pedido: ' + desglose.join(', '),
      d:       maxDur,
      display: 'Recogida en ' + maxDur + ' min',
      p:       total.toFixed(2),
      pop:     false
    };

    Sitalia.setBkConfig({ svcs: [pseudo] });
    Sitalia.getBkState().svc = 0;   // forzamos selección del pseudo
    btn.disabled = false;
  }

  /* ── API expuesta para los onclick del HTML ─────────── */
  window.RostCart = {
    inc: function (id) {
      var p = findProduct(id);
      if (!p) return;
      cart[id] = cart[id] || { product: p, qty: 0 };
      cart[id].qty++;
      renderProducts();
      renderCart();
      updatePseudoSvc();
    },
    dec: function (id) {
      if (!cart[id]) return;
      cart[id].qty--;
      if (cart[id].qty <= 0) delete cart[id];
      renderProducts();
      renderCart();
      updatePseudoSvc();
    }
  };

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

  /* ── Hook del paso 4: mostrar desglose bonito ───────── */
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
    var maxDur = 0;
    ids.forEach(function (id) {
      if (cart[id].product.d > maxDur) maxDur = cart[id].product.d;
    });
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
      '<div class="bk-confirm-row"><span class="bk-confirm-label">Hora</span><span class="bk-confirm-val">' + bk.st + ' &mdash; ' + bk.se + '</span></div>' +
      '<div class="bk-confirm-row"><span class="bk-confirm-label">Preparación</span><span class="bk-confirm-val">' + maxDur + ' min</span></div>';
  }
})();
