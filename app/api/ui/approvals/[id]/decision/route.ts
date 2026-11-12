import { NextRequest, NextResponse } from "next/server";
import { POST as approve } from "@/app/api/actions/[id]/approve/route";
import { POST as reject } from "@/app/api/actions/[id]/reject/route";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let decision: unknown;
  try {
    ({ decision } = await request.json());
  } catch {
    decision = undefined;
  }

  if (decision !== "approve" && decision !== "reject") {
    return NextResponse.json(
      { error: "decision must be 'approve' or 'reject'" },
      { status: 400 }
    );
  }

  const handler = decision === "approve" ? approve : reject;
  const res = await handler(request, { params: Promise.resolve({ id }) });
  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    return NextResponse.json(
      { error: (body as { error?: string }).error ?? "Request failed" },
      { status: res.status }
    );
  }

  return NextResponse.json({
    success: true,
    status: decision === "approve" ? "Approved" : "Rejected",
  });
}