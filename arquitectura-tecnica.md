# Arquitectura Técnica — Micro-Agencia de Webs para Negocios Locales

> Documento de referencia para el diseño del sistema. Versión 1.0 — Mayo 2026.

---

## 1. Decisión principal: Next.js vs WordPress

### Veredicto: **Next.js**

Esta es la decisión más importante y conviene justificarla bien.

**Por qué NO WordPress (para este modelo de negocio):**
- Cada instalación es una instancia separada con su propia base de datos, plugins y actualizaciones → mantenimiento multiplicado por cada cliente
- Velocidad mediocre por defecto (necesita caché, CDN y plugins para competir)
- Seguridad frágil: WP es el CMS más atacado del mundo
- Difícil de reutilizar código entre proyectos de forma eficiente
- El "sistema de plantillas" en WP significa duplicar repos o usar multisite (complejo y frágil)
- Coste real de hosting gestionado (WP Engine, Kinsta) es alto: 30–60€/mes por cliente

**Por qué SÍ Next.js:**
- Reutilización real de componentes: el 80% del código es literalmente el mismo archivo
- Velocidad excelente de serie: SSG/ISR + Vercel CDN
- SEO de primera clase con App Router y metadata API
- Un único repositorio (monorepo) para todos los clientes
- Despliegue en Vercel: gratuito o muy barato por proyecto
- Control total sobre el diseño sin luchar contra themes
- Integración limpia con cualquier CMS headless o API

**El argumento del cliente ("¿puedo editarlo yo?"):** se resuelve con Sanity CMS, no con WordPress.

---

## 2. Stack Tecnológico

| Capa | Tecnología | Justificación |
|------|-----------|---------------|
| Framework | **Next.js 14+ (App Router)** | SSG/ISR, SEO, performance, ecosystem |
| Estilos | **Tailwind CSS** | Velocidad de desarrollo, consistencia, purgeable |
| Componentes UI | **shadcn/ui** | Componentes copiables, sin dependencia de librería |
| CMS | **Sanity** | Un studio para todos los clientes, schemas por nicho |
| Base de datos | **Supabase** | Postgres gestionado, auth, realtime, gratuito hasta escala |
| Reservas | **Cal.com (self-hosted) o Supabase custom** | Según complejidad del nicho |
| Email transaccional | **Resend** | API simple, 3.000 emails/mes gratis |
| Formularios | **React Hook Form + Zod** | Validación, sin dependencias pesadas |
| Animaciones | **Framer Motion** | Micro-interacciones profesionales |
| Analytics | **Umami (self-hosted) o Plausible** | RGPD compliant, sin cookies |
| Imágenes | **Cloudinary o Sanity Assets** | Optimización automática |
| Mapas | **Google Maps Embed API** | Gratuito hasta volumen alto |
| WhatsApp | **wa.me links** | Sin coste, inmediato |
| Monorepo | **Turborepo** | Build cache, gestión de paquetes compartidos |
| Despliegue | **Vercel** | CI/CD automático, previews, CDN global |
| DNS/Dominios | **Cloudflare** | Gratuito, rápido, protección DDoS |

---

## 3. Arquitectura del Monorepo (Turborepo)

```
agencia-web/
├── apps/
│   ├── template-base/          ← Plantilla genérica (nunca se despliega sola)
│   ├── template-peluqueria/    ← Plantilla nicho peluquerías
│   ├── template-restaurante/   ← Plantilla nicho restaurantes
│   ├── template-fisioterapia/  ← Plantilla nicho fisioterapia
│   ├── [cliente-pepe-barberia]/← Cliente real (fork de template-peluqueria)
│   └── [cliente-la-trattoria]/ ← Cliente real (fork de template-restaurante)
│
├── packages/
│   ├── ui/                     ← Componentes compartidos (Button, Card, Hero, etc.)
│   ├── config-tailwind/        ← tailwind.config.js base compartido
│   ├── config-eslint/          ← Reglas ESLint compartidas
│   ├── config-typescript/      ← tsconfig base compartido
│   ├── lib/                    ← Utilidades: formatters, validators, hooks
│   ├── sanity-schemas/         ← Schemas de Sanity reutilizables por nicho
│   └── booking/                ← Lógica de reservas compartida
│
├── turbo.json
├── package.json
└── pnpm-workspace.yaml
```

### Flujo para un nuevo cliente:
1. Copiar `template-[nicho]` → `apps/[nombre-cliente]`
2. Editar `config.ts` del cliente (colores, textos, logo, horarios)
3. Conectar al proyecto Sanity del cliente
4. `vercel --prod` → live en 3 minutos

