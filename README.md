# Anna Acosta — Psicología

Web estática **multipágina** para Anna Acosta, psicóloga general sanitaria:
terapia integrativa, terapia integrativa para la ansiedad y yoga terapéutico
individual y en grupo.

Dirección visual: **minimalista, inspirada en ffitcocohouse.com**. Una sola familia
tipográfica (Instrument Sans) en pesos ligeros, titulares de sección en minúscula y
tamaño contenido, botones pastilla en mayúscula pequeña. Blancos cálidos, marrón para
la acción, verde salvia para la información y taupe como neutro. Foto en arco, sin
sombras duras ni marcos: la jerarquía la marcan el espacio y el fondo.

Para volver a titulares con capitalización normal, quita `text-transform:lowercase`
de la regla `h2` en `styles.css`.

## Estructura

```
.
├── index.html       # Portada
├── sobre-mi.html
├── servicios.html   # 4 servicios + precios + pasos
├── recursos.html    # Galería con doble filtro
├── preguntas.html   # FAQ
├── contacto.html
├── styles.css       # Estilos comunes (variables CSS en :root)
├── script.js        # Menú móvil, filtros, FAQ, formulario, reveal
└── assets/
    ├── anna-acosta.jpg      # Foto de Anna (900×1200)
    └── anna-acosta@600.jpg  # Versión ligera para móvil (600×800)
```

La cabecera y el pie están duplicados en cada página (no hay build). Si cambias
un enlace del menú, cámbialo en los seis archivos.

Sin dependencias ni build. Se sube tal cual a cualquier hosting estático
(Netlify, Vercel, GitHub Pages, hosting clásico por FTP).

## Portada

La portada está construida para que alguien que no conoce a Anna entienda en
treinta segundos qué es esto y por qué es distinto:

1. **Hero** — "Hay cosas que no se resuelven solo hablando"
2. **¿Te suena esto?** — cinco frases con las que identificarse
3. **Terapia que sale de las cuatro paredes** — tres diferencias + comparativa
   entre la terapia convencional y la integrativa
4. **En qué puede ayudarte** — cuatro resultados concretos
5. **Servicios** en resumen, con enlace al detalle
6. **Cómo empezamos** — tres pasos

## Variables de color

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

| Variable        | Valor     | Uso                          |
|-----------------|-----------|------------------------------|
| `--brown`       | `#8a6f52` | Marrón: botones y acciones   |
| `--brown-d`     | `#6e5740` | Hover de botones             |
| `--green`       | `#7e8d6c` | Verde salvia: iconos, etiquetas, filtros |
| `--green-pale`  | `#eef1e9` | Fondos verdes suaves         |
| `--bg2`         | `#f8f6f2` | Blanco cálido de las tarjetas|
| `--dark`        | `#343b31` | Verde profundo: banda y footer |
| `--taupe`       | `#b9afa1` | Neutro: botón secundario     |
| `--sans`        | `'Instrument Sans'` | Todo el texto      |
| `--logo`        | `'Playfair Display'` | Solo el logo      |

La carpeta `maquetas/` guarda las tres propuestas visuales iniciales. Se puede
borrar antes de publicar.

El logo es texto (`.logo-name` + `.logo-sub` en `index.html`), no una imagen:
escala perfecto y pesa cero. Si Anna envía el logo en SVG/PNG con fondo
transparente, se sustituye por `<img>` en dos minutos.
