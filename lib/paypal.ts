import { InvoiceDraft, InvoiceStatus } from "./types";

export class PayPalError extends Error {
  statusCode: number;
  details: unknown;
  debugId?: string;

  constructor(
    message: string,
    statusCode: number,
    details: unknown,
    debugId?: string
  ) {
    super(message);
    this.name = "PayPalError";
    this.statusCode = statusCode;
    this.details = details;
    this.debugId = debugId;
  }
}

interface CachedToken {
  token: string;
  expiresAt: number;
}

let cachedToken: CachedToken | null = null;

function isMockMode(): boolean {
  return process.env.USE_MOCKS === "true";
}

function getBaseUrl(): string {
  return (
    process.env.PAYPAL_BASE_URL?.trim() || "https://api-m.sandbox.paypal.com"
  );
}

function getCredentials() {
  const clientId = process.env.PAYPAL_CLIENT_ID?.trim();
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET?.trim();
  return { clientId, clientSecret };
}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  attempt = 1
): Promise<Response> {
  try {
    const res = await fetch(url, options);
    const debugId =
      res.headers.get("paypal-debug-id") ||
      res.headers.get("Paypal-Debug-Id") ||
      undefined;

    if (debugId) {
      console.log(`[PayPal Debug ID]: ${debugId}`);
    }

    if (res.status >= 500 && attempt < 2) {
      console.warn(
        `PayPal 5xx error (${res.status}) on ${url}. Retrying once...`
      );
      await new Promise((resolve) => setTimeout(resolve, 500));
      return fetchWithRetry(url, options, attempt + 1);
    }

    return res;
  } catch (err: any) {
    if (attempt < 2) {
      console.warn(
        `Network error calling PayPal on ${url}. Retrying once...`,
        err
      );
      await new Promise((resolve) => setTimeout(resolve, 500));
      return fetchWithRetry(url, options, attempt + 1);
    }
    throw new PayPalError(
      `Network failure calling PayPal: ${err?.message || "Unknown error"}`,
      0,
      { error: err }
    );
  }
}

