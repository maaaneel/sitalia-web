/* ============================================================
   SITALIA — peluqueria-config.js
   Configuración específica de Barberia El Rincón.
   Para desplegar un nuevo cliente: solo editar este archivo.
   Requiere: shared.js cargado antes.
   ============================================================ */

Sitalia.loadScheduleAndInit({

  /* Identificador único del negocio en Supabase */
  negocio: 'peluqueria',

  /* Servicio preseleccionado al abrir el widget (índice del array) */
  preselectSvc: 2,

  /* Horario por defecto mientras carga desde la API.
     0 = Lunes … 6 = Domingo. null = cerrado.
     [inicio, fin] en minutos desde medianoche. */
  sched: [
    null,           // Lunes    — cerrado
    [540, 1200],    // Martes   — 9:00–20:00
    [540, 1200],    // Miércoles
    [540, 1200],    // Jueves
    [540, 1200],    // Viernes
    [540, 1080],    // Sábado   — 9:00–18:00
    null            // Domingo  — cerrado
  ],

  /* Catálogo de servicios */
  svcs: [
    { n: 'Corte de pelo',       d: 30, p: '18' },
    { n: 'Arreglo de barba',    d: 20, p: '12' },
    { n: 'Corte + Barba',       d: 45, p: '25', pop: true },
    { n: 'Afeitado con navaja', d: 40, p: '20' },
    { n: 'Corte niño',          d: 25, p: '12' },
    { n: 'Tratamiento capilar', d: 20, p: '15' }
  ],

  /* Número de WhatsApp para reservas por chat (sin +) */
  phone: '34612345678'

});
