/* ============================================================
   SITALIA — restaurante-config.js
   Reservas de mesa: en lugar de "servicios" usamos "número de personas"
   pero con la misma lógica del widget (cada opción tiene duración y
   marca el slot en agenda).
   ============================================================ */
(function () {
  var NEGOCIO = 'restaurante';

  // "Servicios" del widget = tamaños de mesa.
  // duración 90 min = tiempo medio que ocupa una mesa.
  // Precio se muestra como '—' porque no hay precio fijo por reservar.
  var defaultSvcs = [
    { n: 'Mesa para 2', d: 90, p: '—' },
    { n: 'Mesa para 3', d: 90, p: '—' },
    { n: 'Mesa para 4', d: 90, p: '—', pop: true },
    { n: 'Mesa para 5–6', d: 120, p: '—' },
    { n: 'Mesa para 7+', d: 150, p: '—' }
  ];

  // Cargar servicios reales desde la API (si el cliente los configuró
  // en Supabase). Si no hay, usar el default.
  Promise.all([
    fetch('/api/servicios?negocio=' + NEGOCIO).then(function (r) { return r.json(); }).catch(function () { return { servicios: [] }; }),
    fetch('/api/ausencias?negocio=' + NEGOCIO).then(function (r) { return r.json(); }).catch(function () { return { ausencias: {} }; })
  ]).then(function (res) {
    var svcsApi  = (res[0] && res[0].servicios)  || [];
    var ausByWid = (res[1] && res[1].ausencias) || {};

    var svcs, isAdmin;
    if (svcsApi.length > 0) {
      svcs = svcsApi.map(function (s) {
        return { n: s.nombre, d: s.duracion_min, display: s.duracion_display,
                 p: (s.precio !== null && s.precio !== undefined) ? String(s.precio) : '—',
                 pop: !!s.pop };
      });
      isAdmin = true;
    } else {
      svcs = defaultSvcs; isAdmin = false;
    }

    var dateMap = {};
    Object.keys(ausByWid).forEach(function (wid) {
      (ausByWid[wid] || []).forEach(function (d) { dateMap[d] = true; });
    });
    var absentDates = Object.keys(dateMap).length > 0 ? dateMap : null;

    Sitalia.loadScheduleAndInit({
      negocio: NEGOCIO,
      preselectSvc: isAdmin ? 0 : 2,
      // Horario por defecto: Mar–Sáb 13:00–16:00 (comida), Jue–Sáb 20:30–23:30 (cena)
      sched: [
        null,           // Lunes — cerrado
        [780, 960],     // Mar 13:00–16:00
        [780, 960],     // Mié
        [780, 960],     // Jue (solo mediodía en el sched simple)
        [780, 960],     // Vie
        [780, 960],     // Sáb
        null            // Dom — cerrado
      ],
      svcs: svcs,
      absentDates: absentDates,
      phone: '34915550123'
    });
  });
})();
