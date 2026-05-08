# SITALIA — Guía de Negocio y Estrategia
*Documento de referencia interno — actualizado Mayo 2025*

---

## 1. QUÉ ES SITALIA

Sitalia es una micro-agencia especializada en presencia digital para pequeños negocios locales. No somos una agencia de diseño web tradicional. Somos el "informático de confianza" de bares, peluquerías, clínicas y academias que no tienen tiempo ni ganas de gestionar su presencia digital.

**El cliente tipo:** Negocio local de 1 a 10 empleados, dueño de entre 35 y 65 años, que sabe que necesita una web pero no sabe por dónde empezar y no quiere complicarse.

**Lo que vendemos de verdad:** Tranquilidad. Que alguien se encarga de todo.

---

## 2. MODELO DE NEGOCIO

### Estructura de precios

| Concepto | Precio | Cuándo se cobra |
|---|---|---|
| Puesta en marcha | desde 199€ | Al firmar |
| Plan mensual básico | 39€/mes | Mensual, sin permanencia |
| Plan mensual estándar | 59€/mes | Con más funcionalidades |
| Plan mensual premium | 79€/mes | Reservas, CMS, automatizaciones |

### Por qué este pricing funciona

- 199€ de entrada elimina la fricción de venta. No es una inversión, es un gasto menor.
- 39€/mes es menos de lo que un negocio gasta en café a la semana.
- Sin permanencia = sin miedo a comprometerse. La mayoría renueva porque funciona.
- El dinero real está en el recurrente. 50 clientes × 39€ = 1.950€/mes pasivos.

### Costes de infraestructura

| Herramienta | Coste/mes | Cubre |
|---|---|---|
| Vercel Pro | 20€ | Hosting ilimitado de webs |
| Supabase Pro | 25€ | Base de datos todos los clientes |
| Make.com | 9€ | Automatizaciones |
| Claude API | ~5€ | IA para automatizar contenido |
| **Total** | **~59€/mes** | Para todos los clientes |

Con 10 clientes los costes ya están cubiertos. Todo lo demás es margen.

---

## 3. NICHOS PRIORITARIOS

Tenemos plantilla lista para estos 7 sectores:

| Nicho | Demo | Funcionalidad clave |
|---|---|---|
| Peluquerías / Barberías | demo-peluqueria.html | Reservas online |
| Restaurantes / Bares | demo-restaurante.html | Carta digital + reservas de mesa |
| Fisioterapia | demo-fisioterapia.html | Reservas por tratamiento |
| Psicólogos | demo-psicologo.html | Solicitud de cita discreta |
| Abogados | demo-abogados.html | Captación de leads |
| Academias / Extraescolares | demo-academia.html | Inscripciones online |
| Clubs de pádel | demo-padel.html | Reserva de pistas |

**Nicho más fácil de vender:** Peluquerías y restaurantes. Necesidad obvia, resultado visible, dueño acostumbrado a pagar servicios recurrentes (TPV, alarma, gestoría).

---

## 4. ZONA DE ACTUACIÓN

**Arranque:** Baix Llobregat (Barcelona)
- ~800.000 habitantes en municipios medianos
- Alta densidad de pequeños negocios locales
- Competencia digital baja comparado con Barcelona ciudad
- Municipios clave: L'Hospitalet, Cornellà, Sant Boi, El Prat, Gavà, Castelldefels, Viladecans, Esplugues

**Estrategia geográfica:**
1. Empezar por el municipio propio (conoces las calles y los negocios)
2. Dominar ese municipio antes de expandir
3. El boca a boca dentro de un municipio es muy potente
4. Expandir al siguiente municipio cuando tengas 10+ clientes activos

---

## 5. PROCESO DE VENTA

### Cómo encontrar clientes

1. Abrir Google Maps
2. Buscar "peluquería", "restaurante", "fisioterapia" en el municipio
3. Filtrar los que:
   - No tienen web (aparece sin enlace en Google Maps)
   - Tienen web del 2015 o anterior
   - Web no funciona en móvil
   - Sin sistema de reservas
4. Apuntar nombre, teléfono y dirección

### El pitch de 2 minutos

**En persona (más efectivo):**
> "Hola, soy de Sitalia, hacemos webs para negocios como el tuyo aquí en [municipio]. 
> Te enseño en 2 minutos cómo quedaría la tuya — sin compromiso."
> [Sacas el móvil, abres la demo de su sector]
> "Esto sería tu web. La tenemos lista en 7 días, por 199€ y luego 39€ al mes. 
> Yo me encargo de todo, tú no tienes que hacer nada."

**Por teléfono:**
> "Buenos días, llamo de Sitalia. Hemos visto que [su negocio] no tiene web o 
> tiene una web antigua. Le podríamos preparar una demo gratuita de cómo 
> quedaría en 48 horas, sin compromiso. ¿Tiene 5 minutos para verla?"

### Objeciones frecuentes

| Objeción | Respuesta |
|---|---|
| "Ya tengo Facebook" | "Facebook es para interactuar, una web es para que te encuentren en Google cuando alguien busca [su sector] cerca de aquí." |
| "Es muy caro" | "Son 39€ al mes, menos de lo que cuesta el TPV o la alarma. Y cancelas cuando quieras." |
| "No sé si lo necesito" | "Exactamente por eso te preparo la demo gratis, así lo ves con tus propios datos y decides sin compromiso." |
| "Ya tengo web" | "Perfecto, ¿la puedo ver? [miramos juntos] ¿Aparece bien en móvil? ¿Tiene reservas online? Podemos mejorarla." |
| "Ya lo hago yo con IA" | "Claro, pero ¿quién lo actualiza, hace el SEO, gestiona el hosting y responde cuando algo falla? Eso es lo que incluye el plan." |

