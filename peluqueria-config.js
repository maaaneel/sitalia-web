/* ============================================================
   SITALIA — peluqueria-config.js
   Configuración del widget de reservas de Barberia El Rincón.

   Cambio (mayo 2026): los servicios y ausencias se leen de Supabase
   a través de /api/servicios y /api/ausencias. Antes se leían de
   localStorage, lo que significaba que los visitantes NUNCA veían
   el catálogo real configurado en el panel admin — solo el fallback.
   ============================================================ */

(function () {
  var NEGOCIO = 'peluqueria';

  /* ── Catálogo por defecto ──────────────────────────────────
     Solo se usa si la API falla o si la tabla `servicios` está
     vacía para este negocio. Es la red de seguridad para que la
     demo nunca aparezca sin contenido. */
  var defaultSvcs = [
    { n: 'Corte de pelo',       d: 30, p: '18' },
    { n: 'Arreglo de barba',    d: 20, p: '12' },
    { n: 'Corte + Barba',       d: 45, p: '25', pop: true },
    { n: 'Afeitado con navaja', d: 40, p: '20' },
    { n: 'Corte niño',          d: 25, p: '12' },
    { n: 'Tratamiento capilar', d: 20, p: '15' }
  ];

  /* ── Carga en paralelo: servicios + ausencias desde la API ── */
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

    /* ── Mapear servicios a la forma que espera shared.js ────
       shared.js usa { n, d, display, p, pop } */
    var svcs;
    var isAdmin;
    if (svcsApi.length > 0) {
      svcs = svcsApi.map(function (s) {
        return {
          n:       s.nombre,
          d:       s.duracion_min,                                              // minutos que bloquea agenda
          display: s.duracion_display,                                          // texto visible al cliente
          p:       (s.precio !== null && s.precio !== undefined) ? String(s.precio) : '0',
          pop:     !!s.pop
        };
      });
      isAdmin = true;     // hay datos reales del admin → preseleccionar el primero
    } else {
      svcs    = defaultSvcs;
      isAdmin = false;
    }

    /* ── Convertir ausencias a mapa de fechas bloqueadas ──────
       Para barberías de un solo trabajador, si CUALQUIER trabajador
       activo está ausente ese día, ese día se considera no disponible.
       (La lógica fina de capacidad por trabajadores la calcula la API
       de booking; aquí solo bloqueamos los días "obvios" en el calendario.) */
    var dateMap = {};
    Object.keys(ausByWid).forEach(function (wid) {
      (ausByWid[wid] || []).forEach(function (d) { dateMap[d] = true; });
    });
    var absentDates = Object.keys(dateMap).length > 0 ? dateMap : null;

    /* ── Inicializar booking widget ─────────────────────────── */
    Sitalia.loadScheduleAndInit({

      negocio: NEGOCIO,

      /* Si hay servicios del admin, preseleccionar el primero;
         si no, preseleccionar "Corte + Barba" (índice 2 del default). */
      preselectSvc: isAdmin ? 0 : 2,

      /* Horario por defecto (se sobrescribe con la API si está disponible) */
      sched: [
        null,           // Lunes    — cerrado
        [540, 1200],    // Martes   — 9:00–20:00
        [540, 1200],    // Miércoles
        [540, 1200],    // Jueves
        [540, 1200],    // Viernes
        [540, 1080],    // Sábado   — 9:00–18:00
        null            // Domingo  — cerrado
      ],

      svcs: svcs,

      /* Días bloqueados por ausencias del admin */
      absentDates: absentDates,

      phone: '34612345678'

    });
  });

})();
