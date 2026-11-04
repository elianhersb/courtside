import { getLeaders } from "@/lib/espn";

export async function GET() {
  try {
    return Response.json(await getLeaders());
  } catch (e) {
    return Response.json({ error: e.message }, { status: 502 });
  }
}