export async function getAccessToken(): Promise<string> {
  if (isMockMode()) {
    return "MOCK_PAYPAL_ACCESS_TOKEN_FOR_DEV";
  }

  // Use cached token if valid for at least another 60 seconds
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60000) {
    return cachedToken.token;
  }

  const { clientId, clientSecret } = getCredentials();
  if (!clientId || !clientSecret) {
    throw new PayPalError(
      "Missing PAYPAL_CLIENT_ID or PAYPAL_CLIENT_SECRET in environment",
      401,
      { missingCredentials: true }
    );
  }

  const authHeader = `Basic ${Buffer.from(
    `${clientId}:${clientSecret}`
  ).toString("base64")}`;

  const res = await fetchWithRetry(`${getBaseUrl()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: "grant_type=client_credentials",
  });

  const debugId =
    res.headers.get("paypal-debug-id") ||
    res.headers.get("Paypal-Debug-Id") ||
    undefined;

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    const message =
      errorBody.error_description ||
      errorBody.message ||
      `PayPal OAuth failed with status ${res.status}`;
    console.log(`PayPal OAuth error debug_id: ${debugId || errorBody.debug_id}`);
    throw new PayPalError(
      message,
      res.status,
      errorBody,
      debugId || errorBody.debug_id
    );
  }

  const data = await res.json();
  const expiresIn = Number(data.expires_in) || 32400; // default 9h if missing
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + expiresIn * 1000,
  };

  return cachedToken.token;
}

export async function generateInvoiceNumber(): Promise<string> {
  if (isMockMode()) {
    const random = Math.floor(1000 + Math.random() * 9000);
    return `INV2-MOCK-${random}`;
  }

  const token = await getAccessToken();
  const res = await fetchWithRetry(
    `${getBaseUrl()}/v2/invoicing/generate-next-invoice-number`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    }
  );

  const debugId =
    res.headers.get("paypal-debug-id") ||
    res.headers.get("Paypal-Debug-Id") ||
    undefined;

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    const message =
      errorBody.message ||
      `Failed to generate invoice number (${res.status})`;
    console.log(`PayPal invoice number debug_id: ${debugId || errorBody.debug_id}`);
    throw new PayPalError(
      message,
      res.status,
      errorBody,
      debugId || errorBody.debug_id
    );
  }

  const data = await res.json();
  return data.invoice_number;
}

export async function createAndSendInvoice(draft: InvoiceDraft): Promise<{
  paypalInvoiceId: string;
  status: InvoiceStatus;
  invoiceUrl: string;
}> {
  if (isMockMode()) {
    const mockId = `INV2-MOCK-${Math.floor(100000 + Math.random() * 900000)}`;
    return {
      paypalInvoiceId: mockId,
      status: "sent",
      invoiceUrl: `https://www.sandbox.paypal.com/invoice/p/#${mockId}`,
    };
  }

  const token = await getAccessToken();
  const invoiceNumber = await generateInvoiceNumber();

  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];

  const due = new Date();
  due.setDate(due.getDate() + (draft.dueInDays || 14));
  const dueDateStr = due.toISOString().split("T")[0];

  const currency = process.env.DEFAULT_CURRENCY || "USD";
  const invoicerEmail =
    process.env.INVOICER_EMAIL || "billing@paypilot.example.com";
  const invoicerName = process.env.INVOICER_NAME || "PayPilot Billing";

  const invParts = invoicerName.trim().split(/\s+/);
  const invGiven = invParts[0] || "Invoicer";
  const invSurname = invParts.slice(1).join(" ") || "";

  const clientParts = draft.clientName.trim().split(/\s+/);
  const clientGiven = clientParts[0] || "Valued";
  const clientSurname = clientParts.slice(1).join(" ") || "";

  const createPayload = {
    detail: {
      invoice_number: invoiceNumber,
      invoice_date: todayStr,
      currency_code: currency,
      note: draft.description,
      payment_term: {
        term_type: "DUE_ON_DATE_SPECIFIED",
        due_date: dueDateStr,
      },
    },
    invoicer: {
      name: {
        given_name: invGiven,
        surname: invSurname,
      },
      ...(process.env.INVOICER_EMAIL ? { email_address: invoicerEmail } : {}),
    },
    primary_recipients: [
      {
        billing_info: {
          name: {
            given_name: clientGiven,
            surname: clientSurname,
          },
          email_address: draft.clientEmail,
        },
      },
    ],
    items: [
      {
        name: draft.description.slice(0, 100),
        quantity: "1",
        unit_amount: {
          currency_code: currency,
          value: Number(draft.amount).toFixed(2),
        },
      },
    ],
  };

  // 1. POST /v2/invoicing/invoices
  const createRes = await fetchWithRetry(
    `${getBaseUrl()}/v2/invoicing/invoices`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(createPayload),
    }
  );

  const createDebugId =
    createRes.headers.get("paypal-debug-id") ||
    createRes.headers.get("Paypal-Debug-Id") ||
    undefined;

  if (!createRes.ok) {
    const errorBody = await createRes.json().catch(() => ({}));
    const message =
      errorBody.message ||
      `PayPal invoice creation failed (${createRes.status})`;
    console.log(
      `PayPal create invoice debug_id: ${createDebugId || errorBody.debug_id}`
    );
    throw new PayPalError(
      message,
      createRes.status,
      errorBody,
      createDebugId || errorBody.debug_id
    );
  }

  const createData = await createRes.json();
  const invoiceId =
    createData.id ||
    (createData.href ? createData.href.split("/").pop() : null);

  if (!invoiceId) {
    throw new PayPalError(
      "PayPal did not return an invoice ID or href",
      502,
      createData
    );
  }

  // 2. POST /v2/invoicing/invoices/{id}/send
  const sendRes = await fetchWithRetry(
    `${getBaseUrl()}/v2/invoicing/invoices/${encodeURIComponent(
      invoiceId
    )}/send`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        send_to_recipient: true,
        send_to_invoicer: true,
      }),
    }
  );

  const sendDebugId =
    sendRes.headers.get("paypal-debug-id") ||
    sendRes.headers.get("Paypal-Debug-Id") ||
    undefined;

  if (!sendRes.ok) {
    const errorBody = await sendRes.json().catch(() => ({}));
    const message =
      errorBody.message || `PayPal send invoice failed (${sendRes.status})`;
    console.log(`PayPal send debug_id: ${sendDebugId || errorBody.debug_id}`);
    throw new PayPalError(
      message,
      sendRes.status,
      errorBody,
      sendDebugId || errorBody.debug_id
    );
  }

  // 3. GET /v2/invoicing/invoices/{id}
  const getRes = await fetchWithRetry(
    `${getBaseUrl()}/v2/invoicing/invoices/${encodeURIComponent(invoiceId)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    }
  );

  const getDebugId =
    getRes.headers.get("paypal-debug-id") ||
    getRes.headers.get("Paypal-Debug-Id") ||
    undefined;

  let invoiceUrl = `https://www.sandbox.paypal.com/invoice/p/#${invoiceId}`;
  let status: InvoiceStatus = "sent";

  if (getRes.ok) {
    const getData = await getRes.json();
    const recipientViewUrl =
      getData.detail?.metadata?.recipient_view_url ||
      getData.detail?.metadata?.payer_view_url;
    if (recipientViewUrl) {
      invoiceUrl = recipientViewUrl;
    }
    status = mapPayPalStatus(getData.status, getData.detail?.payment_term?.due_date);
  } else {
    console.log(`PayPal get invoice metadata debug_id: ${getDebugId}`);
  }

  return {
    paypalInvoiceId: invoiceId,
    status,
    invoiceUrl,
  };
}

