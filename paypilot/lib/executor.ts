import type { PendingAction } from "./types";

export type ExecutionResult = {
  mode: "simulated" | "paypal";
  message: string;
  invoiceId?: string;
};

// PERSON A: this is where the real PayPal call goes.
// Replace the "create_invoice" branch with createAndSendInvoice(...)
// and return { mode: "paypal", invoiceId, message }.
export async function executeAction(action: PendingAction): Promise<ExecutionResult> {
  if (action.type === "create_invoice") {
    return {
      mode: "simulated",
      invoiceId: "DEMO-" + action.id.slice(0, 8),
      message: "Invoice created in demo mode. PayPal is not connected yet.",
    };
  }
  return {
    mode: "simulated",
    message: "Reminder marked as sent in demo mode.",
  };
}