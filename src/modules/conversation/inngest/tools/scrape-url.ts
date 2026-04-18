import { firecrawl } from "@/lib/firecrawl";
import { createTool } from "@inngest/agent-kit";
import z from "zod";

const MAX_URLS = 5;
const MAX_MARKDOWN_CHARS = 20000;
const paramsSchema = z.object({
  urls: z
    .array(z.url("invalid url format"))
    .min(1, "provide at least one url")
    .max(MAX_URLS, `scrape at most ${MAX_URLS} URLs at a time`),
});

export const createScrapeUrlTool = () => {
  return createTool({
    name: "scrapeURLs",
    description:
      "Scrape content from URLs to get documentation or reference material. Use this when the user provides URLs or references external documentation. Returns markdown content from the scraped pages.",
    parameters: z.object({
      urls: z.array(z.string()).describe("Array of URLs to scrape"),
    }),
    handler: async (params, { step: toolStep }) => {
      const parsed = paramsSchema.safeParse(params);
      if (!parsed.success) {
        return `Error : ${parsed.error.issues[0].message}`;
      }

      const { urls } = parsed.data;

      try {
        return await toolStep?.run("scrape-url", async () => {
          if (!toolStep.run) {
            return "Error: step context not available";
          }

          const results: { url: string; content: string }[] = [];
          for (const url of urls) {
            try {
              const result = await firecrawl.scrape(url, {
                formats: ["markdown"],
              });
              if (result.markdown) {
                results.push({ url, content: result.markdown.slice(0, MAX_MARKDOWN_CHARS) });
              }
            } catch (error) {
              results.push({ url, content: `failed to scrape URl ${url}` });
            }
          }

          if (results.length === 0) {
            return "No URL could be scraped from the provide URLs";
          }

          return JSON.stringify(results);
        });
      } catch (error) {
        return `Error scraping URLs : ${error instanceof Error ? error.message : "unknown error"}`;
      }
    },
  });
};
