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
  parentId: z.string(),
  name: z.string(),
});

export const createCreateFolderTool = ({ internalKey, projectId }: Props) => {
  return createTool({
    name: "create-folder",
    description: "create new folder in the project",
    parameters: z.object({
      parentId: z
        .string()
        .describe(
          "ID (not name) of the parent folder or empty string for root level",
        ),
      name: z
        .string()
        .min(1, "Folder name cannot be empty")
        .describe("Name of the new folder"),
    }),
    handler: async (params, { step: toolStep }) => {
      const parsed = paramsSchema.safeParse(params);
      if (!parsed.success) {
        return `Error : ${parsed.error.issues[0].message}`;
      }

      const { parentId, name } = parsed.data;

      return await toolStep?.run("create-folder", async () => {
        try {
          if (parentId) {
            const parentFolder = await convex.query(api.system.getFileById, {
              internalKey,
              fileId: parentId as Id<"files">,
            });

            if (!parentFolder) {
              return `Error: file with id ${parentId} is not found, use listfiles to get valid id`;
            }

            if (parentFolder.projectId !== projectId) {
              return `Error : file with Id ${parentId} is not belong in this project`;
            }

            if (parentFolder.type !== "folder") {
              return `Error : file with Id ${parentId} is not a folder, use folder Id as parentId`;
            }
          }

          const newFolderId = await convex.mutation(api.system.createFolder, {
            internalKey,
            projectId,
            parentId: parentId ? (parentId as Id<"files">) : undefined,
            name,
          });

          return `Folder created with ID: ${newFolderId}`;
        } catch (error) {
          return `Error creating folder : ${error instanceof Error ? error.message : "Unknown error"}`;
        }
      });
    },
  });
};
