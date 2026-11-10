import { NextRequest, NextResponse } from "next/server";
import {
  createPendingAction,
  listPendingActions,
  logEvent,
} from "@/lib/db";
import { PendingActionStatus, PendingActionType } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as PendingActionStatus | null;
    const actions = await listPendingActions(status || undefined);
    return NextResponse.json(actions);
  } catch (err: any) {
    console.error("GET /api/actions error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to list pending actions" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, payload } = body;

    if (!type || !payload) {
      return NextResponse.json(
        { error: "Missing required fields 'type' or 'payload'" },
        { status: 400 }
      );
    }

    if (type !== "create_invoice" && type !== "send_reminder") {
      return NextResponse.json(
        { error: `Invalid action type '${type}'` },
        { status: 400 }
      );
    }

    const action = await createPendingAction(
      type as PendingActionType,
      payload
    );
    await logEvent("pending_action_created", {
      actionId: action.id,
      type: action.type,
    });

    return NextResponse.json(action, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/actions error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to create pending action" },
      { status: 500 }
    );
  }
}
