# Configurar Supabase + Vercel para captura de leads

## Cómo funciona (sin credenciales en el código)

```
Visitante rellena formulario
        ↓
  fetch('/api/contact')          ← solo esto ve el navegador
        ↓
  Vercel Function (privado)      ← lee las credenciales de env vars
        ↓
  Supabase guarda el lead        ← base de datos segura
```

Las credenciales de Supabase **nunca aparecen en el código fuente** de la web.

---

## Paso 1 — Crear proyecto Supabase

1. Ve a **https://supabase.com** y regístrate (gratis)
2. Crea un nuevo proyecto → nombre "sitalia", región Europa (Frankfurt)

---

## Paso 2 — Crear las tablas

1. En Supabase ve a **SQL Editor → New query**
2. Pega y ejecuta todo el bloque de una vez:

```sql
-- ── Tabla de leads del formulario de contacto ─────────────────────────────
CREATE TABLE leads (
  id           bigserial PRIMARY KEY,
  nombre       text NOT NULL,
  apellido     text,
  telefono     text,
  email        text,
  tipo_negocio text NOT NULL,
  mensaje      text,
  created_at   timestamptz DEFAULT now()
);
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- ── Tabla de reservas (sistema de citas) ──────────────────────────────────
CREATE TABLE reservas (
  id           bigserial PRIMARY KEY,
  negocio      text NOT NULL,
  servicio     text NOT NULL,
  duracion_min integer NOT NULL,
  precio       numeric(8,2),
  fecha        date NOT NULL,
  hora_inicio  integer NOT NULL,   -- minutos desde medianoche (ej: 540 = 9:00)
  hora_fin     integer NOT NULL,
  nombre       text NOT NULL,
  telefono     text,
  email        text NOT NULL,
  estado       text DEFAULT 'confirmada',  -- confirmada | cancelada
  created_at   timestamptz DEFAULT now()
);
ALTER TABLE reservas ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_reservas_negocio_fecha ON reservas(negocio, fecha, estado);

-- ── Tabla de trabajadores (equipo y horarios) ─────────────────────────────
-- horario: array JSONB con { dow: 0-6, inicio: mins|null, fin: mins|null }
-- dow: 0=Lunes, 1=Martes, ..., 6=Domingo
-- ejemplo: [{"dow":0,"inicio":540,"fin":1200}, {"dow":6,"inicio":null,"fin":null}]
CREATE TABLE trabajadores (
  id         bigserial PRIMARY KEY,
  negocio    text NOT NULL,
  nombre     text NOT NULL,
  horario    jsonb NOT NULL DEFAULT '[]',
  activo     boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE trabajadores ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_trabajadores_negocio ON trabajadores(negocio, activo);

-- Política de acceso: solo la clave service_role (usada en las funciones serverless)
-- puede leer y escribir — ninguna clave anon del cliente tiene acceso
```

---

## Paso 3 — Obtener las credenciales

En Supabase ve a **Settings → API** y copia:

- **Project URL** → `https://xxxxxxxx.supabase.co`
- **service_role (secret)** → la clave que pone "secret" debajo (⚠️ nunca en el cliente)

---

## Paso 4 — Añadir variables de entorno en Vercel

1. Ve a tu proyecto en **vercel.com → Settings → Environment Variables**
2. Añade estas dos variables (para Production, Preview y Development):

| Name                    | Value                                     |
|-------------------------|-------------------------------------------|
| `SUPABASE_URL`          | `https://xxxxxxxx.supabase.co`            |
| `SUPABASE_SERVICE_KEY`  | `eyJhbGci...` (la service_role key)       |
| `RESEND_API_KEY`        | `re_xxxx...` (tu API key de Resend)       |
| `ADMIN_TOKEN`           | Una contraseña segura que tú eliges — es la que usas para entrar al panel `/demo-peluqueria-admin.html` |

3. Haz **Redeploy** para que cojan efecto

---

## Paso 5 — Subir los archivos nuevos a GitHub

Sube estos archivos (además de `index.html` actualizado):

- `api/contact.js` — la función serverless
- `package.json` — dependencia de supabase-js
- `vercel.json` — ya actualizado con la ruta de la función

Vercel detectará el `package.json` automáticamente e instalará las dependencias.

---

## Ver los leads recibidos

En Supabase: **Table Editor → leads** — verás todos los contactos con fecha y hora.

---

## Archivos a subir a GitHub

