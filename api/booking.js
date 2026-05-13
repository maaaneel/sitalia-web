// api/booking.js
// GET  /api/booking?negocio=peluqueria&fecha=2025-05-15[&rango_ini=540&rango_fin=1200&duracion=30]
//      → devuelve los slots bloqueados (fully booked o sin trabajador disponible)
// POST /api/booking
//      → crea una reserva + envía emails de confirmación

const { createClient } = require('@supabase/supabase-js');
const { Resend }       = require('resend');
const { esc, setCors } = require('./_lib');

function sb() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
}
function fmt(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h + ':' + (m < 10 ? '0' : '') + m;
}

// Cuántos trabajadores activos están disponibles a la hora t del día dow (0=Lun, 6=Dom)
function workersAt(workers, dow, t) {
  return workers.filter(w => {
    const day = (w.horario || []).find(h => h.dow === dow);
    if (!day || day.inicio === null || day.fin === null) return false;
    return t >= day.inicio && t < day.fin;
  }).length;
}

// ¿Se solapan los intervalos [h, h+dm) y [t, t+dur)?
// Dos intervalos se solapan si uno empieza antes de que el otro termine.
function intervalsOverlap(h, dm, t, dur) {
  return h < t + dur && h + dm > t;
}

// Cuántas reservas existentes solapan con el slot [t, t+dur)
function countOverlapping(bookings, t, dur) {
  return (bookings || []).filter(b => intervalsOverlap(b.hora_inicio, b.duracion_min, t, dur)).length;
}

