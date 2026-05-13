// api/trabajadores.js
//
// Auth: header `Authorization: Bearer <ADMIN_TOKEN>` (preferido).
//       Se mantiene compatibilidad temporal con ?token= y body.token.
//
// GET    ?negocio=peluqueria              → lista trabajadores activos
// POST   { negocio, nombre, horario, id? } → crear o actualizar
// DELETE ?id=X                             → desactivar (soft delete)
//
// Horario format (JSONB array):
//   [{ dow: 0, inicio: 540, fin: 1200 }, ...]   dow 0=Lun … 6=Dom
//   inicio/fin en minutos desde medianoche · null = no trabaja ese día

const { createClient } = require('@supabase/supabase-js');
const { requireAdmin, setCors } = require('./_lib');

function sb() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
}

module.exports = async function handler(req, res) {
  // Siempre responder JSON — nunca dejar que Vercel devuelva HTML de error
  try {
    // Endpoint de administración → CORS restringido a sitalia.es / previews.
    setCors(res, req, { mode: 'admin', methods: 'GET, POST, DELETE, OPTIONS' });
    if (req.method === 'OPTIONS') return res.status(200).end();

    // Token vía header Authorization (con fallback legado a query/body).
    if (!requireAdmin(req, res)) return;

    // ── GET: listar trabajadores ──────────────────────────────────────────
    if (req.method === 'GET') {
      const { negocio } = req.query;
      if (!negocio) return res.status(400).json({ error: 'Falta negocio' });

      const { data, error } = await sb()
        .from('trabajadores')
        .select('*')
        .eq('negocio', negocio)
        .eq('activo', true)
        .order('nombre');

      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ trabajadores: data || [] });
    }

    // ── POST: crear o actualizar ──────────────────────────────────────────
    if (req.method === 'POST') {
      const { negocio, nombre, horario, id } = req.body || {};
      if (!negocio || !nombre) return res.status(400).json({ error: 'Faltan campos: negocio=' + negocio + ' nombre=' + nombre });

      let result;
      if (id) {
        result = await sb()
          .from('trabajadores')
          .update({ nombre: nombre.trim(), horario: horario || [] })
          .eq('id', id);
      } else {
        result = await sb()
          .from('trabajadores')
          .insert({ negocio, nombre: nombre.trim(), horario: horario || [], activo: true });
      }

      if (result.error) return res.status(500).json({ error: result.error.message });
      return res.status(200).json({ ok: true });
    }

    // ── DELETE: desactivar trabajador ─────────────────────────────────────
    if (req.method === 'DELETE') {
      const id = req.query.id;
      if (!id) return res.status(400).json({ error: 'Falta id' });

      const { error } = await sb()
        .from('trabajadores')
        .update({ activo: false })
        .eq('id', id);

      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Método no permitido' });

  } catch (err) {
    // Capturar cualquier excepción no controlada y devolver JSON
    return res.status(500).json({ error: 'Excepción interna: ' + err.message });
  }
};
