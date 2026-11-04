import { subscribe, unsubscribe } from "@/lib/push";
import { limiter, sameOrigin, ipOf } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";
const perIp = limiter(30, 3600e3);

// La clave pública VAPID que el navegador necesita para suscribirse.
export function GET() {
  const key = process.env.VAPID_PUBLIC_KEY;
  return key ? Response.json({ key }) : Response.json({ error: "Las alertas no están configuradas en el servidor" }, { status: 503 });
}

async function guard(req) {
  if (!sameOrigin(req)) return Response.json({ error: "Origen no permitido" }, { status: 403 });
  if (!perIp(ipOf(req)).ok) return Response.json({ error: "Demasiados cambios, intenta en un rato" }, { status: 429 });
  return null;
}

export async function POST(req) {
  const bad = await guard(req);
  if (bad) return bad;
  const b = await req.json().catch(() => null);
  const sub = b?.subscription;
  const ok = typeof sub?.endpoint === "string" && sub.endpoint.startsWith("https://") && sub.endpoint.length < 1000
    && typeof sub.keys?.p256dh === "string" && typeof sub.keys?.auth === "string";
  if (!ok) return Response.json({ error: "Suscripción inválida" }, { status: 400 });
  const teams = (Array.isArray(b.teams) ? b.teams : []).filter((t) => typeof t === "string" && /^[A-Z]{2,4}$/.test(t)).slice(0, 30);
  const notify = { start: !!b.notify?.start, end: !!b.notify?.end, close: !!b.notify?.close };
  const saved = subscribe({ endpoint: sub.endpoint, keys: { p256dh: sub.keys.p256dh.slice(0, 200), auth: sub.keys.auth.slice(0, 100) } }, teams, notify);
  return saved ? Response.json({ ok: true }) : Response.json({ error: "No hay cupo para más alertas" }, { status: 507 });
}

export async function DELETE(req) {
  const bad = await guard(req);
  if (bad) return bad;
  const b = await req.json().catch(() => null);
  if (typeof b?.endpoint === "string") unsubscribe(b.endpoint);
  return Response.json({ ok: true });
}
