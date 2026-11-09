import { parseInvoiceRequest } from "../lib/agent";

const tests = [
  "Bill Acme $450 for the logo, due in 14 days.",
  "Invoice Sarah (sarah@example.com) 1200 dollars for website design, net 30",
  "Charge Bob for the video edit",
  "Bill Acme -50 for nothing, due in 7 days",
];

async function main() {
  for (const t of tests) {
    console.log("\n> " + t);
    console.log(JSON.stringify(await parseInvoiceRequest(t), null, 2));
  }
}

main();