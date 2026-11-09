import { parseInvoiceRequest } from "../../../lib/agent";
import type { InvoiceDraft } from "../../../lib/types";
import { createPending } from "../../../lib/pending";
const LABELS: Record<keyof InvoiceDraft, string> = {
  clientName: "the client's name",
  clientEmail: "the client's email address",
  description: "what the invoice is for",
  amount: "the amount",
  dueInDays: "how many days until it is due",
};

export async function POST(request: Request) {
  let message: unknown;
  try {
    ({ message } = await request.json());
  } catch {
    return Response.json(
      { error: 'Send JSON like { "message": "Bill Acme $450" }' },
      { status: 400 }
    );
  }

  if (typeof message !== "string" || !message.trim()) {
    return Response.json({ error: "Please type a message." }, { status: 400 });
  }
  if (message.length > 500) {
    return Response.json({ error: "Message is too long." }, { status: 400 });
  }

  try {
    const { draft, validation } = await parseInvoiceRequest(message);

    let status: "ready" | "needs_info" | "invalid" = "ready";
    let reply = "Here is your invoice draft. Please review it and approve.";

    if (validation.errors.length > 0) {
      status = "invalid";
      reply = validation.errors.join(" ");
    } else if (validation.missing.length > 0) {
      status = "needs_info";
      const list = validation.missing.map((f) => LABELS[f]).join(", ");
      reply = `I still need: ${list}.`;
    }

        let actionId: string | undefined;
    if (status === "ready") {
      actionId = createPending("create_invoice", { ...draft }).id;
    }

    return Response.json({
      status,
      reply,
      draft,
      missing: validation.missing,
      errors: validation.errors,
      actionId,
    });
  } catch (err) {
    console.error("Agent error:", err);
    return Response.json(
      { error: "The AI is busy right now. Please try again." },
      { status: 503 }
    );
  }
}