export async function sendReminder(
  paypalInvoiceId: string,
  params: { subject?: string; note?: string }
): Promise<{ success: boolean }> {
  if (isMockMode()) {
    return { success: true };
  }

  const token = await getAccessToken();
  const res = await fetchWithRetry(
    `${getBaseUrl()}/v2/invoicing/invoices/${encodeURIComponent(
      paypalInvoiceId
    )}/remind`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        subject: params.subject || "Reminder: Outstanding Invoice",
        note:
          params.note ||
          "Please review and settle your outstanding invoice at your earliest convenience.",
        send_to_recipient: true,
        send_to_invoicer: false,
      }),
    }
  );

  const debugId =
    res.headers.get("paypal-debug-id") ||
    res.headers.get("Paypal-Debug-Id") ||
    undefined;

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    const message =
      errorBody.message || `Failed to send PayPal reminder (${res.status})`;
    console.log(
      `PayPal sendReminder debug_id: ${debugId || errorBody.debug_id}`
    );
    throw new PayPalError(
      message,
      res.status,
      errorBody,
      debugId || errorBody.debug_id
    );
  }

  return { success: true };
}

function mapPayPalStatus(
  paypalStatus?: string,
  dueDateStr?: string
): InvoiceStatus {
  const upper = (paypalStatus || "").toUpperCase();

  if (upper === "PAID" || upper === "MARKED_AS_PAID") {
    return "paid";
  }

  if (upper === "DRAFT") {
    return "draft";
  }

  // If status is SENT, UNPAID, PARTIALLY_PAID, check if overdue
  if (
    upper === "SENT" ||
    upper === "UNPAID" ||
    upper === "PAYMENT_PENDING" ||
    upper === "PARTIALLY_PAID" ||
    upper === "SCHEDULED"
  ) {
    if (dueDateStr) {
      const dueDate = new Date(dueDateStr);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (dueDate.getTime() < today.getTime()) {
        return "overdue";
      }
    }
    return "sent";
  }

  if (upper === "CANCELLED" || upper === "REFUNDED") {
    return "draft";
  }

  return "sent";
}

