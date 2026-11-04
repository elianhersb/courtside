import { appUrl, consumeToken, currentUser, issueToken, promoteIfAdmin, userById } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { limiter, sameOrigin } from "@/lib/ratelimit";
import { sendMail, verifyMail } from "@/lib/mail";

// GET: el enlace del correo. Marca el correo como verificado y vuelve al perfil.
export async function GET(req) {
  const id = consumeToken(new URL(req.url).searchParams.get("token"), "verify");
  if (id) {
    getDb().prepare("UPDATE users SET email_verified = 1 WHERE id = ?").run(id);
    promoteIfAdmin(userById(id));
  }
  return Response.redirect(`${appUrl(req)}/perfil?correo=${id ? "ok" : "vencido"}`, 303);
}

// POST: reenviar el correo de verificación a la cuenta con sesión.
const perUser = limiter(3, 3600e3);
export async function POST(req) {
  if (!sameOrigin(req)) return Response.json({ error: "Origen no permitido" }, { status: 403 });
  const u = await currentUser();
  if (!u) return Response.json({ error: "Inicia sesión" }, { status: 401 });
  if (u.email_verified) return Response.json({ ok: true });
  if (!perUser(String(u.id)).ok) return Response.json({ error: "Ya te enviamos varios correos. Revisa tu bandeja o espera una hora." }, { status: 429 });
  await sendMail(u.email, ...verifyMail(`${appUrl(req)}/api/auth/verify?token=${issueToken(u.id, "verify", 864e5)}`));
  return Response.json({ ok: true });
}
