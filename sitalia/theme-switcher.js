/* ============================================================
   SITALIA — theme-switcher.js
   Inyecta un selector de tema visual dentro del .demo-banner
   de cada demo. Permite alternar entre 3 estilos:
     - "nordic"  (defecto, minimalista blanco/negro)
     - "warm"    (cálido, crema/marrón, Playfair)
     - "luxury"  (oscuro, dorado, Cormorant)

   Estado persistido en localStorage. Para evitar parpadeo (FOUC)
   al cargar, aplica data-theme lo antes posible, antes incluso
   del DOMContentLoaded (porque este script se carga al final del
   body, el HTML inicial ya está pintado; aceptable como demo).
   ============================================================ */
(function () {
  'use strict';

  var THEMES = [
    { id: 'nordic', label: 'Nórdico' },
    { id: 'warm',   label: 'Cálido'  },
    { id: 'luxury', label: 'Lujo'    }
  ];
  var STORAGE_KEY = 'sitalia_theme';

  /* Aplica el tema al <html>. nordic == sin atributo.
     Lo ponemos en <html> en vez de <body> porque el script inline
     de prevención de FOUC se ejecuta antes de que <body> exista. */
  function applyTheme(theme) {
    var root = document.documentElement;
    if (theme === 'nordic' || !theme) {
      root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', theme);
    }
    try { localStorage.setItem(STORAGE_KEY, theme || 'nordic'); } catch (e) { /* noop */ }
    updateActive(theme || 'nordic');
  }

  /* Marca el botón activo. */
  function updateActive(theme) {
    var btns = document.querySelectorAll('.demo-banner-themes button[data-set-theme]');
    btns.forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-set-theme') === theme);
    });
  }

  /* Inserta el switcher en el banner existente. */
  function buildSwitcher() {
    var banner = document.querySelector('.demo-banner');
    if (!banner) return;

    /* Si el banner aún no está estructurado, lo envolvemos en un span "name". */
    if (!banner.querySelector('.demo-banner-name')) {
      var original = banner.textContent.trim();
      banner.textContent = '';
      var nameSpan = document.createElement('span');
      nameSpan.className = 'demo-banner-name';
      nameSpan.textContent = original;
      banner.appendChild(nameSpan);
    }

    /* Si ya existe el switcher (recarga rápida), no duplicar. */
    if (banner.querySelector('.demo-banner-themes')) return;

    var wrap = document.createElement('div');
    wrap.className = 'demo-banner-themes';

    var label = document.createElement('span');
    label.className = 'demo-banner-themes-label';
    label.textContent = 'ESTILO:';
    wrap.appendChild(label);

    THEMES.forEach(function (t) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.setAttribute('data-set-theme', t.id);
      btn.textContent = t.label;
      btn.addEventListener('click', function () { applyTheme(t.id); });
      wrap.appendChild(btn);
    });

    banner.appendChild(wrap);
  }

  /* Bootstrap: leer del storage e inicializar. */
  function init() {
    var saved = 'nordic';
    try { saved = localStorage.getItem(STORAGE_KEY) || 'nordic'; } catch (e) {}
    if (saved !== 'nordic') applyTheme(saved);
    buildSwitcher();
    updateActive(saved);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
