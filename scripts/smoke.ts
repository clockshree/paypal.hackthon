import http from "http";
import { spawn, ChildProcess } from "child_process";

const PORT = 3005;
const BASE_URL = `http://127.0.0.1:${PORT}`;

let serverProcess: ChildProcess | null = null;
let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, details?: any) {
  if (condition) {
    console.log(` PASS: ${testName}`);
    passed++;
  } else {
    console.error(` FAIL: ${testName}`, details ? details : "");
    failed++;
  }
}

async function request(
  method: string,
  path: string,
  body?: any,
  headers?: Record<string, string>
): Promise<{ status: number; data: any; raw: string }> {
  const url = `${BASE_URL}${path}`;
  const reqHeaders: Record<string, string> = { ...(headers || {}) };
  let payload: string | undefined = undefined;

  if (body !== undefined) {
    if (typeof body === "string") {
      payload = body;
    } else {
      payload = JSON.stringify(body);
      if (!reqHeaders["Content-Type"]) {
        reqHeaders["Content-Type"] = "application/json";
      }
    }
  }

  const res = await fetch(url, {
    method,
    headers: reqHeaders,
    body: payload,
  });

  const raw = await res.text();
  let data: any = null;
  try {
    data = JSON.parse(raw);
  } catch {
    data = raw;
  }

  return { status: res.status, data, raw };
}

async function waitForServer(retries = 20): Promise<boolean> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(`${BASE_URL}/api/logs`);
      if (res.status === 200 || res.status === 404) {
        return true;
      }
    } catch (err: any) {
      if (i === retries - 1) {
        console.error("Last waitForServer connection error:", err?.message, err?.cause);
      }
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  return false;
}

