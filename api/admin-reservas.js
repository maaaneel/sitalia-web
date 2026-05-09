// api/admin-reservas.js
// GET  ?negocio=peluqueria&fecha=2025-05-15&token=XXX  → reservas del día
// DELETE ?id=123&token=XXX                              → cancelar reserva

const { createClient } = require('@supabase/supabase-js');
const { Resend }       = require('resend');

function sb() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
}
function fmt(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h + ':' + (m < 10 ? '0' : '') + m;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Verificar token de admin
  const token = req.query.token || (req.body && req.body.token);
  if (!token || token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ error: 'No autorizado' });
  }

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

    // Email de cancelación al cliente
    if (reserva && reserva.email) {
      try {
        const resend  = new Resend(process.env.RESEND_API_KEY);
        const fechaES = new Date(reserva.fecha + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
        await resend.emails.send({
          from:    'Barberia El Rincón <reservas@sitalia.es>',
          to:      reserva.email,
          subject: `Reserva cancelada — ${fmt(reserva.hora_inicio)} el ${fechaES}`,
          html: `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto;color:#111">
              <h2>Tu reserva ha sido cancelada</h2>
              <p>Hola <strong>${reserva.nombre}</strong>, tu cita del <strong>${fechaES} a las ${fmt(reserva.hora_inicio)}</strong> ha sido cancelada.</p>
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
