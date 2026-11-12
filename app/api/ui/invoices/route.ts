import { NextResponse } from "next/server";
import { listInvoices } from "@/lib/db";
import { toUiInvoice } from "@/lib/adapters";

export async function GET() {
  try {
    const invoices = await listInvoices();
    return NextResponse.json(invoices.map(toUiInvoice));
  } catch (err) {
    console.error("GET /api/ui/invoices error:", err);
    return NextResponse.json({ error: "Failed to load invoices" }, { status: 500 });
  }
}