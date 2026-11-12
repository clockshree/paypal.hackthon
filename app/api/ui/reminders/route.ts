import { NextResponse } from "next/server";
import { listInvoices } from "@/lib/db";
import { toUiReminders } from "@/lib/adapters";

export async function GET() {
  try {
    const invoices = await listInvoices();
    return NextResponse.json(toUiReminders(invoices));
  } catch (err) {
    console.error("GET /api/ui/reminders error:", err);
    return NextResponse.json({ error: "Failed to load reminders" }, { status: 500 });
  }
}