async function runTests() {
  console.log("==========================================================");
  console.log(` Running PayPilot Smoke Tests against ${BASE_URL}`);
  console.log("==========================================================");

  // 1. GET /api/invoices
  const invRes = await request("GET", "/api/invoices");
  assert(
    invRes.status === 200 && Array.isArray(invRes.data),
    "1. GET /api/invoices returns 200 and an array",
    invRes
  );

  // 2. GET /api/invoices/:id
  const singleInvRes = await request("GET", "/api/invoices/inv-mock-paid");
  assert(
    singleInvRes.status === 200 && singleInvRes.data.id === "inv-mock-paid",
    "2a. GET /api/invoices/:id existing invoice returns 200",
    singleInvRes
  );

  const missingInvRes = await request("GET", "/api/invoices/non-existent-id");
  assert(
    missingInvRes.status === 404,
    "2b. GET /api/invoices/:id missing invoice returns 404",
    missingInvRes
  );

  // 3. GET /api/actions?status=pending
  const actionsRes = await request("GET", "/api/actions?status=pending");
  assert(
    actionsRes.status === 200 && Array.isArray(actionsRes.data),
    "3. GET /api/actions?status=pending returns 200",
    actionsRes
  );

  // 4. Server-side validation: Invalid email on create_invoice approval returns 400
  const invalidActionRes = await request("POST", "/api/actions", {
    type: "create_invoice",
    payload: {
      clientName: "Test Client",
      clientEmail: "invalid-email-address",
      description: "Consulting fees",
      amount: 500,
      dueInDays: 14,
    },
  });
  const invalidActionId = invalidActionRes.data.id;

  const approveInvalidRes = await request(
    "POST",
    `/api/actions/${invalidActionId}/approve`
  );
  assert(
    approveInvalidRes.status === 400,
    "4. Approving invoice draft with invalid email returns 400 (leaves action pending)",
    approveInvalidRes
  );

  // 5. Create valid invoice draft and approve it
  const validActionRes = await request("POST", "/api/actions", {
    type: "create_invoice",
    payload: {
      clientName: "Acme Partner",
      clientEmail: "partner@acme.com",
      description: "Integration Sprint 1",
      amount: 1200,
      dueInDays: 14,
    },
  });
  const validActionId = validActionRes.data.id;

  const approveValidRes = await request(
    "POST",
    `/api/actions/${validActionId}/approve`
  );
  assert(
    approveValidRes.status === 200 &&
      approveValidRes.data.action?.status === "approved" &&
      approveValidRes.data.invoice?.status === "sent",
    "5. Approving valid invoice draft returns 200, creates invoice, and marks action approved",
    approveValidRes
  );

  // 6. Idempotency: Approving the same action twice must return 409
  const approveAgainRes = await request(
    "POST",
    `/api/actions/${validActionId}/approve`
  );
  assert(
    approveAgainRes.status === 409,
    "6. Approving already resolved action returns 409 Conflict (idempotent)",
    approveAgainRes
  );

  // 7. Reminder on a paid invoice returns 400
  const reminderActionRes = await request("POST", "/api/actions", {
    type: "send_reminder",
    payload: {
      invoiceId: "inv-mock-paid",
      message: "Please pay settled bill",
      tone: "polite",
    },
  });
  const reminderActionId = reminderActionRes.data.id;

  const approveReminderRes = await request(
    "POST",
    `/api/actions/${reminderActionId}/approve`
  );
  assert(
    approveReminderRes.status === 400,
    "7. Sending reminder on an already paid invoice returns 400",
    approveReminderRes
  );

  // 8. Reject action
  const rejectActionRes = await request("POST", "/api/actions", {
    type: "create_invoice",
    payload: {
      clientName: "Declined Client",
      clientEmail: "declined@client.com",
      description: "Declined proposal",
      amount: 300,
      dueInDays: 7,
    },
  });
  const rejectActionId = rejectActionRes.data.id;

  const doRejectRes = await request(
    "POST",
    `/api/actions/${rejectActionId}/reject`
  );
  assert(
    doRejectRes.status === 200 &&
      doRejectRes.data.action?.status === "rejected",
    "8. Rejecting pending action returns 200 and marks status rejected",
    doRejectRes
  );

  // 9. GET /api/logs
  const logsRes = await request("GET", "/api/logs");
  assert(
    logsRes.status === 200 && Array.isArray(logsRes.data) && logsRes.data.length > 0,
    "9. GET /api/logs returns 200 and event rows",
    logsRes
  );

  // 10. Unsigned webhook returns 401
  const unsignedWebhookRes = await request(
    "POST",
    "/api/webhooks/paypal",
    {
      event_type: "INVOICING.INVOICE.PAID",
      resource: { id: "INV2-MOCK-SENT2" },
    }
  );
  assert(
    unsignedWebhookRes.status === 401,
    "10. Unsigned PayPal webhook is rejected with 401",
    unsignedWebhookRes
  );

  // 11. Valid mock webhook marks invoice paid and returns 200
  const validWebhookRes = await request(
    "POST",
    "/api/webhooks/paypal",
    {
      event_type: "INVOICING.INVOICE.PAID",
      resource: { invoice: { id: "INV2-MOCK-SENT2" } },
    },
    { "x-mock-webhook": "valid" }
  );
  assert(
    validWebhookRes.status === 200 && validWebhookRes.data.received === true,
    "11. Valid PayPal webhook returns 200 and updates invoice status to paid",
    validWebhookRes
  );

  console.log("==========================================================");
  console.log(` Smoke Tests Finished: ${passed} passed, ${failed} failed`);
  console.log("==========================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

async function main() {
  const isSelfHosted = !process.env.TEST_HOSTED;

  if (isSelfHosted) {
    console.log(`Starting Next.js server in mock mode on port ${PORT}...`);
    const nextBin = require.resolve("next/dist/bin/next");
    serverProcess = spawn(
      process.execPath,
      [nextBin, "start", "-p", String(PORT), "-H", "127.0.0.1"],
      {
        cwd: process.cwd(),
        env: {
          ...process.env,
          PORT: String(PORT),
          USE_MOCKS: "true",
          NODE_ENV: "production",
        },
        stdio: "inherit",
      }
    );

    const ready = await waitForServer(30);
    if (!ready) {
      console.error("Next.js server failed to start within timeout.");
      if (serverProcess) serverProcess.kill();
      process.exit(1);
    }
  }

  try {
    await runTests();
  } finally {
    if (serverProcess) {
      console.log("Shutting down test server...");
      serverProcess.kill();
    }
  }
}

main().catch((err) => {
  console.error("Test execution fatal error:", err);
  if (serverProcess) serverProcess.kill();
  process.exit(1);
});
