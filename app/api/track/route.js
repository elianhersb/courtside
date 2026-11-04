import { currentUser } from "@/lib/auth";
import { getDb, now, count } from "@/lib/db";
import { limiter, sameOrigin, ipOf } from "@/lib/ratelimit";

const perIp = limiter(60, 3600e3);
const PLATFORMS = ["android", "ios", "desktop"];

// Visita de un dispositivo (id anónimo al azar, guardado en el navegador) y si la app está instalada.
export async function POST(req) {
  if (!sameOrigin(req) || !perIp(ipOf(req)).ok) return new Response(null, { status: 204 });
  const b = await req.json().catch(() => null);
  if (typeof b?.id !== "string" || !/^[\w-]{8,64}$/.test(b.id)) return new Response(null, { status: 204 });
  const platform = PLATFORMS.includes(b.platform) ? b.platform : "desktop";
  const installed = b.installed || b.standalone ? now() : null;
  const user = await currentUser();
  const db = getDb();
  const prev = db.prepare("SELECT installed_at FROM devices WHERE id = ?").get(b.id);
  db.prepare(`INSERT INTO devices (id, platform, standalone, installed_at, first_seen, last_seen, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET platform = excluded.platform, standalone = MAX(standalone, excluded.standalone),
      installed_at = COALESCE(installed_at, excluded.installed_at), last_seen = excluded.last_seen, user_id = COALESCE(excluded.user_id, user_id)`)
    .run(b.id, platform, b.standalone ? 1 : 0, installed, now(), now(), user?.id ?? null);
  if (!prev) count("device_new");
  if (installed && !prev?.installed_at) count("install");
  return new Response(null, { status: 204 });
}
