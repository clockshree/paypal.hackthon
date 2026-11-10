import { NextRequest, NextResponse } from "next/server";
import {
  getInvoiceByPaypalId,
  logEvent,
  updateInvoiceStatus,
} from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/paypal";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();

    if (!rawBody) {
      return NextResponse.json(
        { error: "Empty request body" },
        { status: 400 }
      );
    }

    // Verify webhook signature with PayPal
    const isValid = await verifyWebhookSignature(request.headers, rawBody);
    if (!isValid) {
      console.warn("PayPal webhook signature verification failed");
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 401 }
      );
    }

    let event: any;
    try {
      event = JSON.parse(rawBody);
    } catch (parseErr) {
      console.error("Failed to parse PayPal webhook JSON payload:", parseErr);
      return NextResponse.json(
        { error: "Malformed JSON payload" },
        { status: 400 }
      );
    }

    const eventType = event?.event_type;
    const resource = event?.resource || {};
    // Fall back from resource.invoice.id to resource.id
    const paypalInvoiceId = resource.invoice?.id || resource.id;

    console.log(
      `Received PayPal webhook event: ${eventType} for PayPal invoice: ${paypalInvoiceId}`
    );

    if (eventType === "INVOICING.INVOICE.PAID") {
      if (paypalInvoiceId) {
        const invoice = await getInvoiceByPaypalId(paypalInvoiceId);
        if (invoice) {
          // Idempotent update
          if (invoice.status !== "paid") {
            await updateInvoiceStatus(invoice.id, "paid");
          }
          await logEvent("webhook_invoice_paid", {
            paypalInvoiceId,
            invoiceId: invoice.id,
            eventId: event.id,
          });
        } else {
          // Log unknown invoice but respond 200 quickly
          await logEvent("webhook_invoice_paid_unknown_invoice", {
            paypalInvoiceId,
            eventId: event.id,
          });
        }
      }
    } else if (eventType === "INVOICING.INVOICE.CANCELLED") {
      await logEvent("webhook_invoice_cancelled", {
        paypalInvoiceId,
        eventId: event.id,
      });
    } else {
      await logEvent("webhook_event_received", {
        eventType,
        paypalInvoiceId,
        eventId: event?.id,
      });
    }

    // Always respond 200 quickly for valid events
    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("POST /api/webhooks/paypal internal error:", err);
    // Return 500 so PayPal can retry if server crashed
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
