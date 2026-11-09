# paypal.hackthon
PayPilot is an AI-powered invoicing agent that helps freelancers create, send, and track PayPal invoices using simple natural language commands. It automates payment reminders and simplifies invoice management.
## AI Agent (PayPilot's brain)

PayPilot lets a freelancer type a request like *"Bill Acme $450 for the logo, due in 14 days"*. The AI agent turns it into a structured invoice draft, checks it, and prepares it for **human approval**. The AI never takes a money-related action on its own.

### How it works

1. **Understand:** `lib/agent.ts` sends the message to Google Gemini and asks for five fields: client name, client email, description, amount, due days. Anything not stated is left empty, and the AI is told never to invent an email address.
2. **Check:** `lib/guardrails.ts` validates the draft with plain code: valid email, amount greater than 0 and under the safety limit, due days between 1 and 90.
3. **Ask:** if something is missing, the app asks for exactly what is missing. If something is invalid, it explains why.
4. **Approve:** a complete draft is saved as a *pending action*. Nothing runs until the user clicks Approve (`lib/pending.ts`). Each action can be approved or rejected only once, which prevents duplicate invoices.
5. **Execute:** `lib/executor.ts` runs the approved action. This is where the PayPal invoice is created.
6. **Remind:** `lib/reminders.ts` drafts payment reminders in a friendly, professional or firm tone. The reply must contain the exact amount, and a built-in backup message is used if the AI is slow or unavailable.

### API endpoints

| Method and path | What it does |
|---|---|
| `POST /api/chat` | Body: `{ "message": "..." }`. Returns `status` (`ready`, `needs_info` or `invalid`), a `reply`, the `draft`, and an `actionId` when the draft is ready. |
| `POST /api/actions/{id}/approve` | Approves the pending action and runs it. Returns 409 if it was already decided. |
| `POST /api/actions/{id}/reject` | Rejects the pending action. |
| `POST /api/reminder` | Body: client name, description, amount, days overdue, tone. Returns a reminder `subject` and `body` to review before sending. |

### Safety by design

- Human approval is required before any invoice is created.
- The AI only proposes. Separate code validates every field before it can be used.
- Message length and every input field are limited and checked.
- AI calls have timeouts, retries and a fallback, so a slow AI service never freezes the app.
- API keys live only in a server-side `.env.local` file and are never committed.

### Run the AI part locally

1. Install Node.js, then run `npm install` inside the `paypilot` folder.
2. Get a free key from aistudio.google.com and create `paypilot/.env.local` containing `GEMINI_API_KEY=your-key`. Never commit this file.
3. Run `npm run dev` and open http://localhost:3000.
4. Test the scripts (optional): `npx tsx --env-file=.env.local scripts/test-agent.ts`, `scripts/test-reminder.ts` and `scripts/test-pending.ts`.

The AI model name is set in one place: `paypilot/lib/config.ts`.