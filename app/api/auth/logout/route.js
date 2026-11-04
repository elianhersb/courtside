import { endSession } from "@/lib/auth";
import { sameOrigin } from "@/lib/ratelimit";

export async function POST(req) {
  if (!sameOrigin(req)) return Response.json({ error: "Origen no permitido" }, { status: 403 });
  await endSession();
  return Response.json({ ok: true });
}
