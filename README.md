# PayPilot - Payments & Backend Architecture

PayPilot is an AI invoicing assistant built for the PayPal AI Hackathon. This repository contains the backend and payments layer (Person A), interfacing directly with PayPal Invoicing API v2, Neon serverless Postgres, and exposing a strongly-typed contract for the AI agent (Person B) and frontend (Person C).

---

## Shared Contract & Architectural Flow

The backend enforces a strict human-in-the-loop guarantee: **the AI agent can never directly dispatch funds or invoices to PayPal**.

```
[User Request]
       │
       ▼
[AI Agent (Person B)] ───► POST /api/actions (creates pending action)
                                  │
                                  ▼
[Dashboard UI (Person C)] ◄── Human reviews & clicks Approve / Reject
                                  │
                                  ▼
                      POST /api/actions/[id]/approve
                                  │
                                  ▼
                    [lib/paypal.ts (Person A)]
                                  │
                                  ▼
                      [PayPal Invoicing API v2]
```

---

## Backend Setup

### 1. PayPal Developer Sandbox Configuration
1. **Log in to Developer Dashboard**: Go to [developer.paypal.com](https://developer.paypal.com) and sign in.
2. **Sandbox Accounts**:
   - Navigate to **Testing Tools** > **Sandbox Accounts**.
   - Ensure you have a **Business account** (merchant / invoicer) and a **Personal account** (buyer / client).
   - In the Business account settings, confirm that **Invoicing** is enabled.
3. **Create REST App**:
   - Go to **Apps & Credentials** > select **Sandbox** mode > click **Create App**.
   - App Name: `PayPilot-Backend`.
   - Select your Sandbox Business account.
   - Copy the **Client ID** and **Client Secret**.
4. **Configure Webhook**:
   - In your REST App page, scroll down to **Webhooks** and click **Add Webhook**.
   - **Webhook URL**: Enter your deployed production URL + `/api/webhooks/paypal` (e.g. `https://your-paypilot-app.vercel.app/api/webhooks/paypal`). For local webhook testing, use a tunnel like ngrok.
   - **Event Types**: Select `INVOICING.INVOICE.PAID` and `INVOICING.INVOICE.CANCELLED`.
   - Save the webhook and copy the generated **Webhook ID** (`PAYPAL_WEBHOOK_ID`).

### 2. Environment Variables (.env)
Create a `.env` file in the root directory (never commit this file):

```env
# PayPal Sandbox Credentials
PAYPAL_CLIENT_ID=your_sandbox_client_id_here
PAYPAL_CLIENT_SECRET=your_sandbox_client_secret_here
PAYPAL_BASE_URL=https://api-m.sandbox.paypal.com
PAYPAL_WEBHOOK_ID=your_paypal_webhook_id_here

# Neon Postgres (Serverless)
# If left empty, PayPilot automatically falls back to an in-memory store for local development
DATABASE_URL=postgresql://user:password@ep-sample-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require

# Mock Mode (Set to true to develop/test without hitting live PayPal endpoints)
USE_MOCKS=false

# Invoicer Details
INVOICER_EMAIL=billing@paypilot.example.com
INVOICER_NAME=PayPilot Billing
DEFAULT_CURRENCY=USD
```

---

## Vercel Deployment Guide

1. **Push to GitHub**:
   Ensure your code is pushed to your remote repository on GitHub:
   ```bash
   git push origin feat/payments
   ```

2. **Connect to Vercel**:
   - Log into [vercel.com](https://vercel.com) and click **Add New Project**.
   - Import your PayPilot repository.
   - Framework Preset: **Next.js**.
   - Root Directory: `./` (or directory where `package.json` is located).

3. **Configure Environment Variables**:
   In Vercel project settings, add the following variables:
   - `PAYPAL_CLIENT_ID`
   - `PAYPAL_CLIENT_SECRET`
   - `PAYPAL_BASE_URL` (`https://api-m.sandbox.paypal.com`)
   - `DATABASE_URL` (Neon Postgres connection string)
   - `USE_MOCKS` (`false`)
   - `INVOICER_EMAIL`
   - `INVOICER_NAME`
   - `DEFAULT_CURRENCY` (`USD`)

4. **Deploy**:
   - Click **Deploy**. Vercel will execute `next build` and deploy the serverless functions.

5. **Register Webhook & Set Webhook ID**:
   - Once deployed, copy your production domain (e.g., `https://paypilot-ai.vercel.app`).
   - In PayPal Developer Dashboard under your app, add/update the webhook endpoint:
     `https://paypilot-ai.vercel.app/api/webhooks/paypal`
   - Subscribe to `INVOICING.INVOICE.PAID` and `INVOICING.INVOICE.CANCELLED`.
   - Copy the Webhook ID and set `PAYPAL_WEBHOOK_ID` in Vercel Environment Variables.
   - Trigger a redeployment in Vercel to load the new webhook ID.

6. **Live Test**:
   Verify your live production deployment using curl:
   ```bash
   curl -s https://paypilot-ai.vercel.app/api/invoices
   ```

---

## Local Development & Testing

### Running in Mock Mode
```bash
USE_MOCKS=true npm run dev
```

### Day 1 Sandbox Invoice Test Script
Creates and sends a sandbox invoice end to end, printing the invoice ID and recipient view link:
```bash
npx tsx scripts/day1-invoice.ts
```

### Smoke Test Suite
Executes end-to-end integration tests across all API endpoints, validation guardrails, approval idempotency, and webhook verification:
```bash
# Cross-platform tsx test runner
npm test

# Shell-based curl runner (for CI/CD or Unix environments)
bash scripts/smoke.sh
```

---

## API Reference Summary

- `GET /api/invoices`: Returns list of invoices (newest first). Automatically performs best-effort PayPal status synchronization for sent/overdue invoices.
- `GET /api/invoices/[id]`: Returns a single invoice by ID (404 if missing).
- `GET /api/actions?status=pending`: Returns pending actions awaiting human approval.
- `POST /api/actions`: Creates a new pending action (`create_invoice` or `send_reminder`).
- `POST /api/actions/[id]/approve`:
  - Validates draft fields (email format, amount $0.01–$10,000, dueInDays 1–90).
  - Dispatches invoice or reminder via PayPal Invoicing API v2.
  - Idempotent: Approving an already-resolved action returns HTTP 409 Conflict.
- `POST /api/actions/[id]/reject`: Rejects the pending action and logs the event.
- `GET /api/logs`: Returns latest 50 action log events for audit trail and observability.
- `POST /api/webhooks/paypal`: Validates PayPal cryptographic signature header and processes invoice events idempotently.

---

## License
MIT
