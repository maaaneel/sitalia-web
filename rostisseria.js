/* ============================================================
   SITALIA — rostisseria.js
   Lógica del catálogo + carrito + checkout simulado.

   Estructura:
   - Catálogo de productos (hardcoded, en un cliente real vendría
     de Supabase como en peluquería)
   - Carrito en memoria (no persiste entre sesiones — es una demo)
   - Modal de checkout con simulación de pago
   ============================================================ */
(function () {
  'use strict';

  /* ── Catálogo ─────────────────────────────────────────── */
  var CATALOGO = {
    pollos: [
      { id: 'pol-ent', n: 'Pollo a l\'ast entero', d: 'Asado al carbón, hierbas de la casa.', p: 14.50 },
      { id: 'pol-med', n: 'Medio pollo a l\'ast', d: 'Para 1-2 personas.', p: 8.00 },
      { id: 'pol-cua', n: 'Cuarto de pollo', d: 'Pechuga o muslo, tú eliges al recoger.', p: 5.50 },
      { id: 'pol-fam', n: 'Pack familiar', d: 'Pollo entero + 2 raciones de patatas + ensalada.', p: 22.00 }
    ],
    carnes: [
      { id: 'car-cos', n: 'Costilla de cerdo adobada', d: '350g aprox., asada lentamente.', p: 9.00 },
      { id: 'car-but', n: 'Butifarra a la brasa', d: 'Butifarra del Empordà, 2 unidades.', p: 6.00 },
      { id: 'car-cho', n: 'Chorizo a la brasa', d: '2 unidades, picante o suave.', p: 5.00 },
      { id: 'car-mor', n: 'Morcilla casera', d: 'Morcilla de cebolla, 2 unidades.', p: 5.50 }
    ],
    acomp: [
      { id: 'aco-pat', n: 'Patatas asadas', d: 'Asadas con los jugos del pollo.', p: 4.50 },
      { id: 'aco-bra', n: 'Patatas bravas', d: 'Salsa brava de la casa, alioli.', p: 5.00 },
      { id: 'aco-ens', n: 'Ensalada de la casa', d: 'Lechuga, tomate, atún, olivas.', p: 4.50 },
      { id: 'aco-pim', n: 'Pimientos del padrón', d: 'Fritos con sal en escamas.', p: 5.50 },
      { id: 'aco-cro', n: 'Croquetas caseras (6 ud.)', d: 'De jamón o pollo asado.', p: 6.00 }
    ],
    postres: [
      { id: 'pos-cre', n: 'Crema catalana', d: 'Receta tradicional.', p: 4.00 },
      { id: 'pos-coc', n: 'Coca de llardons', d: 'De la pastelería del barrio.', p: 4.50 },
      { id: 'pos-fla', n: 'Flan casero', d: 'Con caramelo de naranja.', p: 3.50 },
      { id: 'pos-mat', n: 'Mató con miel', d: 'Queso fresco artesano.', p: 4.00 }
    ],
    bebidas: [
      { id: 'beb-agu', n: 'Agua 1,5L', d: 'Sin gas o con gas.', p: 1.50 },
      { id: 'beb-ref', n: 'Refresco (lata)', d: 'Coca-Cola, Fanta, Nestea.', p: 2.00 },
      { id: 'beb-cer', n: 'Cerveza Estrella (33cl)', d: 'Botellín, varias unidades.', p: 1.80 },
      { id: 'beb-tin', n: 'Vino tinto Penedès', d: 'Botella 75cl, joven.', p: 8.00 },
      { id: 'beb-cav', n: 'Cava brut nature', d: 'Botella 75cl.', p: 12.00 }
    ]
  };

  /* ── Estado del carrito ───────────────────────────────── */
  var carrito = {};   // { idProducto: cantidad }

  function findProduct(id) {
    for (var cat in CATALOGO) {
      for (var i = 0; i < CATALOGO[cat].length; i++) {
        if (CATALOGO[cat][i].id === id) return CATALOGO[cat][i];
      }
    }
    return null;
  }

  function fmtPrice(n) {
    return n.toFixed(2).replace('.', ',') + '€';
  }

  function totalCarrito() {
    var total = 0;
    for (var id in carrito) {
      var p = findProduct(id);
      if (p) total += p.p * carrito[id];
    }
    return total;
  }

  function countCarrito() {
    var c = 0;
    for (var id in carrito) c += carrito[id];
    return c;
  }

  /* ── Renderizar catálogo ──────────────────────────────── */
  function renderCatalogo() {
    Object.keys(CATALOGO).forEach(function (cat) {
      var grid = document.getElementById('grid-' + cat);
      if (!grid) return;
      grid.innerHTML = CATALOGO[cat].map(function (p) {
        return (
          '<div class="prod-card" id="card-' + p.id + '">' +
            '<div class="prod-name">' + p.n + '</div>' +
            '<div class="prod-desc">' + p.d + '</div>' +
            '<div class="prod-row">' +
              '<span class="prod-price">' + fmtPrice(p.p) + '</span>' +
              '<button class="prod-add" type="button" onclick="addProducto(\'' + p.id + '\')">Añadir</button>' +
              '<div class="prod-stepper">' +
                '<button type="button" onclick="changeQty(\'' + p.id + '\', -1)">−</button>' +
                '<span class="qty" id="qty-' + p.id + '">0</span>' +
                '<button type="button" onclick="changeQty(\'' + p.id + '\', 1)">+</button>' +
              '</div>' +
            '</div>' +
          '</div>'
        );
      }).join('');
    });
  }

  /* ── Mostrar/ocultar grupos según pestaña activa ─────── */
  function bindTabs() {
    var tabs = document.querySelectorAll('.cat-tab');
    tabs.forEach(function (t) {
      t.addEventListener('click', function () {
        var cat = t.getAttribute('data-cat');
        document.querySelectorAll('.cat-tab').forEach(function (x) { x.classList.toggle('active', x === t); });
        document.querySelectorAll('.cat-group').forEach(function (g) {
          g.classList.toggle('active', g.getAttribute('data-cat') === cat);
        });
      });
    });
  }

  /* ── Acciones de carrito ──────────────────────────────── */
  window.addProducto = function (id) {
    carrito[id] = (carrito[id] || 0) + 1;
    updateProductCard(id);
    updateFab();
    updateModalIfOpen();
  };

  window.changeQty = function (id, delta) {
    carrito[id] = (carrito[id] || 0) + delta;
    if (carrito[id] <= 0) delete carrito[id];
    updateProductCard(id);
    updateFab();
    updateModalIfOpen();
  };

  function updateProductCard(id) {
    var card = document.getElementById('card-' + id);
    var qtyEl = document.getElementById('qty-' + id);
    if (!card || !qtyEl) return;
    var qty = carrito[id] || 0;
    qtyEl.textContent = qty;
    card.classList.toggle('in-cart', qty > 0);
  }

  function updateFab() {
    var fab = document.getElementById('cart-fab');
    var count = countCarrito();
    if (count === 0) {
      fab.classList.remove('visible');
      return;
    }
    fab.classList.add('visible');
    document.getElementById('cart-count').textContent = count;
    document.getElementById('cart-total-fab').textContent = fmtPrice(totalCarrito());
  }

  /* ── Modal de checkout ────────────────────────────────── */
  function isModalOpen() {
    return document.getElementById('modal-checkout').classList.contains('open');
  }

  window.abrirCheckout = function () {
    var modal = document.getElementById('modal-checkout');
    document.getElementById('checkout-step').classList.remove('hide');
    document.getElementById('success-step').classList.remove('show');
    populateHoras();
    renderModalCart();
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  window.cerrarCheckout = function () {
    var modal = document.getElementById('modal-checkout');
    modal.classList.remove('open');
    document.body.style.overflow = '';
  };

  function updateModalIfOpen() {
    if (isModalOpen()) renderModalCart();
  }

  function renderModalCart() {
    var list = document.getElementById('cart-list');
    var ids = Object.keys(carrito);

    if (ids.length === 0) {
      list.innerHTML = '<div class="cart-empty">Tu pedido está vacío. Vuelve al catálogo para añadir productos.</div>';
      document.getElementById('cart-total-modal').textContent = '0,00€';
      document.getElementById('ck-pay-amount').textContent = '0,00€';
      document.getElementById('ck-pay-btn').disabled = true;
      return;
    }

    list.innerHTML = ids.map(function (id) {
      var p = findProduct(id);
      var qty = carrito[id];
      var subtotal = p.p * qty;
      return (
        '<div class="cart-item">' +
          '<div>' +
            '<div class="cart-item-name">' + p.n + '</div>' +
          '</div>' +
          '<div class="cart-item-stepper">' +
            '<button type="button" onclick="changeQty(\'' + id + '\', -1)">−</button>' +
            '<span class="qty">' + qty + '</span>' +
            '<button type="button" onclick="changeQty(\'' + id + '\', 1)">+</button>' +
          '</div>' +
          '<div class="cart-item-price">' + fmtPrice(subtotal) + '</div>' +
        '</div>'
      );
    }).join('');

    var t = totalCarrito();
    document.getElementById('cart-total-modal').textContent = fmtPrice(t);
    document.getElementById('ck-pay-amount').textContent = fmtPrice(t);
    document.getElementById('ck-pay-btn').disabled = false;
  }

  /* ── Horas de recogida (slots de 15 min) ──────────────── */
  function populateHoras() {
    var select = document.getElementById('ck-hora');
    if (select.options.length > 0) return;   // ya populado

    // Construimos slots: hoy en 30 min, después cada 15 min hasta cierre.
    // Para la demo, los slots son ficticios (12:00–15:00).
    var now = new Date();
    var slots = [];
    var horaInicio = 12 * 60;       // 12:00
    var horaFin = 15 * 60;          // 15:00
    var ahoraMin = now.getHours() * 60 + now.getMinutes() + 30;  // +30 min preparación

    var primerSlot = Math.max(horaInicio, Math.ceil(ahoraMin / 15) * 15);
    for (var t = primerSlot; t <= horaFin; t += 15) {
      var h = Math.floor(t / 60);
      var m = t % 60;
      slots.push(pad(h) + ':' + pad(m));
    }
    if (slots.length === 0) {
      slots = ['Mañana a las 12:00', 'Mañana a las 12:30', 'Mañana a las 13:00'];
    }

    select.innerHTML = slots.map(function (s) {
      return '<option value="' + s + '">' + s + '</option>';
    }).join('');
  }
  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  /* ── Pagar (simulado) ─────────────────────────────────── */
  window.pagar = function (e) {
    e.preventDefault();
    var nombre = document.getElementById('ck-nombre').value.trim();
    var tel    = document.getElementById('ck-tel').value.trim();
    var hora   = document.getElementById('ck-hora').value;
    if (!nombre || !tel || !hora) {
      alert('Rellena los campos obligatorios.');
      return;
    }

    var btn = document.getElementById('ck-pay-btn');
    var txt = document.getElementById('ck-pay-text');
    btn.disabled = true;
    txt.innerHTML = 'Procesando pago…';

    // Simulamos delay del banco
    setTimeout(function () {
      // Mostrar pantalla de éxito
      document.getElementById('checkout-step').classList.add('hide');
      var success = document.getElementById('success-step');
      success.classList.add('show');
      document.getElementById('success-total').textContent = fmtPrice(totalCarrito());
      document.getElementById('success-hora').textContent = hora;

      // Vaciamos el carrito (demo: para que el siguiente "pedido" empiece limpio)
      carrito = {};
      // Reset visual de cards
      document.querySelectorAll('.prod-card').forEach(function (c) {
        c.classList.remove('in-cart');
        var q = c.querySelector('.qty');
        if (q) q.textContent = '0';
      });
      updateFab();

      // Reset form
      document.getElementById('ck-nombre').value = '';
      document.getElementById('ck-tel').value = '';
      document.getElementById('ck-email').value = '';
      btn.disabled = false;
      txt.innerHTML = 'Pagar <span id="ck-pay-amount">0,00€</span>';
    }, 1400);
  };

  /* ── Cerrar modal con ESC y click en overlay ──────────── */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isModalOpen()) cerrarCheckout();
  });
  document.addEventListener('click', function (e) {
    if (e.target.id === 'modal-checkout') cerrarCheckout();
  });

  /* ── Bootstrap ────────────────────────────────────────── */
  function init() {
    renderCatalogo();
    bindTabs();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
