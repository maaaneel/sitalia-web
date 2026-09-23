# Anna Acosta — Psicología

Web estática (one-page) para Anna Acosta, psicóloga general sanitaria: psicoterapia,
psicoterapia para la ansiedad, yoga terapéutico y sesiones integrativas.

Sistema visual basado en [sitalia.es](https://sitalia.es), con paleta de marrones
cálidos y wordmark serif (Playfair Display) a juego con el logo de Anna.

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
8. Contacto (WhatsApp + formulario que compone el mensaje)

## Pendiente de rellenar

Busca los corchetes `[...]` en `index.html`:

- [ ] `[EMAIL]` — sección contacto y footer
- [ ] `[@USUARIO]` — Instagram
- [ ] `[DIRECCIÓN / ONLINE]` — ubicación
- [ ] `Nº de colegiada: [PENDIENTE]`
- [ ] Los 6 recursos de la galería (título, descripción, duración, enlace/embed)
- [ ] 2 FAQ marcadas en ámbar: modalidad (online/presencial) y política de cancelación
- [ ] Aviso legal, política de privacidad y cookies (obligatorio en España, más
      tratándose de datos de salud)

## Contacto por WhatsApp

Todas las llamadas a la acción llevan a WhatsApp (663 26 06 01) con el mensaje
ya redactado según el servicio. El formulario no envía nada a ningún servidor:
compone el texto y abre WhatsApp (app en móvil, WhatsApp Web en escritorio).

Sin backend, sin base de datos y sin datos personales almacenados —
lo que simplifica bastante la parte de RGPD.

Para cambiar el número: `WA_NUMERO` en `script.js` y los `wa.me/` de
`index.html` (9 enlaces).

## Personalización rápida

Las variables están en `:root` dentro de `styles.css`:

| Variable        | Valor     | Uso                          |
|-----------------|-----------|------------------------------|
| `--accent`      | `#8c6b4d` | Marrón, color principal      |
| `--accent-dark` | `#6f5440` | Hover de botones             |
| `--accent-pale` | `#f4ece2` | Fondos suaves, pills, badges |
| `--accent-2`    | `#b5744a` | Terracota, avisos            |
| `--dark`        | `#332a24` | Banda oscura y footer        |
| `--serif`       | `'Playfair Display'` | Logo y titulares  |

El logo es texto (`.logo-name` + `.logo-sub` en `index.html`), no una imagen:
escala perfecto y pesa cero. Si Anna envía el logo en SVG/PNG con fondo
transparente, se sustituye por `<img>` en dos minutos.
