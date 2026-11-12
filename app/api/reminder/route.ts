import { draftReminder } from "../../../lib/reminders";
import type { ReminderTone } from "../../../lib/reminders";
import { MAX_AMOUNT } from "../../../lib/guardrails";

const TONES: ReminderTone[] = ["friendly", "professional", "firm"];

export async function POST(request: Request) {
  let data: Record<string, unknown>;
  try {
    data = await request.json();
  } catch {
    return Response.json({ error: "Send valid JSON." }, { status: 400 });
  }

  const { clientName, description, amount, daysOverdue, tone, freelancerName } = data ?? {};

  if (typeof clientName !== "string" || !clientName.trim() || clientName.length > 100) {
    return Response.json({ error: "clientName is required." }, { status: 400 });
  }
  if (typeof description !== "string" || !description.trim() || description.length > 200) {
    return Response.json({ error: "description is required." }, { status: 400 });
  }
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0 || amount > MAX_AMOUNT) {
    return Response.json({ error: "amount must be a valid positive number." }, { status: 400 });
  }
  if (typeof daysOverdue !== "number" || !Number.isInteger(daysOverdue) || daysOverdue < 1 || daysOverdue > 365) {
    return Response.json({ error: "daysOverdue must be a whole number from 1 to 365." }, { status: 400 });
  }
  if (typeof tone !== "string" || !TONES.includes(tone as ReminderTone)) {
    return Response.json({ error: "tone must be friendly, professional or firm." }, { status: 400 });
  }
  if (freelancerName !== undefined && (typeof freelancerName !== "string" || freelancerName.length > 60)) {
    return Response.json({ error: "freelancerName is invalid." }, { status: 400 });
  }

  const draft = await draftReminder({
    clientName: clientName.trim(),
    description: description.trim(),
    amount,
    daysOverdue,
    tone: tone as ReminderTone,
    freelancerName: freelancerName?.trim() || undefined,
  });

  return Response.json({
    ...draft,
    reply: "Here is your reminder draft. Please review it before sending.",
  });
}