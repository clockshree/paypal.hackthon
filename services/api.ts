// services/api.ts
import { 
  Invoice, 
  ApprovalRequest, 
  Reminder, 
  ActionLog, 
  INITIAL_INVOICES, 
  INITIAL_APPROVALS, 
  INITIAL_REMINDERS, 
  INITIAL_ACTION_LOGS 
} from '@/data/mockData';

// TOGGLE: Change this to `false` once backend endpoints are live.
export const USE_MOCK_FALLBACK = false;

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';

/**
 * 1. Fetch Invoices
 * Placeholder endpoint: GET /api/invoices
 */
export async function getInvoices(): Promise<Invoice[]> {
  if (USE_MOCK_FALLBACK) {
    await new Promise((res) => setTimeout(res, 600));
    return [...INITIAL_INVOICES];
  }

  const response = await fetch(`${API_BASE_URL}/invoices`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Failed to load invoices (${response.status}): ${response.statusText}`);
  }

  return response.json();
}

/**
 * 2. Fetch Approval Requests
 * Placeholder endpoint: GET /api/approvals
 */
export async function getApprovals(): Promise<ApprovalRequest[]> {
  if (USE_MOCK_FALLBACK) {
    await new Promise((res) => setTimeout(res, 600));
    return [...INITIAL_APPROVALS];
  }

  const response = await fetch(`${API_BASE_URL}/approvals`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Failed to load approvals (${response.status}): ${response.statusText}`);
  }

  return response.json();
}

/**
 * 3. Update Approval Action (Approve / Reject)
 * Placeholder endpoint: POST /api/approvals/:id/decision
 */
export async function submitApprovalDecision(
  approvalId: string,
  decision: 'approve' | 'reject'
): Promise<{ success: boolean; status: 'Approved' | 'Rejected' }> {
  if (USE_MOCK_FALLBACK) {
    await new Promise((res) => setTimeout(res, 800));
    return {
      success: true,
      status: decision === 'approve' ? 'Approved' : 'Rejected',
    };
  }

  const response = await fetch(`${API_BASE_URL}/approvals/${approvalId}/decision`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ decision }),
  });

  if (!response.ok) {
    throw new Error(`Failed to submit decision: ${response.statusText}`);
  }

  return response.json();
}

/**
 * 4. Fetch Reminders
 * Placeholder endpoint: GET /api/reminders
 */
export async function getReminders(): Promise<Reminder[]> {
  if (USE_MOCK_FALLBACK) {
    await new Promise((res) => setTimeout(res, 500));
    return [...INITIAL_REMINDERS];
  }

  const response = await fetch(`${API_BASE_URL}/reminders`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Failed to load reminders (${response.status}): ${response.statusText}`);
  }

  return response.json();
}

/**
 * 5. Fetch Action Logs
 * Placeholder endpoint: GET /api/action-logs
 */
export async function getActionLogs(): Promise<ActionLog[]> {
  if (USE_MOCK_FALLBACK) {
    await new Promise((res) => setTimeout(res, 500));
    return [...INITIAL_ACTION_LOGS];
  }

  const response = await fetch(`${API_BASE_URL}/action-logs`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Failed to load action history (${response.status}): ${response.statusText}`);
  }

  return response.json();
}