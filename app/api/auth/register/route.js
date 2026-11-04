import { appUrl, createUser, hashPassword, issueToken, passwordError, publicUser, startSession, userByEmail, validEmail } from "@/lib/auth";
import { count } from "@/lib/db";
import { fail, guarded } from "@/lib/guard";
import { sendMail, verifyMail } from "@/lib/mail";

export async function POST(req) {
  const { bad, body } = await guarded(req);
  if (bad) return bad;
  const email = String(body.email || "").trim(), name = String(body.name || "").trim();
  if (!validEmail(email)) return fail("Escribe un correo válido");
  const pe = passwordError(body.password);
  if (pe) return fail(pe);
  if (userByEmail(email)) return fail("Ya hay una cuenta con ese correo. Entra o recupera tu clave.", 409);
  const user = createUser({ email, name, passwordHash: await hashPassword(body.password) });
  count("signup");
  const link = `${appUrl(req)}/api/auth/verify?token=${issueToken(user.id, "verify", 864e5)}`;
  await sendMail(email, ...verifyMail(link)).catch((e) => console.error("mail:", e.message));
  await startSession(user.id);
  return Response.json({ user: publicUser(user) });
}
