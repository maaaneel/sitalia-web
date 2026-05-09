// api/contact.js — Vercel Serverless Function
// Guarda el lead en Supabase Y envía notificación por email via Resend.
// Ninguna credencial aparece en el código fuente de la web.

const { createClient } = require('@supabase/supabase-js');
const { Resend }       = require('resend');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { nombre, telefono, tipo_negocio, mensaje } = req.body || {};

  if (!nombre || !telefono || !tipo_negocio) {
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  }

  // ── 1. Guardar en Supabase ──────────────────────────────────────────────
  try {
    const sb = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );
    const { error } = await sb.from('leads').insert({
      nombre,
      telefono,
      tipo_negocio,
      mensaje: mensaje || null,
    });
    if (error) console.error('Supabase error:', error.message);
  } catch (e) {
    console.error('Supabase exception:', e);
  }

  // ── 2. Enviar email de notificación via Resend ──────────────────────────
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: 'Sitalia Web <notificaciones@sitalia.es>',
      to:   'hola@sitalia.es',
      subject: `🔔 Nuevo lead: ${nombre} — ${tipo_negocio}`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#111">
          <h2 style="color:#2563eb;margin-bottom:4px">Nuevo contacto en Sitalia</h2>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0">
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:8px 0;color:#6b7280;font-size:13px;width:130px">Nombre</td>
                <td style="padding:8px 0;font-weight:600">${nombre}</td></tr>
            <tr><td style="padding:8px 0;color:#6b7280;font-size:13px">Teléfono</td>
                <td style="padding:8px 0;font-weight:600">${telefono}</td></tr>
            <tr><td style="padding:8px 0;color:#6b7280;font-size:13px">Sector</td>
                <td style="padding:8px 0;font-weight:600">${tipo_negocio}</td></tr>
            ${mensaje ? `<tr><td style="padding:8px 0;color:#6b7280;font-size:13px;vertical-align:top">Mensaje</td>
                <td style="padding:8px 0">${mensaje}</td></tr>` : ''}
          </table>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0">
          <p style="font-size:12px;color:#9ca3af">Recibido desde sitalia.es</p>
        </div>
      `,
    });
  } catch (e) {
    console.error('Resend error:', e);
    // No bloqueamos la respuesta si el email falla
  }

  return res.status(200).json({ ok: true });
};
