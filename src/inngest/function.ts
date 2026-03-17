import { generateText } from "ai";
import { inngest } from "./client";
import { google } from "@ai-sdk/google";

export const demoGenerate = inngest.createFunction(
  { id: "demo-generate" },
  { event: "demo/generate" },
  async ({ step }) => {
    return await step.run("generate", async () => {
      const result = await generateText({
        model: google("gemini-2.5-flash"),
        prompt: "jelakan mengapa hasil dari 2 + 2",
      });
      return result.text;
    });
  },
);
