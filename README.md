
# PayPal AI Settlement Hub — PayPilot | Hackathon 2026

An AI-powered invoicing and settlement management platform built for the PayPal AI Hackathon 2026. PayPilot helps freelancers and finance teams manage invoices, review payment actions, generate reminders, and simplify financial workflows using natural language.

## 1. Project Overview

Managing invoices, tracking payments, resolving billing disputes, and following up on overdue payments can be time-consuming.

PayPal AI Settlement Hub provides a dashboard and AI-powered assistant to simplify these tasks. Users can review invoices, monitor payment statuses, generate reminders, and interact with an AI agent that prepares invoice actions for human approval.

## 2. Problem Statement

- **Manual Invoice Management:** Creating and tracking invoices requires repetitive work.
- **Fragmented Workflows:** Invoice approvals, reminders, and payment tracking happen across different tools.
- **Slow Payment Follow-ups:** Overdue invoices can affect cash flow.
- **Billing Errors:** Incorrect invoice details can lead to disputes and delays.

## 3. Proposed Solution

The platform combines an interactive settlement dashboard with an AI invoicing agent.

1. Displays invoice information and payment statuses.
2. Helps users identify invoices requiring attention.
3. Allows users to interact with an AI assistant using natural language.
4. Prepares invoice actions for human approval.
5. Generates payment reminder messages.
6. Maintains an action and audit log.

## 4. Frontend Dashboard Features

- **Summary Metrics:** Displays invoice volume, pending reviews, settled payments, and transaction values.
- **Approval Cards:** Shows invoice details and actions requiring review.
- **Invoice Management Table:** Supports invoice search and payment-status filtering.
- **Payment Reminders:** Displays scheduled reminders and delivery channels.
- **Action & Audit Log:** Records approvals, rejections, and reminder dismissals.
- **AI Copilot Panel:** Provides a chat interface for invoice-related queries.
- **Loading and Error States:** Includes loading indicators, empty states, and retry options.

## 5. AI Agent — PayPilot's Brain

PayPilot allows a freelancer to enter a request such as:

"Bill Acme $450 for the logo, due in 14 days."

The AI agent converts the request into a structured invoice draft and checks the details. The invoice is not created until the user approves it.

### How It Works

1. **Understand:** `lib/agent.ts` sends the user's message to Google Gemini and extracts invoice details.
2. **Check:** `lib/guardrails.ts` validates the email, amount, and due date.
3. **Ask:** If information is missing or invalid, the agent asks the user for clarification.
4. **Approve:** A complete draft is saved as a pending action using `lib/pending.ts`.
5. **Execute:** `lib/executor.ts` handles the approved action.
6. **Remind:** `lib/reminders.ts` generates payment reminder messages.

### API Endpoints

| Method and path | Purpose |
|---|---|
| `POST /api/chat` | Processes the user's natural-language request. |
| `POST /api/actions/{id}/approve` | Approves and executes a pending action. |
| `POST /api/actions/{id}/reject` | Rejects a pending action. |
| `POST /api/reminder` | Generates a payment reminder message. |

### Safety Features

- Human approval is required before an invoice action is executed.
- Separate validation code checks the invoice details.
- Input fields and message lengths are restricted.
- AI calls use timeouts, retries, and fallback responses.
- API keys are stored in server-side environment variables.

## 6. Technology Stack

- **Framework:** Next.js
- **Frontend Library:** React
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **AI Model:** Google Gemini
- **Icons:** Lucide React
- **Version Control:** Git and GitHub

## 7. Project Structure

```text
paypal_ai_hackathon/
├── app/
├── components/
├── data/
├── services/
├── DEMO_SCRIPT.md
├── README.md
├── package.json
└── paypilot/
    ├── app/
    │   └── api/
    │       ├── actions/
    │       ├── chat/
    │       └── reminder/
    ├── lib/
    │   ├── agent.ts
    │   ├── config.ts
    │   ├── executor.ts
    │   ├── guardrails.ts
    │   ├── pending.ts
    │   ├── reminders.ts
    │   ├── timeout.ts
    │   └── types.ts
    ├── scripts/
    ├── package.json
    └── README.md
```

## 8. Running the AI Agent

1. Install Node.js.
2. Open the `paypilot` folder in the terminal.
3. Install dependencies:

```bash
npm install
```

4. Create a `.env.local` file inside `paypilot` and add:

```env
GEMINI_API_KEY=your-key
```

5. Start the application:

```bash
npm run dev
```

6. Open `http://localhost:3000`.

Get a Gemini API key from https://aistudio.google.com/.

Never commit your API key or share it publicly.

## 9. Future Enhancements

- Integration with live PayPal invoice and payment services.
- Improved invoice analytics and anomaly detection.
- Automated payment tracking and notifications.
- Enhanced AI-powered financial insights.

## 10. Conclusion

PayPal AI Settlement Hub combines an interactive invoice dashboard with an AI-powered invoicing assistant. By simplifying invoice creation, approval, and payment follow-ups, PayPilot aims to make financial workflows more efficient while keeping important actions under human control.
