-- ===========================================================================
-- MIGRACION 005 - Bucket de Supabase Storage para imagenes de productos
--
-- Por que:
--   El panel admin pasa de aceptar solo URLs externas a permitir subir JPG/PNG
--   directamente. Necesitamos un bucket publico de lectura donde subir las
--   fotos de los productos/servicios.
--
-- Como aplicar:
--   Supabase -> SQL Editor -> New query -> pegar TODO -> Run.
--   (Alternativa manual: Storage -> Create bucket -> name "productos",
--    publico, sin RLS de lectura.)
--
-- Despues de aplicar, el endpoint /api/upload-imagen ya puede subir.
-- ===========================================================================

-- 1. Crear el bucket si no existe. "public = true" hace que las URLs publicas
--    devueltas por getPublicUrl() funcionen sin firmar (lectura abierta).
INSERT INTO storage.buckets (id, name, public)
VALUES ('productos', 'productos', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- 2. Politicas de Storage: permitir lectura publica.
--    La escritura va siempre a traves de la API serverless con el
--    SUPABASE_SERVICE_KEY, que bypassa RLS. Aqui solo abrimos la lectura.

-- Limpiar politicas previas con el mismo nombre (si existian).
DROP POLICY IF EXISTS "Productos imagenes lectura publica" ON storage.objects;

CREATE POLICY "Productos imagenes lectura publica"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'productos');

-- 3. (Opcional) Sentencia de verificacion. Descomentar para revisar:
-- SELECT id, name, public FROM storage.buckets WHERE id = 'productos';
-- SELECT policyname FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
