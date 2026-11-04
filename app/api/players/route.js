import { searchPlayers } from "@/lib/espn";

export async function GET(req) {
  const q = (new URL(req.url).searchParams.get("q") || "").trim().slice(0, 40);
  if (q.length < 2) return Response.json({ error: "Escribe al menos 2 letras" }, { status: 400 });
  try {
    return Response.json(await searchPlayers(q));
  } catch (e) {
    return Response.json({ error: e.message }, { status: 502 });
  }
}