---

## 4. Sistema de Configuración por Cliente

Cada app de cliente tiene un único archivo de configuración central:

```typescript
// apps/[cliente]/src/config.ts

export const siteConfig = {
  // Identidad
  name: "Barbería El Rincón",
  tagline: "Cortes con estilo desde 1998",
  description: "Barbería en el centro de Barcelona...",
  logo: "/logo.svg",
  favicon: "/favicon.ico",

  // Contacto
  phone: "+34 612 345 678",
  email: "hola@barberiaelrincon.es",
  address: "Calle Mayor 23, Barcelona",
  googleMapsUrl: "https://maps.google.com/?q=...",
  whatsapp: "+34612345678",
  whatsappMessage: "Hola, quiero pedir cita para...",

  // Redes sociales
  social: {
    instagram: "https://instagram.com/...",
    facebook: "",
  },

  // Horarios
  schedule: [
    { day: "Lunes", hours: "Cerrado" },
    { day: "Martes - Viernes", hours: "10:00 - 20:00" },
    { day: "Sábado", hours: "10:00 - 18:00" },
    { day: "Domingo", hours: "Cerrado" },
  ],

  // Branding
  theme: {
    primaryColor: "#1a1a2e",
    accentColor: "#e94560",
    fontHeading: "Playfair Display",
    fontBody: "Inter",
  },

  // Funcionalidades activas
  features: {
    booking: true,
    whatsappFloat: true,
    gallery: true,
    team: true,
    reviews: true,
    newsletter: false,
  },

  // SEO Local
  seo: {
    city: "Barcelona",
    neighborhood: "Eixample",
    region: "Cataluña",
    keywords: ["barbería barcelona", "corte de pelo eixample"],
  },
};
```

Con este archivo se controla casi todo sin tocar componentes.

---

## 5. Sistema de Componentes (packages/ui)

Organizados en capas:

### Atoms (primitivos)
- `Button` — variantes: primary, secondary, ghost, whatsapp
- `Badge` — etiquetas de servicio, precio, disponibilidad
- `Input`, `Textarea`, `Select` — formularios
- `Avatar` — fotos de equipo
- `StarRating` — valoraciones

### Molecules (combinaciones)
- `ServiceCard` — nombre, precio, duración, botón reserva
- `TeamMember` — foto, nombre, especialidad, reserva
- `ReviewCard` — estrella, texto, autor, fecha
- `PricingCard` — plan, precio, features
- `GalleryGrid` — grid de imágenes con lightbox
- `ContactForm` — formulario de contacto genérico
- `BookingWidget` — widget de reservas integrable

### Organisms (secciones completas)
- `HeroSection` — título, subtítulo, CTA, imagen
- `ServicesSection` — grid de servicios
- `TeamSection` — perfiles del equipo
- `ReviewsSection` — carrusel de reseñas
- `GallerySection` — galería de fotos
- `LocationSection` — mapa + horarios + dirección
- `ContactSection` — formulario + info de contacto
- `CTABanner` — llamada a la acción intermedia
- `WhatsAppFloat` — botón flotante de WhatsApp
- `CookieBanner` — aviso legal RGPD

### Layout
- `Header` — navegación responsive con menú móvil
- `Footer` — links, horarios, contacto, RRSS
- `PageWrapper` — estructura base con SEO

---

## 6. Gestión de Contenido con Sanity

### Estrategia: Un workspace de Sanity para la agencia, múltiples proyectos

Sanity permite crear un proyecto por cliente o reutilizar datasets. La opción recomendada para empezar:

**Un proyecto Sanity por cliente** (plan gratuito: hasta 2 usuarios, suficiente para comenzar)

### Schemas compartidos (packages/sanity-schemas)

```
sanity-schemas/
├── shared/
│   ├── siteSettings.ts     ← Nombre, logo, contacto, horarios
│   ├── seoFields.ts        ← Título, descripción, og:image
│   ├── galleryImage.ts     ← Imagen con alt y caption
│   └── socialLinks.ts      ← RRSS
│
├── peluqueria/
│   ├── service.ts          ← Nombre, precio, duración, descripción
│   ├── teamMember.ts       ← Nombre, foto, especialidad, bio
│   └── review.ts           ← Autor, puntuación, texto, fecha
│
├── restaurante/
│   ├── menuItem.ts         ← Nombre, descripción, precio, categoría, foto
│   ├── menuCategory.ts     ← Entrantes, principales, postres...
│   └── dailyMenu.ts        ← Menú del día con fecha
│
└── fisioterapia/
    ├── treatment.ts        ← Nombre, descripción, duración, precio
    ├── therapist.ts        ← Nombre, formación, especialidad
    └── testimonial.ts      ← Paciente, tratamiento, texto
```

