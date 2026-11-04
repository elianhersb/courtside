import { cookies } from "next/headers";
import { appUrl, googleUser, startSession, userByEmail } from "@/lib/auth";
import { count } from "@/lib/db";

export async function GET(req) {
  const base = appUrl(req), q = new URL(req.url).searchParams;
  const jar = await cookies();
  let saved = {};
  try { saved = JSON.parse(jar.get("cs_oauth")?.value || "{}"); } catch {}
  jar.delete({ name: "cs_oauth", path: "/api/auth/google" });
  const back = (error) => Response.redirect(`${base}/cuenta?error=${error}`, 303);
  if (!q.get("code") || !saved.state || q.get("state") !== saved.state) return back("google");
  try {
    const tok = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ code: q.get("code"), client_id: process.env.GOOGLE_CLIENT_ID, client_secret: process.env.GOOGLE_CLIENT_SECRET, redirect_uri: `${base}/api/auth/google/callback`, grant_type: "authorization_code", code_verifier: saved.verifier }),
    }).then((r) => r.json());
    if (!tok.access_token) return back("google");
    // El token llega directo de Google por TLS con nuestro secreto, así que los datos del usuario son confiables.
    const info = await fetch("https://openidconnect.googleapis.com/v1/userinfo", { headers: { authorization: `Bearer ${tok.access_token}` } }).then((r) => r.json());
    if (!info.sub || !info.email || !info.email_verified) return back("google-correo");
    const isNew = !userByEmail(info.email);
    const u = googleUser(info);
    if (u.disabled) return back("desactivada");
    if (isNew) count("signup");
    await startSession(u.id);
    // Solo rutas propias: un "next" a otro dominio sería una redirección abierta.
    const next = /^\/(?!\/)[\w\-/?=&]*$/.test(saved.next || "") ? saved.next : "/perfil";
    return Response.redirect(`${base}${next}`, 303);
  } catch (e) {
    console.error("google:", e.message);
    return back("google");
  }
}
