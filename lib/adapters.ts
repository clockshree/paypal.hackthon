import type { Invoice, InvoiceDraft, PendingAction } from "./types";
import type {
  Invoice as UiInvoice,
  InvoiceStatus as UiInvoiceStatus,
  ApprovalRequest,
  Reminder,
  ActionLog,
  ActionStatus,
} from "@/data/mockData";

const DAY_MS = 24 * 60 * 60 * 1000;

function dateOnly(d: Date): string {
  return d.toISOString().slice(0, 10);
}

const INVOICE_STATUS: Record<string, UiInvoiceStatus> = {
  draft: "Pending",
  pending_approval: "Awaiting Approval",
  sent: "Pending",
  paid: "Paid",
  overdue: "Overdue",
};

export function toUiInvoice(inv: Invoice): UiInvoice {
  const issued = new Date(inv.createdAt);
  const due = new Date(issued.getTime() + inv.dueInDays * DAY_MS);
  return {
    id: inv.paypalInvoiceId ?? inv.id,
    clientName: inv.clientName,
    clientEmail: inv.clientEmail,
    amount: inv.amount,
    dueDate: dateOnly(due),
    issueDate: dateOnly(issued),
    status: INVOICE_STATUS[inv.status] ?? "Pending",
  };
}

const APPROVAL_STATUS: Record<string, ApprovalRequest["status"]> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

export function toUiApproval(a: PendingAction): ApprovalRequest {
  const p = a.payload as unknown as Partial<InvoiceDraft>;
  const amount = Number(p.amount ?? 0);
  const riskScore: ApprovalRequest["riskScore"] =
    amount > 5000 ? "High" : amount >= 2000 ? "Medium" : "Low";
  const created = (a as unknown as { createdAt?: string }).createdAt;

  return {
    id: a.id,
    invoiceId: "DRAFT-" + a.id.slice(0, 6).toUpperCase(),
    clientName: p.clientName ?? "Unknown client",
    amount,
    submissionDate: (created ?? new Date().toISOString()).slice(0, 10),
    aiSummary:
      a.type === "create_invoice"
        ? `AI drafted an invoice for "${p.description ?? "services"}", due in ${p.dueInDays ?? "?"} days. Approve to send it through PayPal.`
        : "AI drafted a payment reminder for your review.",
    riskScore,
    status: APPROVAL_STATUS[a.status] ?? "Pending",
  };
}

export function toUiReminders(invoices: Invoice[]): Reminder[] {
  return invoices
    .filter((i) => i.status === "sent" || i.status === "overdue")
    .slice(0, 6)
    .map((inv) => {
      const ui = toUiInvoice(inv);
      const overdue = inv.status === "overdue";
      return {
        id: "REM-" + inv.id,
        invoiceId: ui.id,
        clientName: inv.clientName,
        dueDate: ui.dueDate,
        scheduledTime: overdue ? "Today at 10:00 AM" : "Before the due date",
        message: overdue
          ? `Overdue notice for "${inv.description}" ($${inv.amount.toFixed(2)}).`
          : `Friendly reminder that "${inv.description}" ($${inv.amount.toFixed(2)}) is due soon.`,
        status: "Upcoming",
        channel: "Email",
      } as Reminder;
    });
}

type LogRow = { id: number; at: string; event: string; detail?: unknown };

const LOG_META: Record<string, { name: string; status: ActionStatus; text: string }> = {
  invoice_created_and_sent: { name: "Invoice Sent", status: "Success", text: "Invoice created and sent through PayPal after human approval." },
  pending_action_created: { name: "Approval Requested", status: "Warning", text: "AI drafted an action that needs human approval." },
  invoice_reminder_sent: { name: "Reminder Sent", status: "Info", text: "Payment reminder sent through PayPal." },
  paypal_create_invoice_error: { name: "API Request Failed", status: "Error", text: "PayPal could not create the invoice." },
  paypal_send_reminder_error: { name: "API Request Failed", status: "Error", text: "PayPal could not send the reminder." },
  mock_seed_initialized: { name: "Demo Data Loaded", status: "Info", text: "Demo data loaded for local testing." },
};

export function toUiLog(row: LogRow): ActionLog {
  const meta = LOG_META[row.event] ?? {
    name: row.event.replace(/_/g, " "),
    status: "Info" as ActionStatus,
    text: `System event: ${row.event}`,
  };
  const d = (row.detail ?? {}) as Record<string, unknown>;
  return {
    id: String(row.id),
    actionName: meta.name,
    relatedEntity: String(d.paypalInvoiceId ?? d.invoiceId ?? d.actionId ?? "System"),
    timestamp: new Date(row.at).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    status: meta.status,
    description: meta.text,
  };
}
