import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { appUrl, randomToken } from "@/lib/auth";

// Inicio de "Entrar con Google" (OAuth con PKCE). El state y el verificador viajan en una cookie de 10 minutos.
export async function GET(req) {
  const id = process.env.GOOGLE_CLIENT_ID;
  if (!id) return Response.redirect(`${appUrl(req)}/cuenta?error=google-off`, 303);
  const state = randomToken(), verifier = randomToken();
  const next = new URL(req.url).searchParams.get("next") || "/perfil";
  (await cookies()).set("cs_oauth", JSON.stringify({ state, verifier, next }), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/api/auth/google", maxAge: 600 });
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({
    client_id: id, redirect_uri: `${appUrl(req)}/api/auth/google/callback`, response_type: "code", scope: "openid email profile",
    state, code_challenge: createHash("sha256").update(verifier).digest("base64url"), code_challenge_method: "S256", prompt: "select_account",
  });
  return Response.redirect(url, 303);
}
