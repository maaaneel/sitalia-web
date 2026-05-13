/* ============================================================
   SITALIA — rostisseria-config.js
   Configuración del widget de reservas de Cal Pere.

   Mismo patrón que peluqueria-config.js:
   - Lee servicios y ausencias de Supabase (negocio='rostisseria')
   - Cae al catálogo por defecto si no hay datos en la BD
   - Inicializa el widget de reservas de shared.js

   En este nicho, "servicio" = "pedido" (pack o producto).
   La "duración" es el tiempo de preparación que bloquea la cocina
   para ese slot de recogida.
   ============================================================ */

(function () {
  var NEGOCIO = 'rostisseria';

  /* Catálogo por defecto — fallback si la API no devuelve nada */
  var defaultSvcs = [
    { n: 'Pollo a l\'ast entero',     d: 30, p: '14.50' },
    { n: 'Medio pollo a l\'ast',      d: 25, p: '8.00' },
    { n: 'Cuarto de pollo',           d: 20, p: '5.50' },
    { n: 'Pack familiar',             d: 30, p: '22.00', pop: true },
    { n: 'Costilla de cerdo adobada', d: 25, p: '9.00' },
    { n: 'Butifarra a la brasa',      d: 15, p: '6.00' }
  ];

  /* Carga en paralelo: servicios + ausencias */
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

    /* Mapear servicios al formato que espera shared.js */
    var svcs;
    var isAdmin;
    if (svcsApi.length > 0) {
      svcs = svcsApi.map(function (s) {
        return {
          n:       s.nombre,
          d:       s.duracion_min,
          display: s.duracion_display,
          p:       (s.precio !== null && s.precio !== undefined) ? String(s.precio) : '0',
          pop:     !!s.pop
        };
      });
      isAdmin = true;
    } else {
      svcs    = defaultSvcs;
      isAdmin = false;
    }

    /* Días bloqueados por ausencias del admin */
    var dateMap = {};
    Object.keys(ausByWid).forEach(function (wid) {
      (ausByWid[wid] || []).forEach(function (d) { dateMap[d] = true; });
    });
    var absentDates = Object.keys(dateMap).length > 0 ? dateMap : null;

    /* Inicializar booking widget
       Horario por defecto:
         Lun           — cerrado
         Mar–Dom       — 11:30–15:30 (slots de mediodía)
         (Vie–Sáb noche se gestionaría en otro tramo si quisiéramos;
          para una demo simple dejamos solo mediodía y la noche viene
          desde el admin si el dueño lo configura.) */
    Sitalia.loadScheduleAndInit({
      negocio: NEGOCIO,
      preselectSvc: isAdmin ? 0 : 3,  // por defecto preselecciona el pack familiar (índice 3)

      sched: [
        null,           // Lunes — cerrado
        [690, 930],     // Martes — 11:30–15:30
        [690, 930],     // Miércoles
        [690, 930],     // Jueves
        [690, 930],     // Viernes
        [690, 930],     // Sábado
        [690, 930]      // Domingo
      ],

      svcs: svcs,
      absentDates: absentDates,
      phone: '34936661234'
    });
  });

})();
