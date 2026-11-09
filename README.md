# PayPal AI Settlement Hub — Hackathon 2026

An enterprise-ready AI copilot and settlement management dashboard prototype built for the PayPal AI Hackathon 2026. This platform streamlines B2B invoicing, detects invoice billing anomalies, accelerates dispute & approval workflows, and manages automated settlement reminders.

---

## 1. Project Overview
B2B accounts payable and accounts receivable teams manually cross-verify hundreds of monthly invoices against contracts and billing histories. This creates reconciliation delays, payment disputes, and settlement bottlenecks. 

**PayPal AI Settlement Hub** provides an AI-augmented operations center where finance managers can review high-variance invoices, trigger automated settlement reminders, review automated audit logs, and query an integrated AI settlement assistant.

---

## 2. Problem Statement
- **Manual Dispute Resolution**: Invoices with billing variance (+30% or more) require manual cross-referencing against past purchase orders.
- **Fragmented Workflows**: Communication, approval actions, reminder notifications, and audit logging happen across disparate tools.
- **Slow Settlement Time**: Overdue accounts drag down cash flow due to lack of real-time visibility and automated prompt follow-ups.

---

## 3. Proposed Solution
A modern fintech dashboard inspired by PayPal's design system that:
1. Surfaces AI-evaluated high-priority invoices requiring human approval.
2. Displays real-time settlement line items with instant filtering and search.
3. Automatically triggers and displays scheduled payment reminders across Email, SMS, and PayPal Push.
4. Generates an immutable, real-time audit log of all financial and system actions.
5. Embeds an AI Copilot chat interface for rapid natural-language ledger queries.

---

## 4. Key Features
- **Summary Metrics**: Real-time calculation of total invoice volume, pending reviews, settled payments, and gross transaction values.
- **Approval Cards with AI Reasoning**: Cards highlight billing variance risk scores (Low/Medium) with automated explanations and single-click Approve/Reject actions.
- **Interactive Invoice Management Table**: Filter by payment status (`Paid`, `Pending`, `Processing`, `Overdue`, `Awaiting Approval`, `Failed`) or search across ID, client name, and email.
- **Payment Reminders Section**: View upcoming automated notices, delivery channels, and scheduled trigger times with one-click dismissal.
- **Real-Time Action & Audit Log**: Audit trail recording all approvals, rejections, reminder dismissals, and simulated gateway errors.
- **AI Copilot Panel**: Interactive chat interface with preset quick prompts (`"Which invoices need approval?"`, `"Show overdue payments"`).
- **Graceful Error & Loading States**: Skeletons, empty-state illustrations, disabled button loading states, and error banners with working retry buttons.

---

## 5. Technology Stack
- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Library**: [React](https://react.dev/) (Client Components & Hooks)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Architecture**: Modular component structure with isolated data and API abstraction layers

---

## 6. Project Folder Structure
```text
paypal_ai_hackathon/
├── app/
│   ├── globals.css         # Custom scrollbars, Tailwind directives, theme colors
│   ├── layout.tsx          # Root HTML layout and metadata
│   └── page.tsx            # Main dashboard controller and state orchestration
├── components/
│   ├── ActionLogView.tsx   # Activity timeline and audit record table
│   ├── ApprovalCard.tsx    # High-priority approval card with AI risk scoring
│   ├── ChatPanel.tsx       # AI Settlement Copilot interface
│   ├── DashboardStats.tsx  # Dynamic metric cards calculated from active ledger
│   ├── EmptyState.tsx      # Reusable empty-state display
│   ├── ErrorState.tsx      # Reusable error banner with retry trigger
│   ├── Header.tsx          # Navigation header with search and mobile toggle
│   ├── InvoiceTable.tsx    # Responsive table with modal detail preview
│   ├── ReminderList.tsx    # Scheduled payment reminders and dismiss action
│   ├── Sidebar.tsx         # Responsive desktop/mobile navigation
│   └── StatusBadge.tsx     # Centralized, accessible status pills
├── data/
│   └── mockData.ts         # TypeScript interfaces and realistic sample datasets
├── services/
│   └── api.ts              # API fetch service with seamless mock fallback toggle
├── DEMO_SCRIPT.md          # 3-5 minute hackathon presentation script
├── README.md               # Project documentation
├── tailwind.config.ts      # PayPal blue palette theme configuration
└── tsconfig.json           # Strict TypeScript configuration