// api/booking.js
// GET  /api/booking?negocio=peluqueria&fecha=2025-05-15
//      → devuelve los minutos de inicio de los slots ya reservados
// POST /api/booking
//      → crea una reserva + envía emails de confirmación

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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // ── GET: disponibilidad ─────────────────────────────────────────────────
  if (req.method === 'GET') {
    const { negocio, fecha } = req.query;
    if (!negocio || !fecha) {
      return res.status(400).json({ error: 'Faltan parámetros' });
    }
    const { data, error } = await sb()
      .from('reservas')
      .select('hora_inicio, duracion_min')
      .eq('negocio', negocio)
      .eq('fecha', fecha)
      .eq('estado', 'confirmada');

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ reservados: data.map(r => r.hora_inicio) });
  }

  // ── POST: crear reserva ─────────────────────────────────────────────────
  if (req.method === 'POST') {
    const { negocio, servicio, duracion_min, precio, fecha, hora_inicio, hora_fin, nombre, telefono, email } = req.body || {};

    if (!negocio || !servicio || !fecha || !hora_inicio || !nombre || !email) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    // Comprobar que el slot sigue libre
    const { data: existing } = await sb()
      .from('reservas')
      .select('id')
      .eq('negocio', negocio)
      .eq('fecha', fecha)
      .eq('hora_inicio', hora_inicio)
      .eq('estado', 'confirmada');

    if (existing && existing.length > 0) {
      return res.status(409).json({ error: 'Este horario ya no está disponible. Por favor elige otro.' });
    }

    // Insertar reserva
    const { data: reserva, error } = await sb()
      .from('reservas')
      .insert({ negocio, servicio, duracion_min, precio, fecha, hora_inicio, hora_fin, nombre, telefono: telefono || null, email, estado: 'confirmada' })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });

    // Emails
    try {
      const resend  = new Resend(process.env.RESEND_API_KEY);
      const fechaES = new Date(fecha + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

      // Email al cliente
      await resend.emails.send({
        from:    'Barberia El Rincón <reservas@sitalia.es>',
        to:      email,
        subject: `✂️ Reserva confirmada — ${fmt(hora_inicio)} el ${fechaES}`,
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#111">
            <div style="background:#111;padding:28px;border-radius:12px 12px 0 0;text-align:center">
              <h1 style="color:#fff;margin:0;font-size:22px;letter-spacing:-.02em">Barberia El Rincón</h1>
              <p style="color:rgba(255,255,255,.6);margin:6px 0 0;font-size:13px">Tu reserva está confirmada ✓</p>
            </div>
            <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;padding:32px">
              <p style="margin-top:0">Hola <strong>${nombre}</strong>, aquí tienes los detalles de tu cita:</p>
              <div style="background:#f9fafb;border-radius:8px;padding:20px;margin:0 0 24px">
                <table style="width:100%;border-collapse:collapse">
                  <tr><td style="padding:6px 0;color:#6b7280;font-size:13px;width:120px">Servicio</td><td style="padding:6px 0;font-weight:600">${servicio}</td></tr>
                  <tr><td style="padding:6px 0;color:#6b7280;font-size:13px">Día</td><td style="padding:6px 0;font-weight:600">${fechaES}</td></tr>
                  <tr><td style="padding:6px 0;color:#6b7280;font-size:13px">Hora</td><td style="padding:6px 0;font-weight:600">${fmt(hora_inicio)} — ${fmt(hora_fin)}</td></tr>
                  ${precio ? `<tr><td style="padding:6px 0;color:#6b7280;font-size:13px">Precio</td><td style="padding:6px 0;font-weight:600">${precio}€</td></tr>` : ''}
                </table>
              </div>
              <p style="color:#374151;font-size:14px">Si necesitas cancelar o cambiar tu cita, responde a este email.</p>
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
              <p style="color:#9ca3af;font-size:12px;margin:0">Barberia El Rincón · Web por <a href="https://sitalia.es" style="color:#2563eb">Sitalia</a></p>
            </div>
          </div>`,
      });

      // Email al negocio
      await resend.emails.send({
        from:    'Sitalia Reservas <notificaciones@sitalia.es>',
        to:      'hola@sitalia.es',
        replyTo: email,
        subject: `✂️ Nueva reserva: ${nombre} — ${fmt(hora_inicio)} el ${fechaES}`,
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;color:#111">
            <h2 style="color:#111;margin-bottom:4px">Nueva reserva recibida</h2>
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0">
            <table style="width:100%;border-collapse:collapse">
              <tr><td style="padding:7px 0;color:#6b7280;font-size:13px;width:120px">Cliente</td><td style="padding:7px 0;font-weight:600">${nombre}</td></tr>
              ${telefono ? `<tr><td style="padding:7px 0;color:#6b7280;font-size:13px">Teléfono</td><td style="padding:7px 0;font-weight:600">${telefono}</td></tr>` : ''}
              <tr><td style="padding:7px 0;color:#6b7280;font-size:13px">Email</td><td style="padding:7px 0"><a href="mailto:${email}" style="color:#2563eb">${email}</a></td></tr>
              <tr><td style="padding:7px 0;color:#6b7280;font-size:13px">Servicio</td><td style="padding:7px 0;font-weight:600">${servicio}</td></tr>
              <tr><td style="padding:7px 0;color:#6b7280;font-size:13px">Día</td><td style="padding:7px 0;font-weight:600">${fechaES}</td></tr>
              <tr><td style="padding:7px 0;color:#6b7280;font-size:13px">Hora</td><td style="padding:7px 0;font-weight:600">${fmt(hora_inicio)} — ${fmt(hora_fin)}</td></tr>
            </table>
          </div>`,
      });
    } catch (e) {
      console.error('Email error:', e);
    }

    return res.status(200).json({ ok: true, id: reserva.id });
  }

  return res.status(405).json({ error: 'Método no permitido' });
};
