import { convex } from "@/lib/convex-client";
import { createTool } from "@inngest/agent-kit";
import z from "zod";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";

interface Props {
  internalKey: string;
  projectId: Id<"projects">;
}

const paramsSchema = z.object({
  fileId: z
    .string()
    .min(1, "File ID cannot be empty")
    .describe("ID of the file to update"),
  content: z.string().describe("New content for the file"),
});
export const createUpdateFilesTool = ({ internalKey, projectId }: Props) => {
  return createTool({
    name: "update_file",
    description: "Update the content of a file in the project",
    parameters: z.object({
      fileId: z
        .string()
        .min(1, "File ID cannot be empty")
        .describe("ID of the file to update"),
      content: z.string().describe("New content for the file"),
    }),

    handler: async (params, { step: toolStep }) => {
      if (!toolStep) {
        return "Error: step context not available";
      }
      const parsed = paramsSchema.safeParse(params);
      if (!parsed.success) {
        return `Error: ${parsed.error.issues[0].message}`;
      }

      const { fileId, content } = parsed.data;

      const file = await convex.query(api.system.getFileById, {
        internalKey,
        fileId: fileId as Id<"files">,
      });

      if (!file) {
        return `Error: no file found with ID ${fileId}`;
      }

      if (file.type === "folder") {
        return `Error : ${fileId} is a folder not a file, you can't update a file content`;
      }

      if (file.projectId !== projectId) {
        return `Error: file with ID ${fileId} is not belong to the current project`;
      }

      try {
        return await toolStep?.run("update-file", async () => {
          await convex.mutation(api.system.updateFileContent, {
            internalKey,
            fileId: fileId as Id<"files">,
            content,
          });

          return `File with ID ${fileId} has been updated successfully.`;
        });
      } catch (error) {
        return `Error updating files: ${error instanceof Error ? error.message : "Unknown error"}`;
      }
    },
  });
};