El cliente edita su contenido desde `[cliente].sanity.studio` — una URL limpia y propia.

---

## 7. Sistema de Reservas

Tres niveles según el nicho y el presupuesto del cliente:

### Nivel 1 — WhatsApp (mínimo viable, incluido en todos)
```
wa.me/34612345678?text=Hola,%20quiero%20reservar%20una%20cita...
```
Cero coste, cero setup. El 60% de negocios locales lo prefieren de inicio.

### Nivel 2 — Cal.com Embed (recomendado para peluquerías y fisio)
- Open source, self-hosted o cloud
- Embed directo en la web sin salir
- Gestión de disponibilidad, confirmaciones por email
- Coste cloud: 0–12€/mes por negocio
- Setup: 1–2 horas

```tsx
// Ejemplo de embed en página
import { getCalApi } from "@calcom/embed-react";

export function BookingButton() {
  return (
    <button data-cal-link="pepe-barberia/corte-barba">
      Reservar ahora
    </button>
  );
}
```

### Nivel 3 — Sistema custom con Supabase (restaurantes, academias)
Para necesidades específicas: múltiples servicios, bonos, pagos online.
- Tabla `bookings` en Supabase
- API routes en Next.js
- Emails automáticos con Resend
- Panel de administración simple

---

## 8. SEO Local — Estrategia Técnica

Cada web implementa de serie:

### Metadata dinámica
```typescript
// app/layout.tsx
export const metadata: Metadata = {
  title: `${config.name} | ${config.seo.city}`,
  description: config.description,
  openGraph: { ... },
  robots: { index: true, follow: true },
};
```

### Schema.org (datos estructurados)
```json
{
  "@type": "HairSalon",
  "name": "Barbería El Rincón",
  "address": { "@type": "PostalAddress", "addressLocality": "Barcelona" },
  "telephone": "+34612345678",
  "openingHours": ["Tu-Fr 10:00-20:00", "Sa 10:00-18:00"],
  "priceRange": "€€"
}
```

### Sitemap + robots.txt
Generados automáticamente por Next.js App Router.

### Google Business Profile
No es técnico, pero es obligatorio: cada cliente necesita su ficha de Google optimizada. Se incluye como parte del onboarding.

### Core Web Vitals objetivo
- LCP < 2.5s
- CLS < 0.1
- FID < 100ms

Conseguido por defecto con: imágenes optimizadas (`next/image`), fuentes locales (`next/font`), no JS bloqueante, Vercel Edge Network.

---

## 9. Estrategia de Despliegue

```
Dominio cliente (Cloudflare DNS)
        ↓
   Vercel Edge
        ↓
  Next.js App (Vercel)
        ↓
  Sanity CMS (datos)
  Supabase (reservas/forms)
  Resend (emails)
```

### Por cliente:
1. Comprar dominio en Namecheap o transferir el suyo (~10€/año)
2. DNS en Cloudflare (gratuito, protección incluida)
3. Proyecto en Vercel (plan gratuito o Pro: 20€/mes para proyectos ilimitados)
4. Variable de entorno `NEXT_PUBLIC_SITE_ID` → identifica al cliente
5. `git push` → despliegue automático en < 2 minutos

### Costes de infraestructura por cliente (aproximación):
| Concepto | Coste mensual |
|----------|--------------|
| Vercel Pro (repartido entre 10 clientes) | ~2€ |
| Sanity (plan gratuito hasta 3 usuarios) | 0€ |
| Supabase (plan gratuito) | 0€ |
| Cloudflare (gratuito) | 0€ |
| Dominio (amortizado) | ~1€ |
| **Total infraestructura** | **~3€/cliente/mes** |

Con un mantenimiento de 50€/mes, el margen bruto es del 94%.

---

## 10. Flujo de Onboarding de Nuevo Cliente

