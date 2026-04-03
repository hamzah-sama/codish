import z from "zod";
import { Id } from "../../../../../convex/_generated/dataModel";
import { createTool } from "@inngest/agent-kit";
import { convex } from "@/lib/convex-client";
import { api } from "../../../../../convex/_generated/api";

interface Props {
  internalKey: string;
  projectId: Id<"projects">;
}

const paramsSchema = z.object({
  newName: z.string().describe("New name for the file"),
  fileId: z
    .string()
    .min(1, "File ID cannot be empty")
    .describe("ID of the file to rename"),
});

export const createRenameFilesTool = ({ internalKey, projectId }: Props) => {
  return createTool({
    name: "rename-file",
    description: "rename file or folder",
    parameters: z.object({
      newName: z.string().describe("New name for the file"),
      fileId: z
        .string()
        .min(1, "File ID cannot be empty")
        .describe("ID of the file to rename"),
    }),
    handler: async (params, { step: toolStep }) => {
      if (!toolStep) {
        return `Error : step context not available`;
      }
      const parsed = paramsSchema.safeParse(params);
      if (!parsed.success) {
        return `Error : ${parsed.error.issues[0].message}`;
      }
      const { fileId, newName } = parsed.data;

      const file = await convex.query(api.system.getFileById, {
        internalKey,
        fileId: fileId as Id<"files">,
      });

      if (!file) {
        return `Error file with id ${fileId} is not found, use listfiles to get valid id`;
      }
      if (file.projectId !== projectId) {
        return `Error file wih id ${fileId} is not belong in this project`;
      }

      try {
        return await toolStep.run("rename-file", async () => {
          await convex.mutation(api.system.renameFiles, {
            internalKey,
            newName,
            fileId: fileId as Id<"files">,
            projectId,
          });
          return `File with id ${fileId} has been renamed to ${newName}`;
        });
      } catch (error) {
        return `Error rename file : ${error instanceof Error ? error.message : "unknown error"}`;
      }
    },
  });
};
