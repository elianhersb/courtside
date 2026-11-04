import { limiter, sameOrigin, ipOf } from "./ratelimit.js";

// Para las rutas de cuenta: solo desde la propia app y con tope por IP contra fuerza bruta.
const perIp = limiter(20, 15 * 60e3);
export const fail = (error, status = 400) => Response.json({ error }, { status });

export async function guarded(req) {
  if (!sameOrigin(req)) return { bad: fail("Origen no permitido", 403) };
  if (!perIp(ipOf(req)).ok) return { bad: fail("Demasiados intentos. Espera unos minutos.", 429) };
  return { body: (await req.json().catch(() => null)) || {} };
}