### Cierre

No presiones. La demo habla sola. El objetivo de la primera visita es dejar la demo y quedar para una llamada de seguimiento en 2 días.

---

## 6. ONBOARDING DE UN CLIENTE NUEVO

Cuando un cliente dice que sí, el proceso es:

1. **Día 1** — Recoger datos: nombre negocio, teléfono, dirección, horarios, servicios y precios, fotos, redes sociales
2. **Día 2-3** — Personalizar la plantilla del nicho correspondiente con sus datos
3. **Día 4** — Enviarle preview para revisión
4. **Día 5-6** — Ajustes según feedback
5. **Día 7** — Comprar dominio (si no tiene) + desplegar en Vercel + apuntar DNS
6. **Día 7** — Enviar acceso al panel de edición (cuando esté construido)
7. **Post-lanzamiento** — Configurar Google My Business, Analytics

**Objetivo:** Nunca más de 7 días desde firma hasta web publicada.

---

## 7. SISTEMA TÉCNICO

### Stack tecnológico

| Capa | Tecnología | Por qué |
|---|---|---|
| Frontend | Next.js | Rápido, SEO excelente, fácil de desplegar |
| Base de datos | Supabase (PostgreSQL) | Gratis al inicio, escala bien |
| Hosting | Vercel | Deploy automático, CDN global, SSL incluido |
| CMS / Edición | Panel propio en Supabase | Simple, específico por nicho |
| Automatización | Make.com + Claude API | WhatsApp → actualiza web automático |
| Dominio | Arsys / Namecheap | .es para negocios españoles |

### Lo que hay construido ahora

- ✅ 7 demos HTML standalone (peluquería, restaurante, fisioterapia, psicólogo, abogados, academia, pádel)
- ✅ Imágenes profesionales generadas por IA (carpeta images/)
- ✅ Web de la agencia (sitalia.html)
- ✅ Template Next.js peluquería (scaffolding inicial)
- ⬜ Conexión Supabase para datos reales
- ⬜ Panel de edición para clientes
- ⬜ Sistema de reservas real
- ⬜ Deploy en Vercel con dominio sitalia.es
- ⬜ Automatización WhatsApp → web

### Próximos pasos técnicos

1. Crear cuentas GitHub + Vercel + Supabase
2. Desplegar sitalia.html en sitalia.es
3. Conectar template peluquería a Supabase
4. Construir panel de edición básico
5. Sistema de reservas real con calendario
6. Automatización Make.com

---

## 8. AUTOMATIZACIÓN CON IA

### El objetivo

Que cada cliente requiera menos de 1 hora de trabajo al mes de Sitalia.

### Flujo automatizado

```
Cliente envía WhatsApp:
"El menú de hoy es: sopa de fideos y lomo, 11€"
        ↓
Make.com recibe el mensaje
        ↓
Claude API interpreta el contenido
        ↓
Supabase actualiza la base de datos
        ↓
La web se actualiza en tiempo real
        ↓
Cliente recibe confirmación automática por WhatsApp
```

### Qué se puede automatizar

| Acción del cliente | Automatización |
|---|---|
| Cambiar menú del día | WhatsApp → Supabase → Web |
| Cambiar horarios festivos | WhatsApp → Supabase → Web |
| Cerrar agenda un día | WhatsApp → bloquear slots |
| Añadir foto nueva | WhatsApp con foto → Supabase Storage → Galería |
| Responder reseñas | Alerta automática cuando llega reseña nueva |

---

## 9. MÉTRICAS A SEGUIR

### KPIs de negocio

| Métrica | Objetivo mes 3 | Objetivo mes 6 | Objetivo mes 12 |
|---|---|---|---|
| Clientes activos | 5 | 15 | 40 |
| MRR (ingreso recurrente) | 195€ | 585€ | 1.560€ |
| Churn mensual | <5% | <5% | <3% |
| Tiempo por cliente nuevo | <8h | <4h | <2h |
| NPS clientes | >7 | >8 | >8 |

### KPIs técnicos

- Tiempo de carga web: <2 segundos
- Uptime: >99.9%
- Tiempo medio de resolución de incidencias: <4h

---

## 10. ARGUMENTARIO DE VALOR

Por qué Sitalia vs las alternativas:

**vs. No tener web:**
- Invisibles para el 60% de clientes que buscan en Google antes de ir
- Sin reservas online = clientes que van a la competencia que sí las tiene

**vs. Hacerlo ellos solos (Wix, IA):**
- ¿Quién actualiza, hace SEO, gestiona hosting, responde cuando falla?
- Por 39€/mes no vale la pena el tiempo que les costaría

**vs. Agencia tradicional:**
- 3x más barato
- 10x más rápido (7 días vs 2-3 meses)
- Específico para su sector, no genérico

**vs. Sobrino que "sabe de webs":**
- Disponibilidad garantizada
- Soporte profesional
- No desaparece en 6 meses

---

*Sitalia — hola@sitalia.es*