export async function getInvoiceStatus(
  paypalInvoiceId: string
): Promise<InvoiceStatus> {
  if (isMockMode()) {
    if (paypalInvoiceId.includes("PAID")) return "paid";
    if (paypalInvoiceId.includes("OVER")) return "overdue";
    if (paypalInvoiceId.includes("DRAFT")) return "draft";
    return "sent";
  }

  const token = await getAccessToken();
  const res = await fetchWithRetry(
    `${getBaseUrl()}/v2/invoicing/invoices/${encodeURIComponent(
      paypalInvoiceId
    )}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    }
  );

  const debugId =
    res.headers.get("paypal-debug-id") ||
    res.headers.get("Paypal-Debug-Id") ||
    undefined;

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    const message =
      errorBody.message || `Failed to fetch PayPal invoice (${res.status})`;
    console.log(
      `PayPal getInvoiceStatus debug_id: ${debugId || errorBody.debug_id}`
    );
    throw new PayPalError(
      message,
      res.status,
      errorBody,
      debugId || errorBody.debug_id
    );
  }

  const data = await res.json();
  return mapPayPalStatus(data.status, data.detail?.payment_term?.due_date);
}

export async function verifyWebhookSignature(
  headers: Headers | Record<string, string>,
  rawBody: string
): Promise<boolean> {
  const getHeader = (name: string): string => {
    if (headers instanceof Headers) {
      return headers.get(name) || "";
    }
    const lower = name.toLowerCase();
    for (const [k, v] of Object.entries(headers)) {
      if (k.toLowerCase() === lower) {
        return String(v || "");
      }
    }
    return "";
  };

  const authAlgo = getHeader("paypal-auth-algo");
  const certUrl = getHeader("paypal-cert-url");
  const transmissionId = getHeader("paypal-transmission-id");
  const transmissionSig = getHeader("paypal-transmission-sig");
  const transmissionTime = getHeader("paypal-transmission-time");

  // In mock mode, allow simulated webhooks if mock header or basic presence
  if (isMockMode()) {
    if (getHeader("x-mock-webhook") === "valid") return true;
    if (authAlgo && transmissionId && transmissionSig) return true;
    return false;
  }

  if (
    !authAlgo ||
    !certUrl ||
    !transmissionId ||
    !transmissionSig ||
    !transmissionTime
  ) {
    console.warn("PayPal webhook missing required signature headers");
    return false;
  }

  const webhookId = process.env.PAYPAL_WEBHOOK_ID?.trim();
  if (!webhookId) {
    console.error("Missing PAYPAL_WEBHOOK_ID for signature verification");
    return false;
  }

  let eventObj: any;
  try {
    eventObj = JSON.parse(rawBody);
  } catch (err) {
    console.warn("Invalid JSON in webhook raw body", err);
    return false;
  }

  const token = await getAccessToken();
  const verifyPayload = {
    auth_algo: authAlgo,
    cert_url: certUrl,
    transmission_id: transmissionId,
    transmission_sig: transmissionSig,
    transmission_time: transmissionTime,
    webhook_id: webhookId,
    webhook_event: eventObj,
  };

  const res = await fetchWithRetry(
    `${getBaseUrl()}/v1/notifications/verify-webhook-signature`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(verifyPayload),
    }
  );

  const debugId =
    res.headers.get("paypal-debug-id") ||
    res.headers.get("Paypal-Debug-Id") ||
    undefined;

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    console.log(
      `PayPal webhook verify debug_id: ${debugId || errorBody.debug_id}`
    );
    return false;
  }

  const data = await res.json();
  return data.verification_status === "SUCCESS";
}

