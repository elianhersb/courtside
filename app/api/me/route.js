import { currentUser, endAllSessions, publicUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { sameOrigin } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";
const deny = (error, status) => Response.json({ error }, { status });

// La cuenta con sesión y su configuración guardada (null si nunca se guardó).
export async function GET() {
  const u = await currentUser();
  if (!u) return Response.json({ user: null });
  let prefs = null;
  try { prefs = u.prefs ? JSON.parse(u.prefs) : null; } catch {}
  return Response.json({ user: publicUser(u), prefs });
}

// Guarda la configuración y/o el nombre.
export async function PUT(req) {
  if (!sameOrigin(req)) return deny("Origen no permitido", 403);
  const u = await currentUser();
  if (!u) return deny("Inicia sesión", 401);
  const b = await req.json().catch(() => null);
  const db = getDb();
  if (b?.prefs !== undefined) {
    const json = JSON.stringify(b.prefs);
    if (!b.prefs || typeof b.prefs !== "object" || Array.isArray(b.prefs) || json.length > 4000) return deny("Configuración inválida", 400);
    db.prepare("UPDATE users SET prefs = ? WHERE id = ?").run(json, u.id);
  }
  if (typeof b?.name === "string") db.prepare("UPDATE users SET name = ? WHERE id = ?").run(b.name.trim().slice(0, 80), u.id);
  return Response.json({ ok: true });
}

// Borrar la cuenta: datos y sesiones. Los dispositivos quedan anónimos.
export async function DELETE(req) {
  if (!sameOrigin(req)) return deny("Origen no permitido", 403);
  const u = await currentUser();
  if (!u) return deny("Inicia sesión", 401);
  endAllSessions(u.id);
  getDb().prepare("DELETE FROM users WHERE id = ?").run(u.id);
  return Response.json({ ok: true });
}
