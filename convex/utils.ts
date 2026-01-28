import { ConvexError } from "convex/values";
import { MutationCtx, QueryCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";

export const verifyAuth = async (ctx: QueryCtx | MutationCtx) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError("UNAUTHORIZED");
  }
  return identity;
};

export const verifyAuthAndOwnership = async (
  ctx: QueryCtx | MutationCtx,
  projectId: Id<"projects">,
) => {
  const identity = await verifyAuth(ctx);
  const project = await ctx.db.get("projects", projectId);
  if (!project) {
    throw new ConvexError("project not found");
  }
  if (project.ownerId !== identity.subject) {
    throw new ConvexError("you are not the owner of this project");
  }
  return project;
};

export const checkExistingName = async ({
  ctx,
  parentId,
  projectId,
  name,
  type,
}: {
  ctx: QueryCtx | MutationCtx;
  parentId?: Id<"files">;
  projectId: Id<"projects">;
  name: string;
  type: "file" | "folder";
}) => {
  const existing = await ctx.db
    .query("files")
    .withIndex("by_project_parent", (q) =>
      q.eq("projectId", projectId).eq("parentId", parentId),
    )
    .collect()
    .then((files) =>
      files.find((file) => file.name === name && file.type === type),
    );

  if (existing) {
    throw new ConvexError(
      `A ${existing.type} with this name already exists in this location.`,
    );
  }
};

export const getFilebyId = async (
  ctx: QueryCtx | MutationCtx,
  fileId: Id<"files">,
) => {
  const file = await ctx.db.get("files", fileId);
  if (!file) {
    throw new ConvexError("File or folder not found");
  }
  return file;
};

export const updateProjectsTimestamp = async (
  ctx: MutationCtx,
  projectId: Id<"projects">,
) => {
  await ctx.db.patch("projects", projectId, { updatedAt: Date.now() });
};
