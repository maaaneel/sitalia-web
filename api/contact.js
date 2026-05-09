// api/contact.js — Vercel Serverless Function
// 1. Guarda el lead en Supabase
// 2. Envía notificación a hola@sitalia.es
// 3. Envía email de confirmación automática al cliente

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

  const { nombre, apellido, email, telefono, tipo_negocio, mensaje } = req.body || {};

  if (!nombre || !apellido || !email || !tipo_negocio) {
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
      apellido,
      email,
      telefono:     telefono || null,
      tipo_negocio,
      mensaje:      mensaje || null,
    });
    if (error) console.error('Supabase error:', error.message);
  } catch (e) {
    console.error('Supabase exception:', e);
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  // ── 2. Notificación interna a hola@sitalia.es ───────────────────────────
  try {
    await resend.emails.send({
      from:    'Sitalia Web <notificaciones@sitalia.es>',
      to:      'hola@sitalia.es',
      replyTo: email,
      subject: `🔔 Nuevo lead: ${nombre} ${apellido} — ${tipo_negocio}`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#111">
          <h2 style="color:#2563eb;margin-bottom:4px">Nuevo contacto en Sitalia</h2>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0">
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:8px 0;color:#6b7280;font-size:13px;width:130px">Nombre</td>
                <td style="padding:8px 0;font-weight:600">${nombre} ${apellido}</td></tr>
            <tr><td style="padding:8px 0;color:#6b7280;font-size:13px">Email</td>
                <td style="padding:8px 0;font-weight:600"><a href="mailto:${email}" style="color:#2563eb">${email}</a></td></tr>
            ${telefono ? `<tr><td style="padding:8px 0;color:#6b7280;font-size:13px">Teléfono</td>
                <td style="padding:8px 0;font-weight:600">${telefono}</td></tr>` : ''}
            <tr><td style="padding:8px 0;color:#6b7280;font-size:13px">Sector</td>
                <td style="padding:8px 0;font-weight:600">${tipo_negocio}</td></tr>
            ${mensaje ? `<tr><td style="padding:8px 0;color:#6b7280;font-size:13px;vertical-align:top">Mensaje</td>
                <td style="padding:8px 0">${mensaje}</td></tr>` : ''}
          </table>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0">
          <a href="mailto:${email}" style="display:inline-block;background:#2563eb;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:500">
            Responder a ${nombre}
          </a>
          <p style="font-size:12px;color:#9ca3af;margin-top:16px">Recibido desde sitalia.es</p>
        </div>
      `,
    });
  } catch (e) {
    console.error('Resend (notificación interna) error:', e);
  }

  // ── 3. Email de confirmación automática al cliente ──────────────────────
  try {
    await resend.emails.send({
      from:    'Manel de Sitalia <hola@sitalia.es>',
      to:      email,
      subject: `Hemos recibido tu mensaje, ${nombre} 👋`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#111">

          <div style="background:#2563eb;padding:32px;border-radius:12px 12px 0 0;text-align:center">
            <svg width="40" height="40" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="32" height="32" rx="8" fill="white" fill-opacity="0.15"/>
              <rect x="7" y="7" width="7" height="7" rx="2" fill="white"/>
              <rect x="18" y="7" width="7" height="7" rx="2" fill="white" opacity="0.6"/>
              <rect x="7" y="18" width="7" height="7" rx="2" fill="white" opacity="0.6"/>
              <rect x="18" y="18" width="7" height="7" rx="2" fill="white"/>
            </svg>
            <h1 style="color:#fff;margin:12px 0 4px;font-size:22px">sitalia</h1>
            <p style="color:rgba(255,255,255,0.75);margin:0;font-size:14px">Webs profesionales para negocios locales</p>
          </div>

          <div style="background:#fff;padding:32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
            <p style="font-size:16px;margin-top:0">Hola <strong>${nombre}</strong>,</p>
            <p style="color:#374151;line-height:1.6">
              Hemos recibido tu mensaje y nos pondremos en contacto contigo en las próximas <strong>24 horas</strong>.
            </p>
            <p style="color:#374151;line-height:1.6">
              Mientras tanto, puedes echar un vistazo a algunos de nuestros ejemplos de webs para negocios locales:
            </p>

            <div style="background:#f9fafb;border-radius:8px;padding:20px;margin:24px 0">
              <p style="margin:0 0 8px;font-size:13px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:.05em">Tu solicitud</p>
              <p style="margin:0;color:#111"><strong>Sector:</strong> ${tipo_negocio}</p>
              ${mensaje ? `<p style="margin:8px 0 0;color:#111"><strong>Mensaje:</strong> ${mensaje}</p>` : ''}
            </div>

            <a href="https://sitalia.es" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;margin-bottom:24px">
              Ver ejemplos en sitalia.es →
            </a>

            <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
            <p style="color:#6b7280;font-size:13px;margin:0">
              Un saludo,<br>
              <strong style="color:#111">Manel · Sitalia</strong><br>
              <a href="mailto:hola@sitalia.es" style="color:#2563eb">hola@sitalia.es</a>
            </p>
          </div>

        </div>
      `,
    });
  } catch (e) {
    console.error('Resend (confirmación cliente) error:', e);
  }

  return res.status(200).json({ ok: true });
};
