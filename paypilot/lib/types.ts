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