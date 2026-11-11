export type InvoiceStatus = "draft" | "pending_approval" | "sent" | "paid" | "overdue";

export interface InvoiceDraft {
  clientName: string;
  clientEmail: string;
  description: string;
  amount: number;
  dueInDays: number;
}

export interface Invoice extends InvoiceDraft {
  id: string;
  paypalInvoiceId: string | null;
  status: InvoiceStatus;
  createdAt: string;
}

export type PendingActionType = "create_invoice" | "send_reminder";

export type PendingActionStatus = "pending" | "approved" | "rejected";

export interface PendingAction {
  id: string;
  type: PendingActionType;
  payload: InvoiceDraft | { invoiceId: string; message: string; tone?: string };
  status: PendingActionStatus;
}
export type ValidationResult = {
  ok: boolean;
  missing: (keyof InvoiceDraft)[];
  errors: string[];
};