import { decide } from "../../../../../lib/pending";
import { executeAction } from "../../../../../lib/executor";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const result = decide(id, "approved");
  if (!result.ok) {
    const status = result.error === "Action not found." ? 404 : 409;
    return Response.json({ error: result.error }, { status });
  }

  try {
    const execution = await executeAction(result.action);
    return Response.json({ status: "approved", action: result.action, execution });
  } catch (err) {
    console.error("Execution error:", err);
    return Response.json(
      {
        status: "approved",
        action: result.action,
        error: "Approved, but running the action failed.",
      },
      { status: 500 }
    );
  }
}