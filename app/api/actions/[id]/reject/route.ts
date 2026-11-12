import { NextRequest, NextResponse } from "next/server";
import { getPendingAction, logEvent, resolveAction } from "@/lib/db";


export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const action = await getPendingAction(id);

    if (!action) {
      return NextResponse.json(
        { error: `Pending action '${id}' not found` },
        { status: 404 }
      );
    }

    if (action.status !== "pending") {
      return NextResponse.json(
        {
          error: `Action has already been resolved with status '${action.status}'`,
          action,
        },
        { status: 409 }
      );
    }

    const updated = await resolveAction(action.id, "rejected");
    await logEvent("action_rejected", {
      actionId: action.id,
      type: action.type,
    });

    return NextResponse.json({ action: updated });
  } catch (err: any) {
    console.error("POST /api/actions/[id]/reject error:", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

