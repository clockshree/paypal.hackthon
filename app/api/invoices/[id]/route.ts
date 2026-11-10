import { NextRequest, NextResponse } from "next/server";
import { getInvoice } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const invoice = await getInvoice(id);

    if (!invoice) {
      return NextResponse.json(
        { error: `Invoice '${id}' not found` },
        { status: 404 }
      );
    }

    return NextResponse.json(invoice);
  } catch (err: any) {
    console.error("GET /api/invoices/[id] error:", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
