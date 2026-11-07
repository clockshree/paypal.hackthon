import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

async function main() {
  const pager = await ai.models.list();
  for await (const m of pager) {
    const name = (m.name ?? "").replace("models/", "");
    if (name.includes("flash")) {
      console.log(name);
    }
  }
}

main();