```
1. CIERRE COMERCIAL
   └── Demo → Propuesta → Contrato → Cobro 50% anticipo

2. BRIEFING (formulario Typeform/Tally — 20 min)
   ├── Logo, colores corporativos
   ├── Fotos del negocio
   ├── Lista de servicios y precios
   ├── Horarios
   ├── Textos o aprobación de textos generados por IA
   └── Acceso a Google Business Profile

3. SETUP TÉCNICO (1-2 horas)
   ├── Clonar template del nicho
   ├── Editar config.ts con datos del cliente
   ├── Crear proyecto Sanity + migrar contenido
   ├── Configurar Cal.com si aplica
   └── Desplegar en Vercel con dominio provisional

4. REVISIÓN DEL CLIENTE (48h)
   └── URL de preview → Feedback → Ajustes finales

5. GO LIVE
   ├── Configurar dominio real
   ├── Activar Google Search Console
   ├── Configurar Analytics
   ├── Optimizar ficha Google Business
   └── Cobro 50% restante

6. MANTENIMIENTO MENSUAL
   ├── Factura recurrente
   ├── Actualizaciones de contenido vía Sanity
   ├── Revisión mensual de métricas
   └── Propuestas de mejora (upsell)
```

---

## 11. Escalabilidad: Camino hacia Multi-Tenant

Cuando tengas 20+ clientes, puede tener sentido migrar a una arquitectura multi-tenant real:

```
agencia.com/[slug-cliente]  ← Subpath routing
[cliente].agencia.com       ← Subdomain routing (Vercel wildcard)
cliente.com                 ← Custom domain (Vercel domain aliasing)
```

Next.js + Vercel soportan los tres patrones de serie. La migración es incremental y no requiere reescribir componentes.

---

## 12. Resumen de Decisiones Clave

| Decisión | Elección | Alternativa descartada | Razón |
|---------|---------|----------------------|-------|
| Framework | Next.js | WordPress | Control, velocidad, reutilización |
| Monorepo | Turborepo | Repos separados | Compartir código real |
| CMS | Sanity | Contentful, Strapi | UX superior, schemas flexibles |
| DB/Backend | Supabase | PlanetScale, Firebase | Postgres + Auth + Storage en uno |
| Reservas | Cal.com | Calendly, custom | Open source, embeddable, precio |
| Deploy | Vercel | Netlify, Coolify | Zero-config con Next.js |
| DNS | Cloudflare | Route53, Namecheap DNS | Gratuito, rápido, seguro |
| Estilos | Tailwind | CSS Modules, Styled Components | Velocidad, consistencia |
| Email | Resend | SendGrid, Mailgun | DX superior, precio |

---

---

## 13. Estado de Plantillas (Demos HTML)

> Las demos son ficheros HTML standalone (sin dependencias) que se abren con doble clic. Ideales para presentaciones a clientes y validación rápida. La versión Next.js se construye sobre la misma lógica una vez validada la demo.

| Nicho | Demo HTML | Next.js | Notas |
|-------|-----------|---------|-------|
| Peluquerías / Barberías | ✅ `demo-peluqueria.html` | ✅ `template-peluqueria/` | Reservas por servicio+fecha+hora, WhatsApp |
| Restaurantes / Bares | ✅ `demo-restaurante.html` | 🔲 pendiente | Carta digital por pestañas, menú del día, reservas por fecha+hora+personas |
| Clínicas de Fisioterapia | ✅ `demo-fisioterapia.html` | 🔲 pendiente | Tratamientos, bonos de sesiones, equipo, reserva tratamiento+fecha+hora |
| Psicólogos | ✅ `demo-psicologo.html` | 🔲 pendiente | Especialidades, proceso terapéutico, FAQ acordeón, formulario privado discreto |
| Bufetes de Abogados | ✅ `demo-abogados.html` | 🔲 pendiente | Navy+gold, 6 áreas legales, stats autoridad, equipo letrados, proceso 4 pasos, lead form |
| Academias / Extraescolares | ✅ `demo-academia.html` | 🔲 pendiente | Actividades por pestañas, tabla horarios, inscripción con semana de prueba |
| Clubs Deportivos / Pádel | ✅ `demo-padel.html` | 🔲 pendiente | Widget pistas en vivo, cuotas socio, reserva pista+hora, clases y torneos |

### Convenciones de las demos

- **Estética base:** fondo `#faf8f5` (cream), texto `#1c1c1c`, acento variable por nicho
  - Peluquería: oro `#c9a84c`
  - Restaurante: burdeos `#8b2635`
  - Fisio / Salud: verde pizarra (próximo)
- **Reservas:** siempre vía WhatsApp (sin backend en demo), reemplazable por Supabase en producción
- **Sin dependencias:** vanilla HTML + CSS + JS, abrir con doble clic en cualquier navegador
- **Configuración rápida:** buscar y reemplazar datos de contacto, colores CSS vars, textos clave
