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

## Estructura

- `components/cs.js`: sistema de componentes exportado de Claude Design (no editar a mano salvo para conectar eventos). Estilos en `app/tokens.css` y `app/courtside.css`.
- `lib/espn.js`: datos desde la API pública de ESPN (no oficial), normalizados al formato de los componentes.
- `lib/channels.js`: reglas de "Dónde verlo" por país.
- `app/api/*`: rutas que consulta la app; `app/api/chat` es el asistente (Claude con herramientas que llaman a `lib/espn.js`).
- `public/sw.js`: service worker (red primero, caché como respaldo).

## Pendiente

- Canales locales (Meridiano, Televen): requieren el scraper de guías EPG.
- Notificaciones push: los ajustes se guardan pero aún no se envían alertas.
- Logos de canales/suscripciones: hoy se muestran como texto.
