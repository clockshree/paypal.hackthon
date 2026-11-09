import { createPending, decide, listPending } from "../lib/pending";

const a = createPending("create_invoice", { clientName: "Acme", amount: 450 });
console.log("Created:", a.id, a.status);

console.log("Approve once:", decide(a.id, "approved"));
console.log("Approve again:", decide(a.id, "approved"));
console.log("Unknown id:", decide("nope", "rejected"));

const b = createPending("send_reminder", { clientName: "Acme" });
console.log("Reject:", decide(b.id, "rejected").ok);
console.log("Total saved:", listPending().length);