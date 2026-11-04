import { getScoreboard } from "@/lib/espn";

export async function GET(req) {
  const date = new URL(req.url).searchParams.get("date") || "";
  if (!/^\d{8}$/.test(date)) return Response.json({ error: "date debe ser YYYYMMDD" }, { status: 400 });
  try {
    return Response.json(await getScoreboard(date));
  } catch (e) {
    return Response.json({ error: e.message }, { status: 502 });
  }
}
