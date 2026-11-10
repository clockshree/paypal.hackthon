import { NextRequest, NextResponse } from "next/server";
import {
  createInvoice,
  getInvoice,
  getPendingAction,
  logEvent,
  resolveAction,
} from "@/lib/db";
import { createAndSendInvoice, sendReminder } from "@/lib/paypal";
import { InvoiceDraft } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateDraft(draft: any): { valid: boolean; error?: string } {
  if (!draft || typeof draft !== "object") {
    return { valid: false, error: "Missing invoice draft payload" };
  }

  const { clientName, clientEmail, description, amount, dueInDays } = draft;

  if (!clientName || typeof clientName !== "string" || !clientName.trim()) {
    return { valid: false, error: "Client name is required" };
  }

  if (
    !clientEmail ||
    typeof clientEmail !== "string" ||
    !EMAIL_REGEX.test(clientEmail.trim())
  ) {
    return {
      valid: false,
      error: "Valid client email is required (e.g. client@example.com)",
    };
  }

  if (
    !description ||
    typeof description !== "string" ||
    !description.trim()
  ) {
    return { valid: false, error: "Description is required" };
  }

  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount <= 0 || numAmount > 10000) {
    return {
      valid: false,
      error: "Amount must be a positive number greater than 0 and at most 10,000",
    };
  }

  const numDue = Number(dueInDays);
  if (isNaN(numDue) || numDue < 1 || numDue > 90) {
    return {
      valid: false,
      error: "dueInDays must be an integer between 1 and 90",
    };
  }

  return { valid: true };
}

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const action = await getPendingAction(id);

    if (!action) {
      return NextResponse.json(
        { error: `Pending action '${id}' not found` },
        { status: 404 }
      );
    }

    if (action.status !== "pending") {
      return NextResponse.json(
        {
          error: `Action has already been resolved with status '${action.status}'`,
          action,
        },
        { status: 409 }
      );
    }

    if (action.type === "create_invoice") {
      const draft = action.payload as InvoiceDraft;
      const validation = validateDraft(draft);

      if (!validation.valid) {
        // Return 400 and leave action pending
        return NextResponse.json(
          { error: validation.error },
          { status: 400 }
        );
      }

      // Call PayPal
      let paypalResult;
      try {
        paypalResult = await createAndSendInvoice({
          clientName: draft.clientName.trim(),
          clientEmail: draft.clientEmail.trim(),
          description: draft.description.trim(),
          amount: Number(draft.amount),
          dueInDays: Number(draft.dueInDays),
        });
      } catch (paypalErr: any) {
        console.error("PayPal createAndSendInvoice failed:", paypalErr);
        await logEvent("paypal_create_invoice_error", {
          actionId: action.id,
          error: paypalErr?.message,
          debugId: paypalErr?.debugId,
        });
        return NextResponse.json(
          {
            error: paypalErr?.message || "PayPal invoice creation failed",
            debugId: paypalErr?.debugId,
          },
          { status: 502 }
        );
      }

      // Insert invoice with status "sent"
      const createdInvoice = await createInvoice({
        clientName: draft.clientName.trim(),
        clientEmail: draft.clientEmail.trim(),
        description: draft.description.trim(),
        amount: Number(draft.amount),
        dueInDays: Number(draft.dueInDays),
        status: "sent",
        paypalInvoiceId: paypalResult.paypalInvoiceId,
      });

      // Mark action approved
      const updatedAction = await resolveAction(action.id, "approved");

      await logEvent("invoice_created_and_sent", {
        actionId: action.id,
        invoiceId: createdInvoice.id,
        paypalInvoiceId: paypalResult.paypalInvoiceId,
        invoiceUrl: paypalResult.invoiceUrl,
      });

      return NextResponse.json({
        action: updatedAction,
        invoice: createdInvoice,
      });
    }

    if (action.type === "send_reminder") {
      const payload = action.payload as {
        invoiceId: string;
        message: string;
        tone?: string;
      };

      if (!payload?.invoiceId) {
        return NextResponse.json(
          { error: "Payload missing 'invoiceId'" },
          { status: 400 }
        );
      }

      const invoice = await getInvoice(payload.invoiceId);
      if (!invoice) {
        return NextResponse.json(
          { error: `Invoice '${payload.invoiceId}' not found for reminder` },
          { status: 404 }
        );
      }

      if (invoice.status === "paid") {
        return NextResponse.json(
          { error: "Cannot send reminder for an invoice that is already paid" },
          { status: 400 }
        );
      }

      if (!invoice.paypalInvoiceId) {
        return NextResponse.json(
          { error: "Invoice has no associated PayPal invoice ID" },
          { status: 400 }
        );
      }

      // Call PayPal reminder
      try {
        await sendReminder(invoice.paypalInvoiceId, {
          subject: `Payment Reminder: Invoice ${invoice.paypalInvoiceId}`,
          note:
            payload.message ||
            "Please review and settle your pending invoice at your earliest convenience.",
        });
      } catch (paypalErr: any) {
        console.error("PayPal sendReminder failed:", paypalErr);
        await logEvent("paypal_send_reminder_error", {
          actionId: action.id,
          invoiceId: invoice.id,
          error: paypalErr?.message,
          debugId: paypalErr?.debugId,
        });
        return NextResponse.json(
          {
            error: paypalErr?.message || "PayPal reminder dispatch failed",
            debugId: paypalErr?.debugId,
          },
          { status: 502 }
        );
      }

      const updatedAction = await resolveAction(action.id, "approved");
      await logEvent("invoice_reminder_sent", {
        actionId: action.id,
        invoiceId: invoice.id,
        paypalInvoiceId: invoice.paypalInvoiceId,
        message: payload.message,
      });

      return NextResponse.json({
        action: updatedAction,
        invoice,
      });
    }

    return NextResponse.json(
      { error: `Unsupported action type '${(action as any).type}'` },
      { status: 400 }
    );
  } catch (err: any) {
    console.error("POST /api/actions/[id]/approve error:", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
