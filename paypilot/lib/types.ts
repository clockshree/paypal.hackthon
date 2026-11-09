export type InvoiceDraft = {
  clientName: string;
  clientEmail: string;
  description: string;
  amount: number;
  dueInDays: number;
};

export type ValidationResult = {
  ok: boolean;
  missing: (keyof InvoiceDraft)[];
  errors: string[];
};
export type PendingActionType = "create_invoice" | "send_reminder";
export type PendingStatus = "pending" | "approved" | "rejected";

export type PendingAction = {
  id: string;
  type: PendingActionType;
  payload: Record<string, unknown>;
  status: PendingStatus;
  createdAt: string;
  decidedAt?: string;
};