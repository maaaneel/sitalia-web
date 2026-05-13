// api/servicios.js
//
// GET    /api/servicios?negocio=peluqueria
//        → PÚBLICO (sin token). Devuelve los servicios activos del negocio.
//          Lo consume el widget de reservas y también el panel admin.
//
// POST   /api/servicios            (requiere token)
//        body: { negocio, nombre, duracion_min, duracion_display, precio, pop, orden, id?, token }
//        → crea (sin id) o actualiza (con id) un servicio.
//
// DELETE /api/servicios?id=X&token=XXX
//        → soft delete (activo=false). Las reservas históricas siguen apuntando
//          al nombre del servicio (texto) así que no se pierde nada.

const { createClient } = require('@supabase/supabase-js');
const { requireAdmin, setCors } = require('./_lib');

function sb() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
}

module.exports = async function handler(req, res) {
  try {
    // CORS condicional: el GET es público (lo consume el widget desde el
    // dominio del cliente); el POST/DELETE solo desde sitalia.es.
    var mode = (req.method === 'GET' || req.method === 'OPTIONS') ? 'public' : 'admin';
    setCors(res, req, { mode: mode, methods: 'GET, POST, DELETE, OPTIONS' });
    if (req.method === 'OPTIONS') return res.status(200).end();

    // ── GET: listar servicios ─────────────────────────────────────────────
    // Público — no requiere token. Solo expone el catálogo activo del negocio.
    if (req.method === 'GET') {
      const { negocio } = req.query;
      if (!negocio) return res.status(400).json({ error: 'Falta negocio' });

      const { data, error } = await sb()
        .from('servicios')
        .select('id, nombre, duracion_min, duracion_display, precio, pop, orden')
        .eq('negocio', negocio)
        .eq('activo', true)
        .order('orden', { ascending: true })
        .order('id',    { ascending: true });

      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ servicios: data || [] });
    }

    // ── Resto de métodos requieren token (Authorization: Bearer XXX) ──────
    if (!requireAdmin(req, res)) return;

    // ── POST: crear o actualizar ──────────────────────────────────────────
    if (req.method === 'POST') {
      const {
        negocio, nombre, duracion_min, duracion_display,
        precio, pop, orden, id
      } = req.body || {};

      if (!negocio || !nombre || !duracion_min) {
        return res.status(400).json({ error: 'Faltan campos: negocio, nombre, duracion_min' });
      }

      const payload = {
        negocio,
        nombre:           String(nombre).trim(),
        duracion_min:     parseInt(duracion_min),
        duracion_display: duracion_display ? String(duracion_display).trim() : null,
        precio:           (precio === '' || precio === null || precio === undefined) ? null : parseFloat(precio),
        pop:              !!pop,
        orden:            orden !== undefined ? parseInt(orden) : 0
      };

      let result;
      if (id) {
        result = await sb()
          .from('servicios')
          .update(payload)
          .eq('id', id)
          .select()
          .single();
      } else {
        result = await sb()
          .from('servicios')
          .insert({ ...payload, activo: true })
          .select()
          .single();
      }

      if (result.error) return res.status(500).json({ error: result.error.message });
      return res.status(200).json({ ok: true, servicio: result.data });
    }

    // ── DELETE: soft delete (marca activo=false) ──────────────────────────
    if (req.method === 'DELETE') {
      const id = req.query.id;
      if (!id) return res.status(400).json({ error: 'Falta id' });

      const { error } = await sb()
        .from('servicios')
        .update({ activo: false })
        .eq('id', id);

      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Método no permitido' });

  } catch (err) {
    return res.status(500).json({ error: 'Excepción interna: ' + err.message });
  }
};
