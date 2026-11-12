const base = process.env.PAYPAL_BASE_URL || "https://api-m.sandbox.paypal.com";
const id = process.env.PAYPAL_CLIENT_ID?.trim();
const secret = process.env.PAYPAL_CLIENT_SECRET?.trim();

async function main() {
  console.log("Mock mode:", process.env.USE_MOCKS);
  console.log("Base URL:", base);
  console.log("Client ID set:", !!id, "| Secret set:", !!secret);

  const tokenRes = await fetch(`${base}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(`${id}:${secret}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const t: any = await tokenRes.json();
  console.log("Login status:", tokenRes.status);

  if (!tokenRes.ok) {
    console.log("Login error:", t.error, "-", t.error_description);
    return;
  }

  const scopes: string[] = String(t.scope || "").split(" ");
  const inv = scopes.filter((s) => s.includes("invoic"));
  console.log("Invoicing permissions granted:", inv.length);
  inv.forEach((s) => console.log("  " + s.replace("https://uri.paypal.com/services/", "")));

  const r = await fetch(`${base}/v2/invoicing/generate-next-invoice-number`, {
    method: "POST",
    headers: { Authorization: `Bearer ${t.access_token}`, "Content-Type": "application/json" },
  });
  const body = await r.json().catch(() => ({}));
  console.log("Invoice number call:", r.status, JSON.stringify(body).slice(0, 200));
}

main();