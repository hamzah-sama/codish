import { createTool } from "@inngest/agent-kit";
import { Id } from "../../../../../convex/_generated/dataModel";
import z from "zod";
import { convex } from "@/lib/convex-client";
import { api } from "../../../../../convex/_generated/api";

interface Props {
  internalKey: string;
  projectId: Id<"projects">;
}

const paramsSchema = z.object({
  fileIds: z
    .array(z.string().min(1, "file Id cannot be empty"))
    .min(1, "proveide at least one file Id"),
});

export const CreateDeleteFilesTool = ({ internalKey, projectId }: Props) => {
  return createTool({
    name: "delete-files",
    description: "Delete files or folders from the project.",
    parameters: z.object({
      fileIds: z
        .array(z.string())
        .describe("Array of files or folders to delete"),
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

      const filesToDelete: { name: string; id: string; type: string }[] = [];

      for (const fileId of fileIds) {
        const file = await convex.query(api.system.getFileById, {
          internalKey,
          fileId: fileId as Id<"files">,
        });

        if (!file) {
          return `Error: file with id ${fileId} is not found, use listfiles to get valid id`;
        }

        if (file.projectId !== projectId) {
          return `Error : file with Id ${fileId} is not belong in this project`;
        }

        filesToDelete.push({
          name: file.name,
          type: file.type,
          id: file._id,
        });
      }

      try {
        const result = await toolStep.run("delete-files", async () => {
          const message: string[] = [];
          for (const file of filesToDelete) {
            await convex.mutation(api.system.deleteFile, {
              internalKey,
              fileId: file.id as Id<"files">,
              projectId,
            });

            message.push(
              `${file.type} with name ${file.name} deleted succesfully `,
            );
          }

          return message.join("\n");
        });

        return result;
      } catch (error) {
        return `Error deleting files : ${error instanceof Error ? error.message : "Unknown error"}`;
      }
    },
  });
};
