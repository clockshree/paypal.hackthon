import { NextResponse } from "next/server";
import { listLogs } from "@/lib/db";
import { toUiLog } from "@/lib/adapters";

export async function GET() {
  try {
    const logs = await listLogs(50);
    return NextResponse.json(logs.map(toUiLog));
  } catch (err) {
    console.error("GET /api/ui/action-logs error:", err);
    return NextResponse.json({ error: "Failed to load logs" }, { status: 500 });
  }
}