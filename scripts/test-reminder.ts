import { draftReminder } from "../lib/reminders";

async function main() {
  const tones = ["friendly", "professional", "firm"] as const;
  for (const tone of tones) {
    const draft = await draftReminder({
      clientName: "Acme",
      description: "Logo design",
      amount: 450,
      daysOverdue: 7,
      tone,
      freelancerName: "Shreeya",
    });
    console.log(`\n=== ${tone.toUpperCase()} (fallback used: ${draft.usedFallback}) ===`);
    console.log("Subject: " + draft.subject);
    console.log(draft.body);
  }
}

main();