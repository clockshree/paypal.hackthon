import { GoogleGenAI } from "@google/genai";
import { withTimeout } from "../lib/timeout";

const ai = new GoogleGenAI({});

const MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-2.5-flash-lite",
  "gemini-3.5-flash",
];

async function main() {
  for (const model of MODELS) {
    const start = Date.now();
    try {
      const r = await withTimeout(
        ai.models.generateContent({
          model,
          contents: "Reply with one word: hello",
        }),
        20000
      );
      const secs = ((Date.now() - start) / 1000).toFixed(1);
      console.log(`${model}: ${secs}s -> ${r.text?.trim()}`);
    } catch (e) {
      const secs = ((Date.now() - start) / 1000).toFixed(1);
      console.log(`${model}: FAILED after ${secs}s -> ${(e as Error).message.slice(0, 100)}`);
    }
  }
}

main();