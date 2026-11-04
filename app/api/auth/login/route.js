import { limiter } from "@/lib/ratelimit";
import { publicUser, startSession, userByEmail, verifyPassword } from "@/lib/auth";
import { fail, guarded } from "@/lib/guard";

// Además del tope por IP, uno por correo: frena a quien prueba claves desde muchas IPs.
const perEmail = limiter(10, 15 * 60e3);

export async function POST(req) {
  const { bad, body } = await guarded(req);
  if (bad) return bad;
  const email = String(body.email || "").trim().toLowerCase();
  if (!email || typeof body.password !== "string") return fail("Escribe tu correo y tu clave");
  if (!perEmail(email).ok) return fail("Demasiados intentos con este correo. Espera unos minutos.", 429);
  const u = userByEmail(email);
  // Mismo mensaje si el correo no existe o la clave no coincide: no revela qué correos tienen cuenta.
  if (!u || !u.password_hash || !(await verifyPassword(body.password, u.password_hash))) {
    return fail(u && !u.password_hash ? "Esta cuenta entra con Google. Usa ese botón o crea una clave con “Olvidé mi clave”." : "Correo o clave incorrectos", 401);
  }
  if (u.disabled) return fail("Esta cuenta está desactivada", 403);
  await startSession(u.id);
  return Response.json({ user: publicUser(u) });
}
