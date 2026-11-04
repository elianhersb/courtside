import { can, currentUser } from "@/lib/auth";
import { stats } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!can(await currentUser(), "admin.view")) return Response.json({ error: "No tienes acceso al panel" }, { status: 403 });
  return Response.json(stats());
}
