// api/ausencias.js
//
// GET  /api/ausencias?negocio=peluqueria
//      → PÚBLICO. Devuelve { ausencias: { "<workerId>": ["2026-07-01", ...], ... } }
//        Si CUALQUIER trabajador está ausente un día, el widget de reservas
//        lo usa para bloquear ese día en negocios de un solo trabajador.
//        (La lógica fina de "menos capacidad" la calcula api/booking.js.)
//
// POST /api/ausencias            (requiere token)
//      body: { negocio, trabajador_id, fecha, accion, token }
//        accion = 'add'    → marca ese día como ausencia
//        accion = 'remove' → quita la ausencia
//        accion = 'toggle' (default) → si existe la quita, si no la añade

const { createClient } = require('@supabase/supabase-js');

function sb() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
}

module.exports = async function handler(req, res) {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    // ── GET: listar ausencias del negocio ─────────────────────────────────
    // Público — devuelve solo fechas y workerId, ningún dato personal.
    if (req.method === 'GET') {
      const { negocio } = req.query;
      if (!negocio) return res.status(400).json({ error: 'Falta negocio' });

      const { data, error } = await sb()
        .from('ausencias')
        .select('trabajador_id, fecha')
        .eq('negocio', negocio);

      if (error) return res.status(500).json({ error: error.message });

      // Convertir a mapa { workerId: ['YYYY-MM-DD', ...] } para el frontend
      const map = {};
      (data || []).forEach(a => {
        const wid = String(a.trabajador_id);
        if (!map[wid]) map[wid] = [];
        map[wid].push(a.fecha);
      });

      return res.status(200).json({ ausencias: map });
    }

    // ── POST: añadir/quitar/toggle ausencia ───────────────────────────────
    if (req.method === 'POST') {
      const token = req.body && req.body.token;
      if (!token || token !== process.env.ADMIN_TOKEN) {
        return res.status(401).json({ error: 'No autorizado' });
      }

      const { negocio, trabajador_id, fecha } = req.body || {};
      const accion = (req.body && req.body.accion) || 'toggle';

      if (!negocio || !trabajador_id || !fecha) {
        return res.status(400).json({ error: 'Faltan campos: negocio, trabajador_id, fecha' });
      }

      // Validar formato de fecha (YYYY-MM-DD)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
        return res.status(400).json({ error: 'fecha debe ser YYYY-MM-DD' });
      }

      // ── Toggle: comprobar si existe ──────────────────────────────────────
      if (accion === 'toggle') {
        const { data: existing } = await sb()
          .from('ausencias')
          .select('id')
          .eq('trabajador_id', trabajador_id)
          .eq('fecha', fecha)
          .maybeSingle();

        if (existing) {
          const { error } = await sb()
            .from('ausencias')
            .delete()
            .eq('id', existing.id);
          if (error) return res.status(500).json({ error: error.message });
          return res.status(200).json({ ok: true, estado: 'removed' });
        }

        const { error } = await sb()
          .from('ausencias')
          .insert({ negocio, trabajador_id, fecha });
        if (error) return res.status(500).json({ error: error.message });
        return res.status(200).json({ ok: true, estado: 'added' });
      }

      // ── Add explícito (idempotente por UNIQUE constraint) ───────────────
      if (accion === 'add') {
        const { error } = await sb()
          .from('ausencias')
          .upsert({ negocio, trabajador_id, fecha }, { onConflict: 'trabajador_id,fecha', ignoreDuplicates: true });
        if (error) return res.status(500).json({ error: error.message });
        return res.status(200).json({ ok: true, estado: 'added' });
      }

      // ── Remove explícito ────────────────────────────────────────────────
      if (accion === 'remove') {
        const { error } = await sb()
          .from('ausencias')
          .delete()
          .eq('trabajador_id', trabajador_id)
          .eq('fecha', fecha);
        if (error) return res.status(500).json({ error: error.message });
        return res.status(200).json({ ok: true, estado: 'removed' });
      }

      return res.status(400).json({ error: 'accion debe ser add | remove | toggle' });
    }

    return res.status(405).json({ error: 'Método no permitido' });

  } catch (err) {
    return res.status(500).json({ error: 'Excepción interna: ' + err.message });
  }
};
