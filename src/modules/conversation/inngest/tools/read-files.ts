import { convex } from "@/lib/convex-client";
import { createTool } from "@inngest/agent-kit";
import z from "zod";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";

interface Props {
  internalKey: string;
}

const paramsSchema = z.object({
  fileIds: z
    .array(z.string().min(1, "File ID cannot be empty"))
    .min(1, "At least one file ID must be provided"),
});
export const createReadFilesTool = ({ internalKey }: Props) => {
  return createTool({
    name: "read_files",
    description:
      "Read the contents of file from the project, return file contents",
    parameters: z.object({
      fileIds: z.array(z.string()).describe("Array of file Ids to read"),
    }),
    handler: async (params, { step: toolStep }) => {
      if (!toolStep) {
        return "Error: step context not available";
      }
      const parsed = paramsSchema.safeParse(params);
      if (!parsed.success) {
        return `Error: ${parsed.error.issues[0].message}`;
      }

      const { fileIds } = parsed.data;

      try {
        return await toolStep?.run("read-files", async () => {
          const result: { id: string; name: string; content: string }[] = [];

          for (const fileId of fileIds) {
            const file = await convex.query(api.system.getFileById, {
              internalKey,
              fileId: fileId as Id<"files">,
            });

            if (file && file.content) {
              result.push({
                id: file._id,
                name: file.name,
                content: file.content,
              });
            }
          }

          if (result.length === 0) {
            return "Error : no files found with provide IDs, use listFiles to get valid Ids ";
          }

          return JSON.stringify(result);
        });
      } catch (error) {
        return `Error reading files: ${error instanceof Error ? error.message : "Unknown error"}`;
      }
    },
  });
};
