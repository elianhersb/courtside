import { getCup } from "@/lib/cup";

export async function GET() {
  try {
    return Response.json(await getCup());
  } catch (e) {
    return Response.json({ error: e.message }, { status: 502 });
  }
}
