import { createAndSendInvoice } from "../lib/paypal";

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.log("Please add the buyer email after the file name.");
    return;
  }
  try {
    const result = await createAndSendInvoice({
      clientName: "Maya",
      clientEmail: email,
      description: "photos",
      amount: 300,
      dueInDays: 14,
    });
    console.log("SUCCESS:", JSON.stringify(result, null, 2));
  } catch (e: any) {
    console.log("FAILED:", e.message);
    console.log(JSON.stringify(e.details, null, 2));
  }
}

main();