Cada vez que hagas cambios, sube estos archivos:

```
api/
  contact.js          ← formulario de contacto Sitalia
  booking.js          ← reservas (soporta multi-trabajador)
  admin-reservas.js   ← panel admin: ver/cancelar citas
  trabajadores.js     ← gestión del equipo y horarios
  servicios.js        ← (NUEVO) catálogo de servicios
  ausencias.js        ← (NUEVO) ausencias por trabajador

shared.js             ← lógica común del widget de reservas
shared.css            ← estilos comunes
index.html            ← web de Sitalia
demo-peluqueria.html  ← demo barbería (cliente)
demo-peluqueria-admin.html  ← panel admin barbería
peluqueria-config.js  ← config del widget público (ahora lee de Supabase)
admin.js              ← panel admin (ahora lee de Supabase)
package.json
vercel.json
```

---

## MIGRACIÓN 001 — Servicios y Ausencias en Supabase (mayo 2026)

### Por qué

Antes el panel admin guardaba servicios y ausencias en `localStorage` del navegador. Eso significaba que **los visitantes de la web pública NO veían los servicios reales del negocio** — solo el catálogo por defecto hardcodeado. Lo mismo con las ausencias: los días marcados como "vacaciones" en el admin no bloqueaban el calendario público.

Ahora ambos viven en Supabase y se comparten entre el panel admin y la web pública.

### Cómo aplicar la migración

1. **Ejecutar el SQL** — abre Supabase → SQL Editor → New query → pega el contenido de `SUPABASE-MIGRATION-001-servicios-ausencias.sql` y pulsa Run.

   El script crea dos tablas (`servicios`, `ausencias`), sus índices, un trigger para `updated_at`, y siembra el catálogo inicial de Barberia El Rincón.

2. **Verificar** que aparecen las tablas en Table Editor:
   - `servicios` con 6 filas (Corte de pelo, Arreglo de barba, etc.)
   - `ausencias` vacía

3. **Subir a GitHub** los archivos nuevos / modificados:
   - `api/servicios.js` (NUEVO)
   - `api/ausencias.js` (NUEVO)
   - `admin.js` (modificado: ya no usa localStorage para servicios ni ausencias)
   - `peluqueria-config.js` (modificado: lee de la API)

4. **Vercel redeploy** automático al hacer push.

5. **Probar end-to-end**:
   - Abre el panel admin → Servicios → edita o añade uno → guardar.
   - Abre `demo-peluqueria.html` en otro navegador / incógnito.
   - El widget de reservas debe mostrar el servicio que acabas de editar.
   - Lo mismo con Ausencias: marca un día → ese día debe aparecer bloqueado en el calendario público.

### Compatibilidad con datos antiguos en localStorage

Los datos viejos en localStorage NO se migran automáticamente. Como el catálogo inicial se siembra desde el SQL y las ausencias eran solo de prueba, lo más limpio es:

1. Mirar en el navegador (DevTools → Application → Local Storage) qué tienes guardado.
2. Si quieres conservar algo, copiarlo manualmente al admin tras la migración.
3. Borrar las claves `peluqueria_services` y `peluqueria_ausencias` del localStorage.

### Endpoints expuestos

| Método | URL | Auth | Para qué |
|--------|-----|------|----------|
| GET    | `/api/servicios?negocio=peluqueria`              | público  | widget de reservas + admin |
| POST   | `/api/servicios` (body con `token`)              | admin    | crear/actualizar servicio  |
| DELETE | `/api/servicios?id=X&token=XXX`                  | admin    | soft delete                |
| GET    | `/api/ausencias?negocio=peluqueria`              | público  | bloquear días en el widget |
| POST   | `/api/ausencias` (body con `token` y `accion`)   | admin    | toggle / add / remove      |


---

## Cómo funciona el sistema de capacidad (multi-trabajador)

Si tienes 2 trabajadores trabajando a la vez, el sistema permite 2 reservas simultáneas para el mismo horario. La lógica es:

1. **Admin crea trabajadores** en la pestaña "Equipo" del panel admin
2. **Cada trabajador tiene su horario** (qué días y horas trabaja)
3. **La API calcula** cuántos trabajadores están disponibles en cada franja horaria
4. **Un slot se bloquea** cuando el número de reservas ≥ número de trabajadores disponibles en ese momento

Si no hay trabajadores configurados, el sistema usa capacidad 1 (comportamiento clásico).
