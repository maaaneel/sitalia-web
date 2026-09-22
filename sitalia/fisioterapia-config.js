/* ============================================================
   SITALIA — fisioterapia-config.js
   ============================================================ */
(function () {
  var NEGOCIO = 'fisioterapia';

  var defaultSvcs = [
    { n: 'Fisioterapia general',  d: 45, p: '45' },
    { n: 'Fisioterapia deportiva',d: 60, p: '55' },
    { n: 'Punción seca',          d: 45, p: '50', pop: true },
    { n: 'Masaje terapéutico',    d: 45, p: '40' },
    { n: 'Suelo pélvico',         d: 60, p: '60' },
    { n: 'Drenaje linfático',     d: 60, p: '50' }
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
      preselectSvc: isAdmin ? 0 : 2,
      // Lun–Vie 9:00–20:00, Sáb 9:00–14:00
      sched: [
        [540, 1200], [540, 1200], [540, 1200], [540, 1200], [540, 1200],
        [540, 840],
        null
      ],
      svcs: svcs,
      absentDates: absentDates,
      phone: '34930000456'
    });
  });
})();
