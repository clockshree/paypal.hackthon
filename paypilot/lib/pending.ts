import { randomUUID } from "node:crypto";
import type { PendingAction, PendingActionType } from "./types";

// A temporary in-memory list. Person A can swap this for a real database later;
// the function names below stay the same, so nothing else has to change.
// (globalThis keeps the list alive while the dev server reloads files.)
const g = globalThis as unknown as {
  __pendingActions?: Map<string, PendingAction>;
};
const store = (g.__pendingActions ??= new Map<string, PendingAction>());

export function createPending(
  type: PendingActionType,
  payload: Record<string, unknown>
): PendingAction {
  const action: PendingAction = {
    id: randomUUID(),
    type,
    payload,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  store.set(action.id, action);
  return action;
}

export function getPending(id: string): PendingAction | undefined {
  return store.get(id);
}

export function listPending(): PendingAction[] {
  return Array.from(store.values());
}

export type DecisionResult =
  | { ok: true; action: PendingAction }
  | { ok: false; error: string };

// Approve or reject, but only once. A second attempt is refused.
export function decide(
  id: string,
  decision: "approved" | "rejected"
): DecisionResult {
  const action = store.get(id);
  if (!action) return { ok: false, error: "Action not found." };
  if (action.status !== "pending") {
    return { ok: false, error: `Action was already ${action.status}.` };
  }
  action.status = decision;
  action.decidedAt = new Date().toISOString();
  return { ok: true, action };
}