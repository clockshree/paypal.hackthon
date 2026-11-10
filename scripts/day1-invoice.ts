import fs from "fs";
import path from "path";
import { createAndSendInvoice } from "../lib/paypal";
import { InvoiceDraft } from "../lib/types";

// Load .env or .env.local if present
function loadEnv() {
  const envFiles = [".env.local", ".env"];
  for (const file of envFiles) {
    const fullPath = path.resolve(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, "utf-8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#")) {
          const idx = trimmed.indexOf("=");
          if (idx !== -1) {
            const key = trimmed.slice(0, idx).trim();
            const val = trimmed.slice(idx + 1).trim();
            if (!process.env[key]) {
              process.env[key] = val.replace(/^["']|["']$/g, "");
            }
          }
        }
      }
    }
  }
}

loadEnv();

async function main() {
  console.log("=== PayPilot Day 1 Sandbox Invoice Test ===");
  console.log("PayPal Base URL:", process.env.PAYPAL_BASE_URL || "https://api-m.sandbox.paypal.com");
  console.log("Mock Mode:", process.env.USE_MOCKS === "true" ? "ENABLED" : "DISABLED");

  const sampleDraft: InvoiceDraft = {
    clientName: "Alice Smith",
    clientEmail: "alice.sample.buyer@example.com",
    description: "PayPilot Full-Stack Web App Development (Day 1 Milestone)",
    amount: 250.0,
    dueInDays: 14,
  };

  console.log("\nCreating and sending sandbox invoice with payload:");
  console.log(JSON.stringify(sampleDraft, null, 2));

  try {
    const result = await createAndSendInvoice(sampleDraft);
    console.log("\n Invoice created and sent successfully!");
    console.log("------------------------------------------");
    console.log("PayPal Invoice ID   :", result.paypalInvoiceId);
    console.log("Invoice Status      :", result.status);
    console.log("Recipient View Link :", result.invoiceUrl);
    console.log("------------------------------------------\n");
  } catch (err: any) {
    console.error("\nFailed to create and send invoice:");
    console.error("Error Name   :", err.name);
    console.error("Status Code  :", err.statusCode);
    console.error("Message      :", err.message);
    if (err.debugId) {
      console.error("Debug ID     :", err.debugId);
    }
    if (err.details) {
      console.error("Details      :", JSON.stringify(err.details, null, 2));
    }
    process.exit(1);
  }
}

main();
