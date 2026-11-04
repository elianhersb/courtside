import { searchPlayers, getAthlete } from "@/lib/espn";

// IDs de ESPN de jugadores destacados para la lista "Populares".
const POPULAR = ["3975", "1966", "3112335", "4278073", "5104157", "3945274"];

export async function GET(req) {
  const q = (new URL(req.url).searchParams.get("q") || "").trim().slice(0, 40);
  try {
    if (q.length >= 2) return Response.json(await searchPlayers(q));
    return Response.json(await Promise.all(POPULAR.map(getAthlete)));
  } catch (e) {
    return Response.json({ error: e.message }, { status: 502 });
  }
}
