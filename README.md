# PayPilot: an AI invoicing agent for freelancers

Type a request in plain English, like *"Bill Acme $450 for the logo, due in 14 days"*. PayPilot's AI turns it into an invoice draft, checks it, asks for anything missing, and waits for **your approval** before creating and sending a real invoice through the **PayPal Invoicing API** (sandbox).

Built for the PayPal AI Hackathon.

## How PayPal and AI work together

1. **Understand.** Google Gemini reads the request and extracts the client, email, description, amount and due date. Anything not stated stays empty, and the model is told never to invent an email.
2. **Check.** Plain code validates every field (valid email, amount above 0 and under a safety limit, due date within 90 days). Missing or invalid details are sent back to the user as a question.
3. **Approve.** A complete draft is stored as a *pending action*. Nothing happens until the freelancer clicks Approve, and an action can be approved only once, which prevents duplicate invoices.
4. **Pay.** On approval, the backend calls PayPal's Invoicing API v2 to create and send the invoice. The client receives a PayPal invoice and pays it.
5. **Track and remind.** Invoices and an audit log are stored and shown in the dashboard. An endpoint drafts friendly, professional or firm payment reminders with Gemini, with a built-in fallback message if the AI is slow.

The AI only proposes. A human approves, and separate code validates, before any money-related action runs.

## Tech stack

- Next.js 16 and React 19 with Tailwind CSS (dashboard and API routes in one app)
- Google Gemini through `@google/genai` (model set in `lib/config.ts`)
- PayPal Invoicing REST API v2, sandbox (`lib/paypal.ts`)
- Neon Postgres through `@neondatabase/serverless`, with an in-memory fallback when no database URL is set (`lib/db.ts`)

## Run it locally

1. Install Node.js 20 or newer, then run:

   ```
   npm install
   ```

2. Copy `.env.example` to `.env.local` and fill it in:
   - `GEMINI_API_KEY`: a free key from aistudio.google.com.
   - **Quick start without PayPal keys:** keep `USE_MOCKS=true`. PayPal responses are simulated, and the dashboard shows demo data.
   - **Real PayPal sandbox:** set `USE_MOCKS=false` and add `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` from a sandbox app that belongs to a **United States** business sandbox account with **Invoicing** enabled under Features. Leave `INVOICER_EMAIL` blank. Bill a **US personal sandbox account** (PayPal cannot send invoices to Indian accounts).

3. Start the app and open http://localhost:3000:

   ```
   npm run dev
   ```

4. In the AI Copilot, type: `Invoice Sarah (sarah@example.com) 1200 dollars for website design, net 30`, then click **Approve**.

## API overview

| Endpoint | Purpose |
|---|---|
| `POST /api/chat` | Natural-language request in, draft invoice and `actionId` out |
| `POST /api/actions/{id}/approve` | Approve a pending action and run it (creates and sends the PayPal invoice) |
| `POST /api/actions/{id}/reject` | Reject a pending action |
| `GET /api/invoices`, `GET /api/logs` | Stored invoices and the audit log |
| `POST /api/reminder` | Draft a payment reminder (friendly, professional or firm) |
| `POST /api/webhooks/paypal` | Receives PayPal payment events (signature verified) |
| `GET /api/ui/*` | Reshapes the data for the dashboard |

## Safety by design

- Human approval before any invoice is sent, and one approval per action.
- Validation in plain code: email format, amount limits, due-date range, message length.
- The AI is instructed to ignore instructions inside user messages. Test script: `npx tsx --env-file=.env.local scripts/test-scenarios.ts`.
- Timeouts, retries and fallbacks so a slow AI service does not freeze the app.
- Secrets live only in `.env.local`, which is never committed.

## Current limits (honest notes)

- PayPal runs in **sandbox** only, so no real money moves.
- The webhook that marks invoices as paid needs a public URL, so it is built but not exercised in local runs. Payment can be seen in the PayPal sandbox invoice page.
- Without `DATABASE_URL`, data is kept in memory and resets when the server restarts.

## Team

- **@clockshree:** AI agent, validation, reminders and integration
- **Shreya H N:** dashboard and frontend
- **@varshinim-19:** PayPal integration and database layer

Released under the MIT License.