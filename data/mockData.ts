// data/mockData.ts

export type InvoiceStatus =
  | 'Paid'
  | 'Pending'
  | 'Overdue'
  | 'Awaiting Approval'
  | 'Processing'
  | 'Failed';

export interface Invoice {
  id: string;
  clientName: string;
  clientEmail: string;
  amount: number;
  dueDate: string;
  issueDate: string;
  status: InvoiceStatus;
}

export type ApprovalStatus =
  | 'Pending'
  | 'Approved'
  | 'Rejected'
  | 'Processing'
  | 'Failed';

export interface ApprovalRequest {
  id: string;
  invoiceId: string;
  clientName: string;
  amount: number;
  submissionDate: string;
  aiSummary: string;
  riskScore: 'Low' | 'Medium' | 'High';
  status: ApprovalStatus;
}

export interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
}

// --- Day 3 Additions ---

export type ReminderStatus = 'Upcoming' | 'Sent' | 'Failed' | 'Dismissed';

export interface Reminder {
  id: string;
  invoiceId: string;
  clientName: string;
  dueDate: string;
  scheduledTime: string;
  message: string;
  status: ReminderStatus;
  channel: 'Email' | 'SMS' | 'PayPal Push';
}

export type ActionStatus = 'Success' | 'Warning' | 'Error' | 'Info';

export interface ActionLog {
  id: string;
  actionName: string;
  relatedEntity: string;
  timestamp: string;
  status: ActionStatus;
  description: string;
}

export const INITIAL_INVOICES: Invoice[] = [
  {
    id: 'INV-2026-001',
    clientName: 'Acme Cloud Technologies',
    clientEmail: 'billing@acmecloud.io',
    amount: 14500.0,
    dueDate: '2026-11-15',
    issueDate: '2026-10-15',
    status: 'Paid',
  },
  {
    id: 'INV-2026-002',
    clientName: 'Starlight Global Logistics',
    clientEmail: 'accounts@starlight.com',
    amount: 8320.5,
    dueDate: '2026-11-20',
    issueDate: '2026-10-20',
    status: 'Pending',
  },
  {
    id: 'INV-2026-003',
    clientName: 'Nexis Enterprise AI',
    clientEmail: 'finance@nexis.ai',
    amount: 22400.0,
    dueDate: '2026-11-02',
    issueDate: '2026-10-02',
    status: 'Overdue',
  },
  {
    id: 'INV-2026-004',
    clientName: 'BlueSky Media Group',
    clientEmail: 'payables@blueskymedia.co',
    amount: 5600.0,
    dueDate: '2026-11-25',
    issueDate: '2026-10-25',
    status: 'Awaiting Approval',
  },
  {
    id: 'INV-2026-005',
    clientName: 'Vanguard Health Systems',
    clientEmail: 'invoices@vanguardhealth.org',
    amount: 34150.0,
    dueDate: '2026-11-30',
    issueDate: '2026-10-30',
    status: 'Paid',
  },
  {
    id: 'INV-2026-006',
    clientName: 'FinPulse Software Labs',
    clientEmail: 'ops@finpulse.dev',
    amount: 11200.0,
    dueDate: '2026-11-18',
    issueDate: '2026-10-18',
    status: 'Processing',
  },
  {
    id: 'INV-2026-007',
    clientName: 'Hyperion Analytics',
    clientEmail: 'billing@hyperion.net',
    amount: 7850.0,
    dueDate: '2026-10-28',
    issueDate: '2026-09-28',
    status: 'Failed',
  },
];

export const INITIAL_APPROVALS: ApprovalRequest[] = [
  {
    id: 'APP-101',
    invoiceId: 'INV-2026-004',
    clientName: 'BlueSky Media Group',
    amount: 5600.0,
    submissionDate: '2026-11-04',
    aiSummary: 'Recurring quarterly retainer for promotional deliverables. PO and line items match previous 3 statements.',
    riskScore: 'Low',
    status: 'Pending',
  },
  {
    id: 'APP-102',
    invoiceId: 'INV-2026-006',
    clientName: 'FinPulse Software Labs',
    amount: 11200.0,
    submissionDate: '2026-11-05',
    aiSummary: 'First-time billing under enterprise tier. High variance (+38%) compared to default estimation schedule.',
    riskScore: 'Medium',
    status: 'Pending',
  },
];

export const INITIAL_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-1',
    sender: 'ai',
    text: "Hello! I am your PayPal AI Settlement Assistant. I have analyzed your ledger: 2 invoices need approval and 1 failed reconciliation. How can I assist you today?",
    timestamp: '09:30 AM',
  },
  {
    id: 'msg-2',
    sender: 'user',
    text: 'Can you summarize pending approvals?',
    timestamp: '09:32 AM',
  },
  {
    id: 'msg-3',
    sender: 'ai',
    text: 'You have 2 pending approval requests totaling $16,800.00. BlueSky Media Group ($5,600) is standard risk, whereas FinPulse Labs ($11,200) contains a +38% contract variance flag.',
    timestamp: '09:32 AM',
  },
];

export const INITIAL_REMINDERS: Reminder[] = [
  {
    id: 'REM-301',
    invoiceId: 'INV-2026-003',
    clientName: 'Nexis Enterprise AI',
    dueDate: '2026-11-02',
    scheduledTime: 'Today at 02:00 PM',
    message: 'Automated 7-day past-due notice with updated late charge calculation.',
    status: 'Upcoming',
    channel: 'Email',
  },
  {
    id: 'REM-302',
    invoiceId: 'INV-2026-002',
    clientName: 'Starlight Global Logistics',
    dueDate: '2026-11-20',
    scheduledTime: 'Tomorrow at 10:00 AM',
    message: 'Pre-due date reminder for settlement invoice $8,320.50 via PayPal Rail.',
    status: 'Upcoming',
    channel: 'Email',
  },
  {
    id: 'REM-303',
    invoiceId: 'INV-2026-007',
    clientName: 'Hyperion Analytics',
    dueDate: '2026-10-28',
    scheduledTime: 'Yesterday at 04:30 PM',
    message: 'Direct ACH webhook failure notification and retry link.',
    status: 'Sent',
    channel: 'PayPal Push',
  },
];

export const INITIAL_ACTION_LOGS: ActionLog[] = [
  {
    id: 'LOG-001',
    actionName: 'Invoice Status Changed',
    relatedEntity: 'INV-2026-001 (Acme Cloud)',
    timestamp: 'Nov 8, 2026 • 09:15 AM',
    status: 'Success',
    description: 'Payment settled successfully via PayPal Corporate Gateway.',
  },
  {
    id: 'LOG-002',
    actionName: 'Approval Requested',
    relatedEntity: 'APP-102 (FinPulse Software)',
    timestamp: 'Nov 8, 2026 • 08:45 AM',
    status: 'Warning',
    description: 'AI model flagged +38% variance above average billing profile.',
  },
  {
    id: 'LOG-003',
    actionName: 'Reminder Sent',
    relatedEntity: 'REM-303 (Hyperion Analytics)',
    timestamp: 'Nov 7, 2026 • 04:30 PM',
    status: 'Info',
    description: 'Automated push alert dispatched for overdue payment notice.',
  },
  {
    id: 'LOG-004',
    actionName: 'API Request Failed',
    relatedEntity: 'INV-2026-007 (Hyperion Analytics)',
    timestamp: 'Nov 7, 2026 • 04:29 PM',
    status: 'Error',
    description: 'ACH direct debit gateway timed out after 3 retry attempts.',
  },
];