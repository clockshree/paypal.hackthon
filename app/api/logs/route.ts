import { NextResponse } from "next/server";
import { listLogs } from "@/lib/db";


export async function GET() {
  try {
    const logs = await listLogs(50);
    return NextResponse.json(logs);
  } catch (err: any) {
    console.error("GET /api/logs error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to fetch action logs" },
      { status: 500 }
    );
  }
}
