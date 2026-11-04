import { getGame } from "@/lib/espn";

export async function GET(_req, { params }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) return Response.json({ error: "id inválido" }, { status: 400 });
  try {
    return Response.json(await getGame(id));
  } catch (e) {
    return Response.json({ error: e.message }, { status: 502 });
  }
}
