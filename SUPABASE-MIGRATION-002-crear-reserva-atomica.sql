-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRACIÓN 002 — Reserva atómica anti race-condition
--
-- Problema:
--   El flujo actual en api/booking.js es:
--     1. SELECT reservas del día
--     2. Calcular solapamiento contra capacidad de trabajadores
--     3. INSERT si hay hueco
--
--   Entre el paso 1 y el 3 pueden colarse dos clientes simultáneos: ambos ven
--   un slot libre, ambos insertan, y nos quedamos con doble reserva.
--
-- Solución:
--   Una función PL/pgSQL que hace todo en una sola transacción, bloqueando
--   las reservas del día con `FOR UPDATE`. La segunda reserva concurrente
--   espera a que termine la primera, recalcula, y si ya no hay hueco lanza
--   excepción SLOT_TAKEN. api/booking.js mapea esa excepción a HTTP 409.
--
-- Cómo aplicarla:
--   1. Abre Supabase → SQL Editor → New query
--   2. Pega TODO este bloque y pulsa Run
--   3. Comprueba con: SELECT proname FROM pg_proc WHERE proname = 'crear_reserva';
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION crear_reserva(
  p_negocio       text,
  p_servicio      text,
  p_duracion_min  integer,
  p_precio        numeric,
  p_fecha         date,
  p_hora_inicio   integer,
  p_hora_fin      integer,
  p_nombre        text,
  p_telefono      text,
  p_email         text
) RETURNS bigint AS $$
DECLARE
  v_overlapping integer;
  v_capacity    integer;
  v_dow         integer;
  v_id          bigint;
BEGIN
  -- ── Validaciones básicas ───────────────────────────────────────────────
  IF p_negocio IS NULL OR p_servicio IS NULL OR p_nombre IS NULL OR p_email IS NULL THEN
    RAISE EXCEPTION 'MISSING_FIELDS' USING ERRCODE = 'P0002';
  END IF;
  IF p_duracion_min IS NULL OR p_duracion_min <= 0 THEN
    RAISE EXCEPTION 'INVALID_DURATION' USING ERRCODE = 'P0002';
  END IF;
  IF p_hora_inicio IS NULL OR p_hora_fin IS NULL OR p_hora_fin <= p_hora_inicio THEN
    RAISE EXCEPTION 'INVALID_TIME_RANGE' USING ERRCODE = 'P0002';
  END IF;

  -- ── Lock optimista: bloqueamos las filas de reservas del día ──────────
  -- Cualquier transacción concurrente que intente leer/escribir reservas
  -- de este negocio+fecha esperará a que terminemos. El lock se libera al
  -- COMMIT (al final de la función) o ROLLBACK.
  PERFORM 1
    FROM reservas
   WHERE negocio = p_negocio
     AND fecha   = p_fecha
     AND estado  = 'confirmada'
     FOR UPDATE;

  -- ── Contar solapamiento real: cuántas reservas [a, b) chocan con [ini, fin)
  --    Dos intervalos solapan si uno empieza antes de que el otro termine.
  SELECT COUNT(*) INTO v_overlapping
    FROM reservas r
   WHERE r.negocio = p_negocio
     AND r.fecha   = p_fecha
     AND r.estado  = 'confirmada'
     AND r.hora_inicio                     <  p_hora_fin
     AND r.hora_inicio + r.duracion_min    >  p_hora_inicio;

  -- ── Capacidad: cuántos trabajadores activos están disponibles en p_hora_inicio
  --    EXTRACT(ISODOW) devuelve 1=Lun … 7=Dom; restamos 1 → 0=Lun … 6=Dom.
  v_dow := EXTRACT(ISODOW FROM p_fecha) - 1;

  SELECT COUNT(*) INTO v_capacity
    FROM trabajadores t
   WHERE t.negocio = p_negocio
     AND t.activo  = true
     AND EXISTS (
       SELECT 1 FROM jsonb_array_elements(t.horario) h
        WHERE (h->>'dow')::int    = v_dow
          AND (h->>'inicio') IS NOT NULL
          AND (h->>'inicio')::int <= p_hora_inicio
          AND (h->>'fin')::int    >  p_hora_inicio
     );

  -- Si no hay trabajadores configurados, asumimos capacidad 1 (modo clásico).
  IF v_capacity IS NULL OR v_capacity = 0 THEN
    v_capacity := 1;
  END IF;

  -- ── ¿Hay hueco? Si no, lanzamos excepción específica que api/booking
  --    mapeará a HTTP 409 Conflict.
  IF v_overlapping >= v_capacity THEN
    RAISE EXCEPTION 'SLOT_TAKEN' USING ERRCODE = 'P0001';
  END IF;

  -- ── Insertar reserva ──────────────────────────────────────────────────
  INSERT INTO reservas (
    negocio, servicio, duracion_min, precio,
    fecha, hora_inicio, hora_fin,
    nombre, telefono, email, estado
  ) VALUES (
    p_negocio, p_servicio, p_duracion_min, p_precio,
    p_fecha, p_hora_inicio, p_hora_fin,
    p_nombre, p_telefono, p_email, 'confirmada'
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICACIÓN — ejecuta esto para comprobar que la función existe:
--   SELECT proname, pronargs FROM pg_proc WHERE proname = 'crear_reserva';
-- Debería devolver una fila con pronargs = 10.
-- ═══════════════════════════════════════════════════════════════════════════
