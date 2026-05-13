/* ============================================================
   SITALIA — psicologo-config.js
   ============================================================ */
(function () {
  var NEGOCIO = 'psicologo';

  var defaultSvcs = [
    { n: 'Primera consulta',     d: 50, p: '70' },
    { n: 'Sesión individual',    d: 50, p: '70', pop: true },
    { n: 'Sesión online',        d: 50, p: '65' },
    { n: 'Bono 4 sesiones',      d: 50, p: '65' }
  ];

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
                 p: (s.precio !== null && s.precio !== undefined) ? String(s.precio) : '0',
                 pop: !!s.pop };
      });
      isAdmin = true;
    } else { svcs = defaultSvcs; isAdmin = false; }

    var dateMap = {};
    Object.keys(ausByWid).forEach(function (wid) {
      (ausByWid[wid] || []).forEach(function (d) { dateMap[d] = true; });
    });
    var absentDates = Object.keys(dateMap).length > 0 ? dateMap : null;

    Sitalia.loadScheduleAndInit({
      negocio: NEGOCIO,
      preselectSvc: isAdmin ? 0 : 1,
      // Lun–Vie 10:00–20:00
      sched: [
        [600, 1200], [600, 1200], [600, 1200], [600, 1200], [600, 1200],
        null, null
      ],
      svcs: svcs,
      absentDates: absentDates,
      phone: '34915550789'
    });
  });
})();
