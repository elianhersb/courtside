import { getSeason, currentSeason } from "@/lib/season";

export async function GET(req) {
  const now = currentSeason();
  const year = Number(new URL(req.url).searchParams.get("year")) || now;
  if (!Number.isInteger(year) || year < now - 5 || year > now) return Response.json({ error: "Temporada no válida" }, { status: 400 });
  try {
    return Response.json(await getSeason(year));
  } catch (e) {
    return Response.json({ error: e.message }, { status: 502 });
  }
}
