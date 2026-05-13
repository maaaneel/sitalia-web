// api/schedule.js
// GET /api/schedule?negocio=X
// Devuelve la disponibilidad agregada según los horarios de los trabajadores.
// Sin autenticación — solo expone qué franjas hay cubiertas, no datos personales.
//
// Respuesta: { hasWorkers: bool, sched: [null|[ini,fin], ...] }
//   sched[0] = Lunes … sched[6] = Domingo
//   null = ningún trabajador trabaja ese día
//   [ini, fin] = minutos desde medianoche (union de horarios de todos los trabajadores ese día)

const { createClient } = require('@supabase/supabase-js');

function sb() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
}

module.exports = async function handler(req, res) {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' });

    const { negocio } = req.query;
    if (!negocio) return res.status(400).json({ error: 'Falta negocio' });

    // Configuración de capacidad por slot (si existe)
    const { data: capCfg } = await sb()
      .from('negocio_capacidad')
      .select('capacidad_por_slot, duracion_slot_min')
      .eq('negocio', negocio)
      .maybeSingle();

    const { data: workers, error } = await sb()
      .from('trabajadores')
      .select('horario')
      .eq('negocio', negocio)
      .eq('activo', true);

    if (error) return res.status(500).json({ error: error.message });

    if (!workers || workers.length === 0) {
      return res.status(200).json({
        hasWorkers: false,
        sched: [null, null, null, null, null, null, null],
        capacidad: capCfg || null
      });
    }

    // Para cada día de la semana, calcular la unión de horarios de todos los trabajadores
    const sched = [];
    for (let dow = 0; dow < 7; dow++) {
      let minStart = Infinity;
      let maxEnd   = -Infinity;
      let covered  = false;

      for (const w of workers) {
        const day = (w.horario || []).find(h => h.dow === dow);
        if (day && day.inicio !== null && day.fin !== null) {
          covered = true;
          if (day.inicio < minStart) minStart = day.inicio;
          if (day.fin   > maxEnd)   maxEnd   = day.fin;
        }
      }

      sched.push(covered ? [minStart, maxEnd] : null);
    }

    return res.status(200).json({ hasWorkers: true, sched, capacidad: capCfg || null });

  } catch (err) {
    return res.status(500).json({ error: 'Error interno: ' + err.message });
  }
};
