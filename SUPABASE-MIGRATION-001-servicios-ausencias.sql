-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRACIÓN 001 — Servicios y Ausencias persistidos en Supabase
--
-- Antes de esta migración, el panel admin guardaba servicios y ausencias en
-- localStorage del navegador. Eso significaba que:
--   1. Los visitantes de la web pública NUNCA veían los servicios reales
--      del negocio (solo el catálogo por defecto hardcoded).
--   2. Si el dueño cambiaba de navegador o limpiaba caché, perdía todo.
--
-- Esta migración crea las tablas necesarias para que el panel admin y la
-- web pública compartan los mismos datos a través de Supabase.
--
-- Cómo ejecutar:
--   1. Abre Supabase → SQL Editor → New query
--   2. Pega TODO este bloque y pulsa "Run"
--   3. Verifica en Table Editor que aparecen las tablas `servicios` y `ausencias`
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Tabla de servicios del catálogo del negocio ─────────────────────────────
-- Cada servicio tiene:
--   - duracion_min     : minutos REALES que bloquea la agenda (p.ej. 30)
--   - duracion_display : texto VISIBLE al cliente ("3 horas", "45 min"…)
--     (esto permite que un tinte aparezca como "3 horas" pero solo bloquee
--      30 min del trabajador, porque el resto el cliente espera con el tinte)
CREATE TABLE servicios (
  id               bigserial PRIMARY KEY,
  negocio          text NOT NULL,
  nombre           text NOT NULL,
  duracion_min     integer NOT NULL CHECK (duracion_min > 0),
  duracion_display text,
  precio           numeric(8,2),
  pop              boolean DEFAULT false,           -- marca "POPULAR"
  orden            integer DEFAULT 0,               -- orden manual en el listado
  activo           boolean DEFAULT true,            -- soft delete
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);
ALTER TABLE servicios ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_servicios_negocio ON servicios(negocio, activo, orden);

-- ── Tabla de ausencias por trabajador ───────────────────────────────────────
-- Cada fila = un día concreto en el que un trabajador NO trabaja.
-- (vacaciones, baja, día libre puntual, etc.)
-- Si CUALQUIER trabajador activo está ausente ese día, el día se considera
-- "con menor capacidad" — la API de booking calcula la disponibilidad real.
-- Para negocios de un solo trabajador, ese día queda bloqueado por completo.
CREATE TABLE ausencias (
  id            bigserial PRIMARY KEY,
  negocio       text NOT NULL,
  trabajador_id bigint NOT NULL REFERENCES trabajadores(id) ON DELETE CASCADE,
  fecha         date NOT NULL,
  motivo        text,                               -- opcional, p.ej. "vacaciones"
  created_at    timestamptz DEFAULT now(),
  UNIQUE (trabajador_id, fecha)
);
ALTER TABLE ausencias ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_ausencias_negocio_fecha ON ausencias(negocio, fecha);
CREATE INDEX idx_ausencias_trabajador    ON ausencias(trabajador_id);

-- ── Trigger para actualizar updated_at en servicios ─────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_servicios_updated_at
BEFORE UPDATE ON servicios
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ═══════════════════════════════════════════════════════════════════════════
-- (Opcional pero recomendado) Sembrar el catálogo de Barberia El Rincón
-- para que el primer cliente arranque ya con datos. Si prefieres empezar
-- de cero, comenta el INSERT.
-- ═══════════════════════════════════════════════════════════════════════════
INSERT INTO servicios (negocio, nombre, duracion_min, duracion_display, precio, pop, orden) VALUES
  ('peluqueria', 'Corte de pelo',       30, '30 min',  18, false, 1),
  ('peluqueria', 'Arreglo de barba',    20, '20 min',  12, false, 2),
  ('peluqueria', 'Corte + Barba',       45, '45 min',  25, true,  3),
  ('peluqueria', 'Afeitado con navaja', 40, '40 min',  20, false, 4),
  ('peluqueria', 'Corte niño',          25, '25 min',  12, false, 5),
  ('peluqueria', 'Tratamiento capilar', 20, '20 min',  15, false, 6);

-- ═══════════════════════════════════════════════════════════════════════════
-- COMPROBACIÓN — ejecuta esto para verificar que todo fue bien:
--   SELECT COUNT(*) FROM servicios;        -- debería devolver 6
--   SELECT COUNT(*) FROM ausencias;        -- debería devolver 0
--   \d servicios                            -- estructura de la tabla
-- ═══════════════════════════════════════════════════════════════════════════
