// api/admin-reservas.js
//
// Auth: header `Authorization: Bearer <ADMIN_TOKEN>` (preferido).
//       Se mantiene compatibilidad temporal con ?token= y body.token.
//
// GET    ?negocio=peluqueria&fecha=2026-05-15  → reservas del día
// DELETE ?id=123                                → cancelar reserva (+ email)

const { createClient } = require('@supabase/supabase-js');
const { Resend }       = require('resend');
const { esc, requireAdmin, setCors } = require('./_lib');

function sb() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
}
function fmt(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h + ':' + (m < 10 ? '0' : '') + m;
}

module.exports = async function handler(req, res) {
  // Endpoint de administración → CORS restringido a sitalia.es / previews.
  setCors(res, req, { mode: 'admin', methods: 'GET, DELETE, OPTIONS' });
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Token vía header Authorization (con fallback legado a query/body).
  if (!requireAdmin(req, res)) return;

  // ── GET: reservas del día ───────────────────────────────────────────────
  if (req.method === 'GET') {
    const { negocio, fecha } = req.query;
    if (!negocio || !fecha) return res.status(400).json({ error: 'Faltan parámetros' });

    const { data, error } = await sb()
      .from('reservas')
      .select('*')
      .eq('negocio', negocio)
      .eq('fecha', fecha)
      .eq('estado', 'confirmada')
      .order('hora_inicio', { ascending: true });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ reservas: data });
  }

  // ── DELETE: cancelar reserva ────────────────────────────────────────────
  if (req.method === 'DELETE') {
    const id = req.query.id || (req.body && req.body.id);
    if (!id) return res.status(400).json({ error: 'Falta id' });

    // Obtener datos para enviar email de cancelación
    const { data: reserva } = await sb()
      .from('reservas')
      .select('*')
      .eq('id', id)
      .single();

    const { error } = await sb()
      .from('reservas')
      .update({ estado: 'cancelada' })
      .eq('id', id);

    if (error) return res.status(500).json({ error: error.message });

    // Email de cancelación al cliente — escapamos todas las variables de
    // usuario antes de inyectarlas en HTML para evitar XSS.
    if (reserva && reserva.email) {
      try {
        const resend  = new Resend(process.env.RESEND_API_KEY);
        const fechaES = new Date(reserva.fecha + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
        const sNombre  = esc(reserva.nombre);
        const sFechaES = esc(fechaES);
        const sHora    = esc(fmt(reserva.hora_inicio));
        await resend.emails.send({
          from:    'Barberia El Rincón <reservas@sitalia.es>',
          to:      reserva.email,
          subject: `Reserva cancelada — ${fmt(reserva.hora_inicio)} el ${fechaES}`,
          html: `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto;color:#111">
              <h2>Tu reserva ha sido cancelada</h2>
              <p>Hola <strong>${sNombre}</strong>, tu cita del <strong>${sFechaES} a las ${sHora}</strong> ha sido cancelada.</p>
              <p>Si quieres hacer una nueva reserva, visita nuestra web o responde a este email.</p>
              <p style="color:#9ca3af;font-size:12px">Barberia El Rincón · Web por <a href="https://sitalia.es" style="color:#2563eb">Sitalia</a></p>
            </div>`,
        });
      } catch (e) { console.error('Email cancelación error:', e); }
    }

    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Método no permitido' });
};