module.exports = async function handler(req, res) {
  // Este endpoint es PÚBLICO — lo consumen widgets en dominios de cliente.
  setCors(res, req, { mode: 'public', methods: 'GET, POST, OPTIONS' });
  if (req.method === 'OPTIONS') return res.status(200).end();

  // ── GET: disponibilidad con capacidad por trabajadores ──────────────────
  if (req.method === 'GET') {
    const { negocio, fecha, rango_ini, rango_fin, duracion } = req.query;
    if (!negocio || !fecha) return res.status(400).json({ error: 'Faltan parámetros' });

    // Comprobar si el negocio usa modo "capacidad fija" (rostisseria, take-away…)
    const { data: capacityConfig } = await sb()
      .from('negocio_capacidad')
      .select('capacidad_por_slot, duracion_slot_min')
      .eq('negocio', negocio)
      .maybeSingle();

    // Reservas confirmadas del día (necesitamos hora_inicio Y duracion_min para el chequeo de solapamiento)
    const { data: bookings, error: bErr } = await sb()
      .from('reservas')
      .select('hora_inicio, duracion_min')
      .eq('negocio', negocio)
      .eq('fecha', fecha)
      .eq('estado', 'confirmada');

    if (bErr) return res.status(500).json({ error: bErr.message });

    // ── MODO CAPACIDAD: simple, no depende de trabajadores ─────────────
    //    Cada slot tiene una capacidad fija. Se cuentan las reservas
    //    cuya hora_inicio coincide con el slot.
    if (capacityConfig) {
      const cap = capacityConfig.capacidad_por_slot;
      const slotMin = capacityConfig.duracion_slot_min;

      // Agrupar reservas por hora_inicio
      const counts = {};
      (bookings || []).forEach(b => {
        counts[b.hora_inicio] = (counts[b.hora_inicio] || 0) + 1;
      });

      // Si nos dan rango, recorremos los slots
      if (rango_ini && rango_fin) {
        const ini = parseInt(rango_ini);
        const fin = parseInt(rango_fin);
        const reservados = [];
        for (let t = ini; t + slotMin <= fin; t += slotMin) {
          if ((counts[t] || 0) >= cap) reservados.push(t);
        }
        return res.status(200).json({
          hasWorkers: true,
          mode: 'capacity',
          capacidad_por_slot: cap,
          duracion_slot_min: slotMin,
          reservados
        });
      }

      // Sin rango: devolvemos solo las horas saturadas
      const reservados = Object.keys(counts)
        .filter(t => counts[t] >= cap)
        .map(t => parseInt(t));
      return res.status(200).json({
        hasWorkers: true,
        mode: 'capacity',
        capacidad_por_slot: cap,
        duracion_slot_min: slotMin,
        reservados
      });
    }

    // ── MODO TRABAJADORES (clásico, peluquería/fisio/etc.) ─────────────
    const { data: workers } = await sb()
      .from('trabajadores')
      .select('horario')
      .eq('negocio', negocio)
      .eq('activo', true);

    const hasWorkers = workers && workers.length > 0;

    // ── Sin trabajadores: bloquear todo
    if (!hasWorkers) {
      // Devolver todas las horas de inicio con reservas como bloqueadas
      const starts = [...new Set((bookings || []).map(b => b.hora_inicio))];
      return res.status(200).json({ hasWorkers: false, reservados: starts });
    }

    const dateObj = new Date(fecha + 'T12:00:00');
    const jsDay   = dateObj.getDay();
    const dow     = jsDay === 0 ? 6 : jsDay - 1; // Mon=0, Sun=6

    // ── Con rango+duracion: recorrer todos los slots y comprobar solapamiento real
    if (rango_ini && rango_fin && duracion) {
      const ini = parseInt(rango_ini);
      const fin = parseInt(rango_fin);
      const dur = parseInt(duracion);

      const reservados = [];
      for (let t = ini; t + dur <= fin; t += dur) {
        const cap    = workersAt(workers, dow, t);
        // Contar reservas que solapan con este slot (independientemente del servicio/duración)
        const booked = countOverlapping(bookings, t, dur);
        if (cap === 0 || booked >= cap) reservados.push(t);
      }
      return res.status(200).json({ hasWorkers: true, reservados });
    }

    // ── Sin parámetros de rango: fallback con solapamiento parcial
    const starts = [...new Set((bookings || []).map(b => b.hora_inicio))];
    const reservados = starts.filter(t => {
      const cap    = workersAt(workers, dow, t);
      const booked = countOverlapping(bookings, t, 1); // mínimo: misma hora de inicio
      return cap === 0 || booked >= cap;
    });
    return res.status(200).json({ hasWorkers: true, reservados });
  }

  // ── POST: crear reserva ─────────────────────────────────────────────────
  if (req.method === 'POST') {
    const {
      negocio, servicio, duracion_min, precio,
      fecha, hora_inicio, hora_fin,
      nombre, telefono, email
    } = req.body || {};

    if (!negocio || !servicio || !fecha || hora_inicio === undefined || !nombre || !email) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    // Validación de email básica en el servidor también
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRe.test(email)) {
      return res.status(400).json({ error: 'El email introducido no es válido.' });
    }

    // ── Decidir qué función RPC usar (modo capacidad o modo trabajadores)
    const { data: capCfg } = await sb()
      .from('negocio_capacidad')
      .select('negocio')
      .eq('negocio', negocio)
      .maybeSingle();

    const rpcFn = capCfg ? 'crear_reserva_capacidad' : 'crear_reserva';

    const { data: reservaId, error } = await sb().rpc(rpcFn, {
      p_negocio:      negocio,
      p_servicio:     servicio,
      p_duracion_min: duracion_min || 30,
      p_precio:       precio !== undefined && precio !== null ? Number(precio) : null,
      p_fecha:        fecha,
      p_hora_inicio:  hora_inicio,
      p_hora_fin:     hora_fin,
      p_nombre:       String(nombre).trim(),
      p_telefono:     telefono || null,
      p_email:        String(email).trim()
    });

    if (error) {
      // Códigos de error definidos en la función PL/pgSQL
      // P0001 = SLOT_TAKEN  → 409 Conflict
      // P0002 = MISSING_FIELDS / INVALID_DURATION / INVALID_TIME_RANGE → 400
      if (error.code === 'P0001') {
        return res.status(409).json({ error: 'Este horario ya no está disponible. Por favor elige otro.' });
      }
      if (error.code === 'P0002') {
        return res.status(400).json({ error: 'Datos inválidos: ' + error.message });
      }
      console.error('crear_reserva error:', error);
      return res.status(500).json({ error: error.message });
    }

    // Pseudo-objeto reserva para mantener compatibilidad con el resto del handler.
    const reserva = { id: reservaId };

    // Emails de confirmación
    try {
      const resend  = new Resend(process.env.RESEND_API_KEY);
      const fechaES = new Date(fecha + 'T12:00:00').toLocaleDateString('es-ES', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
      });

      // ── Escapamos TODA variable controlada por el usuario antes de inyectarla
      //    en HTML. Si no, un cliente malicioso podría meter <script> en su nombre
      //    o usar el email como vector de XSS contra el dueño del negocio. ──────
      const sNombre   = esc(nombre);
      const sServicio = esc(servicio);
      const sEmail    = esc(email);
      const sTelefono = esc(telefono);
      const sFechaES  = esc(fechaES);
      const sHIni     = esc(fmt(hora_inicio));
      const sHFin     = esc(fmt(hora_fin));
      const sPrecio   = esc(precio);

      // ── Email para el cliente: confirmación de la reserva
      await resend.emails.send({
        from:    'Barberia El Rincón <reservas@sitalia.es>',
        to:      email,
        subject: `Reserva confirmada — ${fmt(hora_inicio)} el ${fechaES}`,
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#111">
            <div style="background:#111;padding:28px;border-radius:12px 12px 0 0;text-align:center">
              <h1 style="color:#fff;margin:0;font-size:22px;letter-spacing:-.02em">Barberia El Rincón</h1>
              <p style="color:rgba(255,255,255,.6);margin:6px 0 0;font-size:13px">Tu reserva está confirmada</p>
            </div>
            <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;padding:32px">
              <p style="margin-top:0">Hola <strong>${sNombre}</strong>, aquí tienes los detalles de tu cita:</p>
              <div style="background:#f9fafb;border-radius:8px;padding:20px;margin:0 0 24px">
                <table style="width:100%;border-collapse:collapse">
                  <tr><td style="padding:6px 0;color:#6b7280;font-size:13px;width:120px">Servicio</td><td style="padding:6px 0;font-weight:600">${sServicio}</td></tr>
                  <tr><td style="padding:6px 0;color:#6b7280;font-size:13px">Día</td><td style="padding:6px 0;font-weight:600">${sFechaES}</td></tr>
                  <tr><td style="padding:6px 0;color:#6b7280;font-size:13px">Hora</td><td style="padding:6px 0;font-weight:600">${sHIni} — ${sHFin}</td></tr>
                  ${precio ? `<tr><td style="padding:6px 0;color:#6b7280;font-size:13px">Precio</td><td style="padding:6px 0;font-weight:600">${sPrecio}€</td></tr>` : ''}
                </table>
              </div>
              <p style="color:#374151;font-size:14px">Si necesitas cancelar o cambiar tu cita, responde a este email.</p>
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
              <p style="color:#9ca3af;font-size:12px;margin:0">Barberia El Rincón · Web por <a href="https://sitalia.es" style="color:#2563eb">Sitalia</a></p>
            </div>
          </div>`,
      });

      // ── Email para el dueño: aviso de nueva reserva
      await resend.emails.send({
        from:    'Sitalia Reservas <notificaciones@sitalia.es>',
        to:      'hola@sitalia.es',
        replyTo: email,
        subject: `Nueva reserva: ${nombre} — ${fmt(hora_inicio)} el ${fechaES}`,
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;color:#111">
            <h2 style="color:#111;margin-bottom:4px">Nueva reserva recibida</h2>
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0">
            <table style="width:100%;border-collapse:collapse">
              <tr><td style="padding:7px 0;color:#6b7280;font-size:13px;width:120px">Cliente</td><td style="padding:7px 0;font-weight:600">${sNombre}</td></tr>
              ${telefono ? `<tr><td style="padding:7px 0;color:#6b7280;font-size:13px">Teléfono</td><td style="padding:7px 0;font-weight:600">${sTelefono}</td></tr>` : ''}
              <tr><td style="padding:7px 0;color:#6b7280;font-size:13px">Email</td><td style="padding:7px 0"><a href="mailto:${sEmail}" style="color:#2563eb">${sEmail}</a></td></tr>
              <tr><td style="padding:7px 0;color:#6b7280;font-size:13px">Servicio</td><td style="padding:7px 0;font-weight:600">${sServicio}</td></tr>
              <tr><td style="padding:7px 0;color:#6b7280;font-size:13px">Día</td><td style="padding:7px 0;font-weight:600">${sFechaES}</td></tr>
              <tr><td style="padding:7px 0;color:#6b7280;font-size:13px">Hora</td><td style="padding:7px 0;font-weight:600">${sHIni} — ${sHFin}</td></tr>
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
