import { NextResponse } from "next/server";
import { listInvoices, updateInvoiceStatus } from "@/lib/db";
import { getInvoiceStatus } from "@/lib/paypal";


export async function GET() {
  try {
    const invoices = await listInvoices();

    // Best-effort status sync for sent and overdue invoices with a PayPal invoice ID
    await Promise.all(
      invoices.map(async (invoice) => {
        if (
          invoice.paypalInvoiceId &&
          (invoice.status === "sent" || invoice.status === "overdue")
        ) {
          try {
            const latestStatus = await getInvoiceStatus(invoice.paypalInvoiceId);
            if (latestStatus !== invoice.status) {
              await updateInvoiceStatus(invoice.id, latestStatus);
              invoice.status = latestStatus;
            }
          } catch (syncErr) {
            // Best-effort sync: never fail the request if PayPal status sync throws
            console.warn(
              `Status sync skipped for invoice ${invoice.id} (${invoice.paypalInvoiceId}):`,
              syncErr
            );
          }
        }
      })
    );

    return NextResponse.json(invoices);
  } catch (err: any) {
    console.error("GET /api/invoices error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to list invoices" },
      { status: 500 }
    );
  }
}
