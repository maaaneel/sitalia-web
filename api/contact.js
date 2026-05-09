// api/contact.js — Vercel Serverless Function
// Las credenciales de Supabase viven SOLO aquí, como variables de entorno.
// El navegador nunca las ve.

const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  // CORS — permite llamadas desde el mismo dominio
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

  // Variables de entorno configuradas en Vercel → Settings → Environment Variables
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY; // service_role key (nunca expuesta)

  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase env vars not configured');
    // No bloqueamos el flujo: WhatsApp seguirá funcionando aunque Supabase no esté configurado
    return res.status(200).json({ ok: true, warn: 'supabase_not_configured' });
  }

  const sb = createClient(supabaseUrl, supabaseKey);

  const { error } = await sb.from('leads').insert({
    nombre,
    telefono,
    tipo_negocio,
    mensaje: mensaje || null,
  });

  if (error) {
    console.error('Supabase insert error:', error.message);
    return res.status(500).json({ error: 'Error al guardar el contacto' });
  }

  return res.status(200).json({ ok: true });
};
