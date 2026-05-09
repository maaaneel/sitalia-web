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

## Paso 2 — Crear la tabla `leads`

1. En Supabase ve a **SQL Editor → New query**
2. Pega y ejecuta:

```sql
CREATE TABLE leads (
  id           bigserial PRIMARY KEY,
  nombre       text NOT NULL,
  telefono     text NOT NULL,
  tipo_negocio text NOT NULL,
  mensaje      text,
  created_at   timestamptz DEFAULT now()
);

-- RLS activado (la función serverless usa service_role, que lo bypasea)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
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

| Name                    | Value                          |
|-------------------------|--------------------------------|
| `SUPABASE_URL`          | `https://xxxxxxxx.supabase.co` |
| `SUPABASE_SERVICE_KEY`  | `eyJhbGci...` (la service_role key) |

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

Para recibir notificaciones por email de cada nuevo lead:
- Supabase → **Database → Webhooks** → crear webhook a un servicio como Make.com o directamente a tu email.

---

## Comportamiento

- El visitante rellena el formulario y hace clic en **Enviar por WhatsApp**
- El lead se guarda silenciosamente en Supabase
- Se abre WhatsApp con el mensaje prellenado
- Si Supabase no está configurado, el formulario sigue funcionando con WhatsApp — no se rompe nada
