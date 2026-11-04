import { appUrl, emailError, issueToken, userByEmail } from "@/lib/auth";
import { fail, guarded } from "@/lib/guard";
import { resetMail, sendMail } from "@/lib/mail";

export async function POST(req) {
  const { bad, body } = await guarded(req);
  if (bad) return bad;
  const email = String(body.email || "").trim();
  const invalid = emailError(email);
  if (invalid) return fail(invalid);
  const u = userByEmail(email);
  if (u && !u.disabled) {
    const link = `${appUrl(req)}/cuenta/clave?token=${issueToken(u.id, "reset", 3600e3)}`;
    await sendMail(u.email, ...resetMail(link)).catch((e) => console.error("mail:", e.message));
  }
  // Siempre la misma respuesta, exista o no la cuenta.
  return Response.json({ ok: true });
}
