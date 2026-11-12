import { NextResponse } from "next/server";
import { listPendingActions } from "@/lib/db";
import { toUiApproval } from "@/lib/adapters";

export async function GET() {
  try {
    const actions = await listPendingActions();
    return NextResponse.json(actions.map(toUiApproval));
  } catch (err) {
    console.error("GET /api/ui/approvals error:", err);
    return NextResponse.json({ error: "Failed to load approvals" }, { status: 500 });
  }
}