import { consumeToken, endAllSessions, hashPassword, passwordError, promoteIfAdmin, publicUser, startSession, userById } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { fail, guarded } from "@/lib/guard";

export async function POST(req) {
  const { bad, body } = await guarded(req);
  if (bad) return bad;
  const owner = consumeToken(body.token, "reset", true);
  if (!owner) return fail("El enlace venció o ya se usó. Pide uno nuevo.", 410);
  // Se valida antes de gastar el enlace: si la clave no sirve, la persona puede corregirla y reintentar.
  const pe = passwordError(body.password, userById(owner).email);
  if (pe) return fail(pe);
  const id = consumeToken(body.token, "reset");
  if (!id) return fail("El enlace venció o ya se usó. Pide uno nuevo.", 410);
  // Quien abrió el enlace demostró que el correo es suyo: queda verificado. Se cierran las demás sesiones.
  getDb().prepare("UPDATE users SET password_hash = ?, email_verified = 1 WHERE id = ?").run(await hashPassword(body.password), id);
  endAllSessions(id);
  const u = promoteIfAdmin(userById(id));
  if (u.disabled) return fail("Esta cuenta está desactivada", 403);
  await startSession(id);
  return Response.json({ user: publicUser(u) });
}
