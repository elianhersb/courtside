import { can, currentUser, endAllSessions, ROLES, userById } from "@/lib/auth";
import { listUsers } from "@/lib/admin";
import { getDb } from "@/lib/db";
import { sameOrigin } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";
const deny = (error, status = 403) => Response.json({ error }, { status });

export async function GET(req) {
  if (!can(await currentUser(), "admin.view")) return deny("No tienes acceso al panel");
  const q = new URL(req.url).searchParams;
  return Response.json({ users: listUsers(q.get("q") || "", Math.max(0, Number(q.get("page")) || 0)) });
}

// Cambiar el rol o desactivar una cuenta. Nadie se cambia a sí mismo, así no hay forma de quedarse sin admin por error.
export async function PATCH(req) {
  if (!sameOrigin(req)) return deny("Origen no permitido");
  const me = await currentUser();
  if (!can(me, "users.manage")) return deny("No tienes permiso para cambiar cuentas");
  const b = await req.json().catch(() => null);
  const u = userById(Number(b?.id));
  if (!u) return deny("No existe esa cuenta", 404);
  if (u.id === me.id) return deny("No puedes cambiar tu propia cuenta desde aquí", 400);
  const db = getDb();
  if (b.role !== undefined) {
    if (!ROLES[b.role]) return deny("Rol inválido", 400);
    db.prepare("UPDATE users SET role = ? WHERE id = ?").run(b.role, u.id);
  }
  if (b.disabled !== undefined) {
    db.prepare("UPDATE users SET disabled = ? WHERE id = ?").run(b.disabled ? 1 : 0, u.id);
    if (b.disabled) endAllSessions(u.id);
  }
  return Response.json({ ok: true });
}
