/* ============================================================
   SITALIA — peluqueria-config.js
   Configuración de Barberia El Rincón.
   Lee servicios y ausencias del localStorage (panel admin)
   y cae al catálogo por defecto si no hay datos guardados.
   ============================================================ */

(function () {
  var NEGOCIO = 'peluqueria';

  /* ── Catálogo por defecto ──────────────────────────────── */
  var defaultSvcs = [
    { n: 'Corte de pelo',       d: 30, p: '18' },
    { n: 'Arreglo de barba',    d: 20, p: '12' },
    { n: 'Corte + Barba',       d: 45, p: '25', pop: true },
    { n: 'Afeitado con navaja', d: 40, p: '20' },
    { n: 'Corte niño',          d: 25, p: '12' },
    { n: 'Tratamiento capilar', d: 20, p: '15' }
  ];

  /* ── Leer servicios editados en el admin ───────────────── */
  var svcs = defaultSvcs;
  var isAdmin = false;
  try {
    var raw = localStorage.getItem(NEGOCIO + '_services');
    if (raw) {
      var parsed = JSON.parse(raw);
      if (parsed && parsed.length) {
        svcs = parsed.map(function (s) {
          return {
            n:       s.nombre,
            d:       s.duracion_min,      // minutos que bloquea la agenda
            display: s.duracion_display,  // texto que ve el cliente ("3 horas", "45 min"…)
            p:       String(s.precio || '0'),
            pop:     !!s.pop
          };
        });
        isAdmin = true;
      }
    }
  } catch (e) { svcs = defaultSvcs; }

  /* ── Leer ausencias del admin → bloquear días en el calendario ── */
  // Formato en localStorage: { "workerId": ["2025-07-01", "2025-07-04", …], … }
  // Si un día está marcado como ausente en CUALQUIER trabajador → se bloquea.
  // (Para barberías de un solo trabajador esto es lo correcto.)
  var absentDates = null;
  try {
    var ausRaw = localStorage.getItem(NEGOCIO + '_ausencias');
    if (ausRaw) {
      var aus = JSON.parse(ausRaw);
      var dateMap = {};
      Object.keys(aus).forEach(function (wid) {
        (aus[wid] || []).forEach(function (d) { dateMap[d] = true; });
      });
      if (Object.keys(dateMap).length > 0) absentDates = dateMap;
    }
  } catch (e) {}

  /* ── Inicializar booking widget ────────────────────────── */
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

})();
