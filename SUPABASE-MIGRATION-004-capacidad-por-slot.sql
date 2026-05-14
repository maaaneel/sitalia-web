-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRACIÓN 004 — Capacidad por slot (modelo rostisseria, take-away, etc.)
--
-- Por qué:
--   El modelo de peluquería (1 trabajador atiende a 1 cliente, los servicios
--   tienen duración que bloquea el calendario) no encaja con rostisserias o
--   negocios de comida para llevar. Allí lo que importa es:
--     - Cuántos pedidos puedo asumir EN PARALELO en un slot horario
--     - Da igual cuánto tarde cada producto, se preparan a la vez
--
-- Cómo funciona el nuevo modelo:
--   1. Cada negocio puede tener una entrada en `negocio_capacidad`:
--        - capacidad_por_slot : cuántas reservas caben en cada franja
--        - duracion_slot_min  : duración de la franja en minutos (ej: 30)
--   2. Si un negocio tiene esta config, se usa la función
--      crear_reserva_capacidad() en lugar de la función original.
--   3. Los negocios SIN entrada en esta tabla siguen usando el modelo de
--      trabajadores como hasta ahora (peluquería, fisio, etc.)
--
-- Cómo aplicar:
--   Supabase → SQL Editor → New query → pegar TODO → Run.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS negocio_capacidad (
  negocio             text PRIMARY KEY,
  capacidad_por_slot  integer NOT NULL DEFAULT 1 CHECK (capacidad_por_slot >= 1),
  duracion_slot_min   integer NOT NULL DEFAULT 30 CHECK (duracion_slot_min > 0),
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);
ALTER TABLE negocio_capacidad ENABLE ROW LEVEL SECURITY;

-- Trigger updated_at
DROP TRIGGER IF EXISTS trg_capacidad_updated_at ON negocio_capacidad;
CREATE TRIGGER trg_capacidad_updated_at
BEFORE UPDATE ON negocio_capacidad
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ═══════════════════════════════════════════════════════════════════════════
-- Función crear_reserva_capacidad
-- Para negocios con capacidad fija por slot.
-- Lanza SLOT_TAKEN (P0001) si el slot está lleno.
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION crear_reserva_capacidad(
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
  v_ocupadas integer;
  v_capacidad integer;
  v_id bigint;
BEGIN
  -- Validaciones básicas
  IF p_negocio IS NULL OR p_servicio IS NULL OR p_nombre IS NULL OR p_email IS NULL THEN
    RAISE EXCEPTION 'MISSING_FIELDS' USING ERRCODE = 'P0002';
  END IF;
  IF p_hora_inicio IS NULL OR p_hora_fin IS NULL OR p_hora_fin <= p_hora_inicio THEN
    RAISE EXCEPTION 'INVALID_TIME_RANGE' USING ERRCODE = 'P0002';
  END IF;

  -- Capacidad del negocio
  SELECT capacidad_por_slot INTO v_capacidad
    FROM negocio_capacidad WHERE negocio = p_negocio;

  IF v_capacidad IS NULL THEN
    -- Sin config → no debería estar usando esta función. Fallback prudente: 1.
    v_capacidad := 1;
  END IF;

  -- Lock para el slot. No basta con FOR UPDATE en la tabla: si el slot está
  -- vacío, no hay filas que bloquear. Usamos un advisory lock por transacción
  -- basado en un hash de (negocio, fecha, hora_inicio). Eso garantiza que dos
  -- clientes que intenten reservar el MISMO slot a la vez se serialicen.
  PERFORM pg_advisory_xact_lock(
    hashtextextended(p_negocio || '|' || p_fecha::text || '|' || p_hora_inicio::text, 0)
  );

  -- Contar cuántas reservas ya hay en ESTE MISMO slot exacto
  SELECT COUNT(*) INTO v_ocupadas
    FROM reservas
   WHERE negocio = p_negocio
     AND fecha   = p_fecha
     AND hora_inicio = p_hora_inicio
     AND estado  = 'confirmada';

  IF v_ocupadas >= v_capacidad THEN
    RAISE EXCEPTION 'SLOT_TAKEN' USING ERRCODE = 'P0001';
  END IF;

  -- Insertar reserva
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
-- SEMILLA — Cal Pere con capacidad 10 pedidos / slot de 30 min
-- ═══════════════════════════════════════════════════════════════════════════
INSERT INTO negocio_capacidad (negocio, capacidad_por_slot, duracion_slot_min)
VALUES ('rostisseria', 10, 30)
ON CONFLICT (negocio) DO UPDATE
  SET capacidad_por_slot = EXCLUDED.capacidad_por_slot,
      duracion_slot_min  = EXCLUDED.duracion_slot_min;

-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICACIÓN
--   SELECT * FROM negocio_capacidad;          -- 1 fila: rostisseria 10/30
--   SELECT proname FROM pg_proc WHERE proname = 'crear_reserva_capacidad';
-- ═══════════════════════════════════════════════════════════════════════════
