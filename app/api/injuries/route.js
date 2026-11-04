import { getInjuries } from "@/lib/espn";

export async function GET() {
  try {
    return Response.json(await getInjuries());
  } catch (e) {
    return Response.json({ error: e.message }, { status: 502 });
  }
}
