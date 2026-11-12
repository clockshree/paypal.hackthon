import type { InvoiceDraft, ValidationResult } from "./types";

export const MAX_AMOUNT = 10000;
export const MAX_DUE_DAYS = 90;

export function validateDraft(draft: Partial<InvoiceDraft>): ValidationResult {
  const missing: ValidationResult["missing"] = [];
  const errors: string[] = [];

  if (!draft.clientName || !draft.clientName.trim()) {
    missing.push("clientName");
  }

  if (!draft.clientEmail || !draft.clientEmail.trim()) {
    missing.push("clientEmail");
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.clientEmail)) {
    errors.push("The client email does not look valid.");
  }

  if (!draft.description || !draft.description.trim()) {
    missing.push("description");
  }

  if (draft.amount == null) {
    missing.push("amount");
  } else if (typeof draft.amount !== "number" || !Number.isFinite(draft.amount)) {
    errors.push("The amount must be a number.");
  } else if (draft.amount <= 0) {
    errors.push("The amount must be greater than 0.");
  } else if (draft.amount > MAX_AMOUNT) {
    errors.push(`The amount is above the safety limit of $${MAX_AMOUNT}.`);
  }

  if (draft.dueInDays == null) {
    missing.push("dueInDays");
  } else if (
    !Number.isInteger(draft.dueInDays) ||
    draft.dueInDays < 1 ||
    draft.dueInDays > MAX_DUE_DAYS
  ) {
    errors.push(`Due days must be a whole number from 1 to ${MAX_DUE_DAYS}.`);
  }

  return { ok: missing.length === 0 && errors.length === 0, missing, errors };
}