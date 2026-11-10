import { neon } from "@neondatabase/serverless";
import {
  Invoice,
  InvoiceDraft,
  InvoiceStatus,
  PendingAction,
  PendingActionStatus,
  PendingActionType,
} from "./types";

interface ActionLogRow {
  id: number;
  at: string;
  event: string;
  detail: any;
}

interface InMemoryStore {
  invoices: Map<string, Invoice>;
  pendingActions: Map<string, PendingAction>;
  logs: ActionLogRow[];
  logIdCounter: number;
  seeded: boolean;
}

// Global in-memory store for fallback & mock mode
const globalStore: InMemoryStore =
  (globalThis as unknown as { __paypilot_db?: InMemoryStore }).__paypilot_db ||
  ((globalThis as unknown as { __paypilot_db: InMemoryStore }).__paypilot_db = {
    invoices: new Map(),
    pendingActions: new Map(),
    logs: [],
    logIdCounter: 1,
    seeded: false,
  });

function isMockMode(): boolean {
  return process.env.USE_MOCKS === "true";
}

function getDbClient() {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    return null;
  }
  return neon(connectionString);
}

let tableInitPromise: Promise<void> | null = null;

async function ensureTables() {
  const sql = getDbClient();
  if (!sql) return;

  if (!tableInitPromise) {
    tableInitPromise = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS invoices (
          id text PRIMARY KEY,
          paypal_invoice_id text,
          client_name text NOT NULL,
          client_email text NOT NULL,
          description text NOT NULL,
          amount numeric NOT NULL,
          due_in_days int NOT NULL,
          status text NOT NULL,
          created_at timestamptz DEFAULT now()
        );
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS pending_actions (
          id text PRIMARY KEY,
          type text NOT NULL,
          payload jsonb NOT NULL,
          status text DEFAULT 'pending',
          created_at timestamptz DEFAULT now(),
          resolved_at timestamptz
        );
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS action_log (
          id serial PRIMARY KEY,
          at timestamptz DEFAULT now(),
          event text NOT NULL,
          detail jsonb
        );
      `;
    })().catch((err) => {
      tableInitPromise = null;
      console.error("Failed to initialize database tables:", err);
      throw err;
    });
  }

  await tableInitPromise;
}

function seedMockData() {
  if (globalStore.seeded) return;
  globalStore.seeded = true;

  const mockInvoices: Invoice[] = [
    {
      id: "inv-mock-paid",
      paypalInvoiceId: "INV2-MOCK-PAID1",
      clientName: "Acme Corporation",
      clientEmail: "billing@acme.com",
      description: "Q3 Enterprise Software Engineering & Cloud Infrastructure",
      amount: 4500,
      dueInDays: 14,
      status: "paid",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
    },
    {
      id: "inv-mock-sent",
      paypalInvoiceId: "INV2-MOCK-SENT2",
      clientName: "Starlight Media",
      clientEmail: "finance@starlight.com",
      description: "Monthly Digital Media Marketing & Creative Retainer",
      amount: 1850,
      dueInDays: 30,
      status: "sent",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    },
    {
      id: "inv-mock-overdue",
      paypalInvoiceId: "INV2-MOCK-OVER3",
      clientName: "Globex Logistics",
      clientEmail: "ap@globex.org",
      description: "Supply Chain API Integration & Automation",
      amount: 3200,
      dueInDays: 7,
      status: "overdue",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 18).toISOString(),
    },
    {
      id: "inv-mock-pending",
      paypalInvoiceId: null,
      clientName: "Nexus Ventures",
      clientEmail: "ops@nexus.vc",
      description: "Cloud Architecture Audit & Security Assessment",
      amount: 2750,
      dueInDays: 15,
      status: "pending_approval",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
    },
    {
      id: "inv-mock-draft",
      paypalInvoiceId: null,
      clientName: "BluePeak Labs",
      clientEmail: "accounts@bluepeak.dev",
      description: "Full-stack AI Prototype Implementation",
      amount: 5000,
      dueInDays: 21,
      status: "draft",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    },
  ];

  for (const inv of mockInvoices) {
    globalStore.invoices.set(inv.id, inv);
  }

  const mockActions: PendingAction[] = [
    {
      id: "act-mock-1",
      type: "create_invoice",
      payload: {
        clientName: "Quantum Dynamics",
        clientEmail: "invoicing@quantumdynamics.tech",
        description: "Milestone 2 - Machine Learning Pipeline Implementation",
        amount: 2400,
        dueInDays: 14,
      },
      status: "pending",
    },
    {
      id: "act-mock-2",
      type: "send_reminder",
      payload: {
        invoiceId: "inv-mock-overdue",
        message:
          "Friendly reminder: your invoice for Supply Chain API Integration was due last week.",
        tone: "polite",
      },
      status: "pending",
    },
  ];

  for (const act of mockActions) {
    globalStore.pendingActions.set(act.id, act);
  }

  globalStore.logs.push({
    id: globalStore.logIdCounter++,
    at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    event: "mock_seed_initialized",
    detail: { count: mockInvoices.length },
  });
}

function mapInvoiceRow(row: any): Invoice {
  return {
    id: String(row.id),
    paypalInvoiceId: row.paypal_invoice_id ? String(row.paypal_invoice_id) : null,
    clientName: String(row.client_name),
    clientEmail: String(row.client_email),
    description: String(row.description),
    amount: Number(row.amount),
    dueInDays: Number(row.due_in_days),
    status: row.status as InvoiceStatus,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

function mapActionRow(row: any): PendingAction {
  const payload =
    typeof row.payload === "string" ? JSON.parse(row.payload) : row.payload;
  return {
    id: String(row.id),
    type: row.type as PendingActionType,
    payload,
    status: row.status as PendingActionStatus,
  };
}

// -------------------------------------------------------------
// Exported Helpers
// -------------------------------------------------------------

export async function createInvoice(
  data: InvoiceDraft & {
    status?: InvoiceStatus;
    paypalInvoiceId?: string | null;
    id?: string;
    createdAt?: string;
  }
): Promise<Invoice> {
  const id = data.id || crypto.randomUUID();
  const createdAt = data.createdAt || new Date().toISOString();
  const status = data.status || "draft";
  const paypalInvoiceId = data.paypalInvoiceId ?? null;

  const invoice: Invoice = {
    id,
    paypalInvoiceId,
    clientName: data.clientName,
    clientEmail: data.clientEmail,
    description: data.description,
    amount: data.amount,
    dueInDays: data.dueInDays,
    status,
    createdAt,
  };

  const sql = getDbClient();
  if (sql && !isMockMode()) {
    await ensureTables();
    await sql`
      INSERT INTO invoices (id, paypal_invoice_id, client_name, client_email, description, amount, due_in_days, status, created_at)
      VALUES (
        ${invoice.id},
        ${invoice.paypalInvoiceId},
        ${invoice.clientName},
        ${invoice.clientEmail},
        ${invoice.description},
        ${invoice.amount},
        ${invoice.dueInDays},
        ${invoice.status},
        ${invoice.createdAt}
      )
    `;
    return invoice;
  }

  // Memory fallback or mock mode
  if (isMockMode()) seedMockData();
  globalStore.invoices.set(invoice.id, invoice);
  return invoice;
}

export async function getInvoice(id: string): Promise<Invoice | null> {
  const sql = getDbClient();
  if (sql && !isMockMode()) {
    await ensureTables();
    const rows = await sql`SELECT * FROM invoices WHERE id = ${id} LIMIT 1`;
    if (rows.length === 0) return null;
    return mapInvoiceRow(rows[0]);
  }

  if (isMockMode()) seedMockData();
  return globalStore.invoices.get(id) || null;
}

export async function getInvoiceByPaypalId(
  paypalInvoiceId: string
): Promise<Invoice | null> {
  const sql = getDbClient();
  if (sql && !isMockMode()) {
    await ensureTables();
    const rows =
      await sql`SELECT * FROM invoices WHERE paypal_invoice_id = ${paypalInvoiceId} LIMIT 1`;
    if (rows.length === 0) return null;
    return mapInvoiceRow(rows[0]);
  }

  if (isMockMode()) seedMockData();
  for (const inv of globalStore.invoices.values()) {
    if (inv.paypalInvoiceId === paypalInvoiceId) {
      return inv;
    }
  }
  return null;
}

export async function listInvoices(): Promise<Invoice[]> {
  const sql = getDbClient();
  if (sql && !isMockMode()) {
    await ensureTables();
    const rows =
      await sql`SELECT * FROM invoices ORDER BY created_at DESC`;
    return rows.map(mapInvoiceRow);
  }

  if (isMockMode()) seedMockData();
  return Array.from(globalStore.invoices.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function updateInvoiceStatus(
  id: string,
  status: InvoiceStatus,
  paypalInvoiceId?: string | null
): Promise<Invoice | null> {
  const sql = getDbClient();
  if (sql && !isMockMode()) {
    await ensureTables();
    if (paypalInvoiceId !== undefined) {
      const rows = await sql`
        UPDATE invoices
        SET status = ${status}, paypal_invoice_id = ${paypalInvoiceId}
        WHERE id = ${id}
        RETURNING *
      `;
      if (rows.length === 0) return null;
      return mapInvoiceRow(rows[0]);
    } else {
      const rows = await sql`
        UPDATE invoices
        SET status = ${status}
        WHERE id = ${id}
        RETURNING *
      `;
      if (rows.length === 0) return null;
      return mapInvoiceRow(rows[0]);
    }
  }

  if (isMockMode()) seedMockData();
  const existing = globalStore.invoices.get(id);
  if (!existing) return null;
  const updated: Invoice = {
    ...existing,
    status,
    paypalInvoiceId:
      paypalInvoiceId !== undefined ? paypalInvoiceId : existing.paypalInvoiceId,
  };
  globalStore.invoices.set(id, updated);
  return updated;
}

export async function createPendingAction(
  type: PendingActionType,
  payload: PendingAction["payload"]
): Promise<PendingAction> {
  const id = crypto.randomUUID();
  const action: PendingAction = {
    id,
    type,
    payload,
    status: "pending",
  };

  const sql = getDbClient();
  if (sql && !isMockMode()) {
    await ensureTables();
    await sql`
      INSERT INTO pending_actions (id, type, payload, status)
      VALUES (${action.id}, ${action.type}, ${JSON.stringify(action.payload)}, ${action.status})
    `;
    return action;
  }

  if (isMockMode()) seedMockData();
  globalStore.pendingActions.set(action.id, action);
  return action;
}

export async function getPendingAction(id: string): Promise<PendingAction | null> {
  const sql = getDbClient();
  if (sql && !isMockMode()) {
    await ensureTables();
    const rows =
      await sql`SELECT * FROM pending_actions WHERE id = ${id} LIMIT 1`;
    if (rows.length === 0) return null;
    return mapActionRow(rows[0]);
  }

  if (isMockMode()) seedMockData();
  return globalStore.pendingActions.get(id) || null;
}

export async function listPendingActions(
  status?: PendingActionStatus
): Promise<PendingAction[]> {
  const sql = getDbClient();
  if (sql && !isMockMode()) {
    await ensureTables();
    if (status) {
      const rows = await sql`
        SELECT * FROM pending_actions
        WHERE status = ${status}
        ORDER BY created_at DESC
      `;
      return rows.map(mapActionRow);
    } else {
      const rows = await sql`
        SELECT * FROM pending_actions
        ORDER BY created_at DESC
      `;
      return rows.map(mapActionRow);
    }
  }

  if (isMockMode()) seedMockData();
  let list = Array.from(globalStore.pendingActions.values());
  if (status) {
    list = list.filter((a) => a.status === status);
  }
  return list;
}

export async function resolveAction(
  id: string,
  status: PendingActionStatus
): Promise<PendingAction | null> {
  const sql = getDbClient();
  if (sql && !isMockMode()) {
    await ensureTables();
    const rows = await sql`
      UPDATE pending_actions
      SET status = ${status}, resolved_at = now()
      WHERE id = ${id}
      RETURNING *
    `;
    if (rows.length === 0) return null;
    return mapActionRow(rows[0]);
  }

  if (isMockMode()) seedMockData();
  const existing = globalStore.pendingActions.get(id);
  if (!existing) return null;
  const updated: PendingAction = {
    ...existing,
    status,
  };
  globalStore.pendingActions.set(id, updated);
  return updated;
}

export async function logEvent(event: string, detail?: unknown): Promise<void> {
  const sql = getDbClient();
  if (sql && !isMockMode()) {
    try {
      await ensureTables();
      await sql`
        INSERT INTO action_log (event, detail)
        VALUES (${event}, ${JSON.stringify(detail ?? {})})
      `;
      return;
    } catch (err) {
      console.error("Failed to write to action_log in database:", err);
    }
  }

  if (isMockMode()) seedMockData();
  globalStore.logs.unshift({
    id: globalStore.logIdCounter++,
    at: new Date().toISOString(),
    event,
    detail: detail ?? {},
  });
}

export async function listLogs(
  limit: number = 50
): Promise<Array<{ id: number; at: string; event: string; detail: any }>> {
  const sql = getDbClient();
  if (sql && !isMockMode()) {
    await ensureTables();
    const rows = await sql`
      SELECT id, at, event, detail
      FROM action_log
      ORDER BY at DESC
      LIMIT ${limit}
    `;
    return rows.map((r: any) => ({
      id: Number(r.id),
      at: new Date(r.at).toISOString(),
      event: String(r.event),
      detail: typeof r.detail === "string" ? JSON.parse(r.detail) : r.detail,
    }));
  }

  if (isMockMode()) seedMockData();
  return globalStore.logs.slice(0, limit);
}
