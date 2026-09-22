# Anna Acosta — Psicología

Web estática (one-page) para Anna Acosta, psicóloga general sanitaria: psicoterapia,
psicoterapia para la ansiedad, yoga terapéutico y sesiones integrativas.

Sistema visual basado en [sitalia.es](https://sitalia.es), con paleta adaptada a
tonos cálidos (salvia + neutros) y titulares en serif.

## Estructura

```
.
├── index.html    # Todo el contenido y la estructura
├── styles.css    # Estilos (variables CSS en :root)
├── script.js     # Menú móvil, filtros de recursos, FAQ, formulario, reveal on scroll
└── assets/
    ├── anna-acosta.jpg      # Foto de Anna (900×1200)
    └── anna-acosta@600.jpg  # Versión ligera para móvil (600×800)
```

Sin dependencias ni build. Se sube tal cual a cualquier hosting estático
(Netlify, Vercel, GitHub Pages, hosting clásico por FTP).

## Secciones

1. Inicio (hero + recorrido de entrada + stats)
2. Sobre mí
3. Servicios (5 servicios + tablas de precios)
4. El enfoque (banda oscura)
5. Reservas / Citas (3 pasos)
6. Recursos (galería con doble filtro: tipo + tema)
7. FAQ (acordeón, 2 columnas)
8. Contacto (datos + formulario)

## Pendiente de rellenar

Busca los corchetes `[...]` en `index.html`:

- [ ] `[EMAIL]` — sección contacto y footer
- [ ] `[@USUARIO]` — Instagram
- [ ] `[DIRECCIÓN / ONLINE]` — ubicación
- [ ] `Nº de colegiada: [PENDIENTE]`
- [ ] `[ENLACE AGENDA ONLINE]` — Calendly / Doctoralia
- [ ] Los 6 recursos de la galería (título, descripción, duración, enlace/embed)
- [ ] 2 FAQ marcadas en ámbar: modalidad (online/presencial) y política de cancelación
- [ ] Aviso legal, política de privacidad y cookies (obligatorio en España, más
      tratándose de datos de salud)

## Formulario de contacto

Ahora mismo solo valida en cliente, no envía. Para conectarlo con Formspree:

```html
<form id="contactForm" action="https://formspree.io/f/TU_ID" method="POST">
```

…y elimina el bloque 5 de `script.js` (validación/simulación).

## Personalización rápida

Las variables están en `:root` dentro de `styles.css`:

| Variable        | Valor     | Uso                          |
|-----------------|-----------|------------------------------|
| `--accent`      | `#7c9473` | Salvia, color principal      |
| `--accent-dark` | `#65795d` | Hover de botones             |
| `--accent-pale` | `#eef3ec` | Fondos suaves, pills, badges |
| `--accent-2`    | `#c08552` | Terracota, avisos            |
| `--dark`        | `#2f3630` | Banda oscura y footer        |
| `--serif`       | `'Lora'`  | Titulares                    |

Para dejarlo 100 % igual que sitalia.es: `--serif: var(--sans);`
