import { createTool } from "@inngest/agent-kit";
import z from "zod";
import { Id } from "../../../../../convex/_generated/dataModel";
import { convex } from "@/lib/convex-client";
import { api } from "../../../../../convex/_generated/api";

interface Props {
  internalKey: string;
  projectId: Id<"projects">;
}

const parsedSchema = z.object({
  parentId: z.string(),
  files: z.array(
    z.object({
      name: z.string().min(1, "file name can not be empty"),
      content: z.string(),
    }),
  ),
});

export const createCreateFilesTool = ({ internalKey, projectId }: Props) => {
  return createTool({
    name: "create-files",
    description: "create new files and its contents",
    parameters: z.object({
      parentId: z
        .string()
        .describe(
          "th ID of the parent folder.use empty string for root level. must be a valid folder ID from listFiles ",
        ),
      files: z
        .array(
          z.object({
            name: z.string().describe("the file name including extension"),
            content: z.string().describe("the file content"),
          }),
        )
        .describe("array of files to create"),
    }),
    handler: async (params, { step: toolStep }) => {
      if (!toolStep) {
        return `Error: step context not available`;
      }
      const parsed = parsedSchema.safeParse(params);
      if (!parsed.success) {
        return `Error: ${parsed.error.issues[0].message}`;
      }

      const { parentId, files } = parsed.data;

      try {
        return await toolStep.run("create-files", async () => {
          let resolvedParentId: Id<"files"> | undefined;

          if (parentId || parentId !== "") {
            try {
              resolvedParentId = parentId as Id<"files">;
              const parentFolder = await convex.query(api.system.getFileById, {
                internalKey,
                fileId: resolvedParentId,
              });

              if (!parentFolder) {
                return `Error parentId with Id ${parentId} is not found, use listFiles to get valid folder Id`;
              }

              if (parentFolder.type !== "folder") {
                return `Error parentId with Id ${parentId} is not a folder, use folder Id as parentId`;
              }
            } catch (error) {
              return `Error invalid folder Id . use listFiles to get valid folder Id, or use empty string for root level}`;
            }
          }

          const result = await convex.mutation(api.system.createFiles, {
            internalKey,
            projectId,
            parentId: resolvedParentId,
            files,
          });

          const created = result.filter((r) => !r.error);
          const failed = result.filter((r) => r.error);

          let response = `Created ${created.length} files`;

          if (created.length > 0) {
            response += `${created.map((r) => r.name).join(", ")}`;
          }

          if (failed.length > 0) {
            response += `${failed.map((r) => `${r.name} ${r.error}`).join(", ")}`;
          }

          return response;
        });
      } catch (error) {
        return `Error creating files : ${error instanceof Error ? error.message : "Unknown error"}`;
      }
    },
  });
};
