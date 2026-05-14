-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRACIÓN 003 — Imagen URL y categoría en servicios
--
-- Añadimos 2 campos opcionales a la tabla `servicios`:
--   - imagen_url: enlace a una imagen del producto (URL externa o Storage)
--   - categoria : agrupación (p.ej. "Pollos", "Guarniciones", "Bebidas")
--
-- Ambos son opcionales (NULL permitido). Los nichos que no los necesiten
-- (peluquería, fisio, etc.) los pueden ignorar sin problema.
--
-- Cómo ejecutar:
--   Supabase → SQL Editor → New query → pega TODO → Run.
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE servicios ADD COLUMN IF NOT EXISTS imagen_url text;
ALTER TABLE servicios ADD COLUMN IF NOT EXISTS categoria  text;

-- Índice para filtrar productos por categoría dentro de un negocio
CREATE INDEX IF NOT EXISTS idx_servicios_negocio_categoria
  ON servicios(negocio, categoria) WHERE activo = true;

-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICACIÓN
-- ═══════════════════════════════════════════════════════════════════════════
-- \d servicios
--   Deberías ver las columnas imagen_url y categoria al final.
