# CourtSide

PWA para seguir la NBA desde Venezuela: partidos del día con marcador en vivo, dónde verlos, box score, jugada a jugada, perfiles de jugadores y un asistente con IA.

## Correr

```bash
npm install
cp .env.example .env.local   # poner ANTHROPIC_API_KEY para el asistente
npm run dev                  # http://localhost:3000
npm test                     # pruebas de los normalizadores de datos
```

Para instalarla en el teléfono hace falta HTTPS (p. ej. desplegar en Vercel). En Android aparece "Instalar"; en iPhone, Safari → Compartir → "Agregar a pantalla de inicio".

## Docker

```bash
docker compose up -d --build     # http://localhost:3000, lee el asistente de .env.local
```

La imagen usa la salida `standalone` de Next.js, corre como usuario sin privilegios y trae healthcheck.
Las keys nunca entran en la imagen: se pasan como variables de entorno al correrla.

## CI/CD

`.github/workflows/ci.yml` corre en cada push y pull request: instala, pasa las pruebas y compila. En cada push a
`main` (y en tags `v*`) publica la imagen en `ghcr.io/elianhersb/courtside` con las etiquetas `latest`, `sha-…` y
la versión. Para desplegar en un servidor con Docker:

```bash
docker pull ghcr.io/elianhersb/courtside:latest
docker run -d --env-file .env.local -p 3000:3000 ghcr.io/elianhersb/courtside:latest
```

## Estructura

- `components/cs.js`: sistema de componentes exportado de Claude Design (no editar a mano salvo para conectar eventos). Estilos en `app/tokens.css` y `app/courtside.css`.
- `lib/espn.js`: datos desde la API pública de ESPN (no oficial), normalizados al formato de los componentes.
- `lib/channels.js`: reglas de "Dónde verlo" por país.
- `lib/cup.js`: Copa NBA. Los grupos de cada temporada se cargan a mano en `SEASON` (ESPN no los publica); la tabla, el wild card y la llave se calculan con los resultados.
- `app/api/*`: rutas que consulta la app; `app/api/chat` es el asistente (Claude con herramientas que llaman a `lib/espn.js`).
- `public/sw.js`: service worker (red primero, caché como respaldo).

## Pendiente

- Canales locales (Meridiano, Televen): requieren el scraper de guías EPG.
- Notificaciones push: los ajustes se guardan pero aún no se envían alertas.
- Logos de canales/suscripciones: hoy se muestran como texto.
