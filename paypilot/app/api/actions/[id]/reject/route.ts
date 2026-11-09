import { decide } from "../../../../../lib/pending";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const result = decide(id, "rejected");
  if (!result.ok) {
    const status = result.error === "Action not found." ? 404 : 409;
    return Response.json({ error: result.error }, { status });
  }

  return Response.json({ status: "rejected", action: result.action });
}