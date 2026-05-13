// api/capacidad.js
//
// GET  /api/capacidad?negocio=X
//      → PÚBLICO. Devuelve { capacidad: { capacidad_por_slot, duracion_slot_min } | null }
//
// POST /api/capacidad
//      body: { negocio, capacidad_por_slot, duracion_slot_min }
//      → requiere ADMIN_TOKEN. Crea o actualiza la configuración del negocio.

const { createClient } = require('@supabase/supabase-js');
const { requireAdmin, setCors } = require('./_lib');

function sb() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
}

module.exports = async function handler(req, res) {
  try {
    var mode = (req.method === 'GET' || req.method === 'OPTIONS') ? 'public' : 'admin';
    setCors(res, req, { mode: mode, methods: 'GET, POST, OPTIONS' });
    if (req.method === 'OPTIONS') return res.status(200).end();

    // ── GET ────────────────────────────────────────────────────────────────
    if (req.method === 'GET') {
      const { negocio } = req.query;
      if (!negocio) return res.status(400).json({ error: 'Falta negocio' });

      const { data, error } = await sb()
        .from('negocio_capacidad')
        .select('capacidad_por_slot, duracion_slot_min')
        .eq('negocio', negocio)
        .maybeSingle();

      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ capacidad: data || null });
    }

    // ── POST ───────────────────────────────────────────────────────────────
    if (req.method === 'POST') {
      if (!requireAdmin(req, res)) return;

      const { negocio, capacidad_por_slot, duracion_slot_min } = req.body || {};
      if (!negocio) return res.status(400).json({ error: 'Falta negocio' });

      const capN = parseInt(capacidad_por_slot);
      const durN = parseInt(duracion_slot_min);
      if (!capN || capN < 1) return res.status(400).json({ error: 'capacidad_por_slot debe ser >= 1' });
      if (!durN || durN < 1) return res.status(400).json({ error: 'duracion_slot_min debe ser >= 1' });

      const { error } = await sb()
        .from('negocio_capacidad')
        .upsert(
          { negocio, capacidad_por_slot: capN, duracion_slot_min: durN },
          { onConflict: 'negocio' }
        );

      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Método no permitido' });

  } catch (err) {
    return res.status(500).json({ error: 'Excepción interna: ' + err.message });
  }
};
