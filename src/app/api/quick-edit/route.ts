import { firecrawl } from "@/lib/firecrawl";
import { openai } from "@ai-sdk/openai";
import { auth } from "@clerk/nextjs/server";
import { generateText, Output } from "ai";
import { NextResponse } from "next/server";
import z from "zod";

const quickEditSchema = z.object({
  editedcode: z
    .string()
    .describe(
      "The edited version of the selected code based on the user instructions.",
    ),
});

const URL_REGEX = /https?:\/\/[^\s]+/g;

const QUICK_EDIT_PROMPT = `You are a code editing assistant. Edit the selected code based on the user's instruction.

<context>
<selected_code>
{selectedCode}
</selected_code>
<full_code_context>
{fullCode}
</full_code_context>
</context>

{documentation}

<instruction>
{instruction}
</instruction>

<instructions>
Return ONLY the edited version of the selected code.
Maintain the same indentation level as the original.
Do not include any explanations or comments unless requested.
If the instruction is unclear or cannot be applied, return the original code unchanged.
</instructions>`;

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fullCode, selectedCode, instruction } = await request.json();
    if (!selectedCode) {
      return NextResponse.json(
        { error: "Selected code is required" },
        { status: 400 },
      );
    }

    if (!instruction) {
      return NextResponse.json(
        { error: "Instruction is required" },
        { status: 400 },
      );
    }

    const urls: string[] = instruction.match(URL_REGEX) || [];

    let documentationContext = "";
    if (urls.length > 0) {
      const scrappedResult = await Promise.all(
        urls.map(async (url) => {
          try {
            const result = await firecrawl.scrape(url, {
              formats: ["markdown"],
            });

            if (result.markdown) {
              return `<doc url="${url}">\n${result.markdown}\n</doc>`;
            }
            return null;
          } catch {
            return null;
          }
        }),
      );
      const validResults = scrappedResult.filter(Boolean);
      if (validResults.length > 0) {
        documentationContext = `<documentation>\n${validResults.join("\n\n")}\n</documentation>`;
      }
    }

    const prompt = QUICK_EDIT_PROMPT.replace("{selectedCode}", selectedCode)
      .replace("{fullCode}", fullCode || "")
      .replace("{documentation}", documentationContext)
      .replace("{instruction}", instruction);

    const { output } = await generateText({
      model: openai("gpt-4.1-mini"),
      output: Output.object({ schema: quickEditSchema }),
      prompt,
    });

    return NextResponse.json({ editedCode: output.editedcode });
  } catch (error) {
    console.error("failed to generate quick edit:", error);
    return NextResponse.json(
      { error: "Failed to generate quick edit" },
      { status: 500 },
    );
  }
}
