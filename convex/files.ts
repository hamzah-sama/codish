import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  checkExistingName,
  getFilebyId,
  updateProjectsTimestamp,
  verifyAuthAndOwnership,
} from "./utils";
import { Id } from "./_generated/dataModel";

// Query section

export const getFolderContents = query({
  args: {
    projectId: v.id("projects"),
    parentId: v.optional(v.id("files")),
  },
  handler: async (ctx, args) => {
    const { parentId, projectId } = args;
    await verifyAuthAndOwnership(ctx, projectId);
    const files = await ctx.db
      .query("files")
      .withIndex("by_project_parent", (q) =>
        q.eq("projectId", projectId).eq("parentId", parentId),
      )
      .collect();

    const visibleFiles = files.filter(
      (f): f is typeof f & { type: "file" | "folder" } =>
        f.type === "file" || f.type === "folder",
    );

    return visibleFiles.sort((a, b) => {
      if (a.type === "folder" && b.type === "file") return -1;
      if (a.type === "file" && b.type === "folder") return 1;
      return a.name.localeCompare(b.name);
    });
  },
});

// Mutation section
export const createFile = mutation({
  args: {
    projectId: v.id("projects"),
    parentId: v.optional(v.id("files")),
    name: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const { projectId, parentId, name, content } = args;
    const project = await verifyAuthAndOwnership(ctx, projectId);

    await checkExistingName({ ctx, projectId, name, parentId, type: "file" });

    await ctx.db.insert("files", {
      projectId,
      parentId,
      name,
      content,
      type: "file",
      updatedAt: Date.now(),
    });
    await updateProjectsTimestamp(ctx, project._id);
  },
});

export const createFolder = mutation({
  args: {
    projectId: v.id("projects"),
    parentId: v.optional(v.id("files")),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const { projectId, parentId, name } = args;

    const project = await verifyAuthAndOwnership(ctx, projectId);

    await checkExistingName({ ctx, projectId, name, parentId, type: "folder" });

    await ctx.db.insert("files", {
      projectId,
      parentId,
      name,
      type: "folder",
      updatedAt: Date.now(),
    });
    await updateProjectsTimestamp(ctx, project._id);
  },
});

export const rename = mutation({
  args: {
    fileId: v.id("files"),
    newName: v.string(),
  },
  handler: async (ctx, args) => {
    const { fileId, newName } = args;
    const file = await getFilebyId(ctx, fileId);

    await verifyAuthAndOwnership(ctx, file.projectId);

    const siblings = await ctx.db
      .query("files")
      .withIndex("by_project_parent", (q) =>
        q.eq("projectId", file.projectId).eq("parentId", file.parentId),
      )
      .collect();

    const existing = siblings.find(
      (sibling) =>
        sibling.name === newName &&
        sibling.type === file.type &&
        sibling._id !== file._id,
    );

    if (existing) {
      throw new ConvexError(
        `A ${existing.type} with this name already exists in this location.`,
      );
    }

    await ctx.db.patch("files", file._id, { name: newName });

    await updateProjectsTimestamp(ctx, file.projectId);
  },
});

export const deleteById = mutation({
  args: {
    fileId: v.id("files"),
  },

  handler: async (ctx, args) => {
    const file = await getFilebyId(ctx, args.fileId);

    await verifyAuthAndOwnership(ctx, file.projectId);

    const recursivelyDelete = async (fileId: Id<"files">) => {
      const currentFile = await ctx.db.get(fileId);
      if (!currentFile) return;
      if (currentFile.type === "folder") {
        const children = await ctx.db
          .query("files")
          .withIndex("by_parent", (q) => q.eq("parentId", fileId))
          .collect();
        for (const child of children) {
          await recursivelyDelete(child._id);
        }
      }

      if (currentFile.storageId) {
        await ctx.storage.delete(currentFile.storageId);
      }
      await ctx.db.delete(fileId);
    };

    await recursivelyDelete(file._id);

    await updateProjectsTimestamp(ctx, file.projectId);
  },
});
