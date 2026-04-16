import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// validate internal key to prevent unauthorized access and not depend on convex auth
const validateInternalKey = (key: string) => {
  const internalKey = process.env.CODISH_CONVEX_INTERNAL_KEY;
  if (!internalKey) {
    throw new Error("Internal key not found");
  }
  if (key !== internalKey) {
    throw new Error("Invalid internal key");
  }
};

// get conversation by id for a specific project
export const getConversationById = query({
  args: {
    internalKey: v.string(),
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    validateInternalKey(args.internalKey);
    return await ctx.db.get(args.conversationId);
  },
});

// create message for a conversation
export const createMessage = mutation({
  args: {
    internalKey: v.string(),
    conversationId: v.id("conversations"),
    content: v.string(),
    projectId: v.id("projects"),
    status: v.optional(
      v.union(
        v.literal("processing"),
        v.literal("completed"),
        v.literal("cancelled"),
      ),
    ),
    role: v.union(v.literal("user"), v.literal("assistant")),
  },

  handler: async (ctx, args) => {
    validateInternalKey(args.internalKey);
    const messageId = await ctx.db.insert("message", {
      conversationId: args.conversationId,
      content: args.content,
      projectId: args.projectId,
      role: args.role,
      ...(args.status ? { status: args.status } : {}),
    });

    // update conversation's updateAt after creating a new message
    await ctx.db.patch("conversations", args.conversationId, {
      updatedAt: Date.now(),
    });

    return messageId;
  },
});

export const getProcessingMessage = query({
  args: {
    internalKey: v.string(),
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    validateInternalKey(args.internalKey);
    return await ctx.db
      .query("message")
      .withIndex("by_conversation_status", (q) =>
        q.eq("conversationId", args.conversationId).eq("status", "processing"),
      )
      .collect();
  },
});

export const updateMessageContent = mutation({
  args: {
    internalKey: v.string(),
    messageId: v.id("message"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    validateInternalKey(args.internalKey);
    await ctx.db.patch("message", args.messageId, {
      content: args.content,
      status: "completed" as const,
    });
  },
});

export const updateMessageStatus = mutation({
  args: {
    messageId: v.id("message"),
    internalKey: v.string(),
    status: v.union(
      v.literal("processing"),
      v.literal("completed"),
      v.literal("cancelled"),
    ),
  },
  handler: async (ctx, args) => {
    validateInternalKey(args.internalKey);
    await ctx.db.patch("message", args.messageId, {
      status: args.status,
    });
  },
});

export const updateConversationTitle = mutation({
  args: {
    conversationId: v.id("conversations"),
    internalKey: v.string(),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    validateInternalKey(args.internalKey);
    await ctx.db.patch("conversations", args.conversationId, {
      title: args.title,
      updatedAt: Date.now(),
    });
  },
});

// get recent messages for context understanding, with an optional limit (default to 10)
export const getRecentMessages = query({
  args: {
    internalKey: v.string(),
    conversationId: v.id("conversations"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    validateInternalKey(args.internalKey);
    const messages = await ctx.db
      .query("message")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId),
      )
      .order("asc")
      .collect();

    const limit = args.limit ?? 10;
    return messages.slice(-limit);
  },
});

export const getProjectFiles = query({
  args: {
    internalKey: v.string(),
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    validateInternalKey(args.internalKey);
    return await ctx.db
      .query("files")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
  },
});

export const getProjectById = query({
  args: {
    internalKey: v.string(),
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    validateInternalKey(args.internalKey);
    return await ctx.db.get(args.projectId);
  },
});

// used for agent to 'read file' tool, get file content by id
export const getFileById = query({
  args: {
    internalKey: v.string(),
    fileId: v.id("files"),
  },
  handler: async (ctx, args) => {
    validateInternalKey(args.internalKey);
    return await ctx.db.get(args.fileId);
  },
});

// used for agent to 'update file'
export const updateFileContent = mutation({
  args: {
    internalKey: v.string(),
    fileId: v.id("files"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    validateInternalKey(args.internalKey);
    await ctx.db.patch("files", args.fileId, {
      content: args.content,
      updatedAt: Date.now(),
    });
  },
});

// used for agents to 'rename file
export const renameFiles = mutation({
  args: {
    internalKey: v.string(),
    fileId: v.id("files"),
    newName: v.string(),
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    validateInternalKey(args.internalKey);
    const file = await ctx.db.get(args.fileId);
    if (!file) {
      throw new Error("file not found");
    }

    const siblings = await ctx.db
      .query("files")
      .withIndex("by_project_parent", (q) =>
        q.eq("projectId", file.projectId).eq("parentId", file.parentId),
      )
      .collect();

    const existing = siblings.find(
      (sibling) =>
        sibling.name === args.newName &&
        sibling._id !== file._id &&
        sibling.type === file.type,
    );

    if (existing) {
      throw new Error(
        `A ${existing.type} with this name already exists in this location.`,
      );
    }

    await ctx.db.patch("files", args.fileId, {
      name: args.newName,
      updatedAt: Date.now(),
    });

    await ctx.db.patch("projects", args.projectId, {
      updatedAt: Date.now(),
    });
  },
});

// used for agent to 'delete file'
export const deleteFile = mutation({
  args: {
    fileId: v.id("files"),
    internalKey: v.string(),
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    validateInternalKey(args.internalKey);

    const recursivelyDelete = async (fileId: Id<"files">) => {
      const currentFile = await ctx.db.get("files", fileId);
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

    await recursivelyDelete(args.fileId);

    await ctx.db.patch("projects", args.projectId, { updatedAt: Date.now() });
  },
});

export const createFolder = mutation({
  args: {
    internalKey: v.string(),
    projectId: v.id("projects"),
    name: v.string(),
    parentId: v.optional(v.id("files")),
  },
  handler: async (ctx, args) => {
    validateInternalKey(args.internalKey);
    const files = await ctx.db
      .query("files")
      .withIndex("by_project_parent", (q) =>
        q.eq("projectId", args.projectId).eq("parentId", args.parentId),
      )
      .collect();

    const existingFiles = files.find(
      (file) => file.name === args.name && file.type === "folder",
    );

    if (existingFiles) {
      throw new Error(
        `folder with name ${args.name} already exist in this location`,
      );
    }

    const newFolderId = await ctx.db.insert("files", {
      name: args.name,
      parentId: args.parentId,
      projectId: args.projectId,
      type: "folder",
      updatedAt: Date.now(),
    });

    await ctx.db.patch("projects", args.projectId, {
      updatedAt: Date.now(),
    });

    return newFolderId;
  },
});

export const createFile = mutation({
  args: {
    internalKey: v.string(),
    projectId: v.id("projects"),
    parentId: v.optional(v.id("files")),
    name: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    validateInternalKey(args.internalKey);
    const files = await ctx.db
      .query("files")
      .withIndex("by_project_parent", (q) =>
        q.eq("projectId", args.projectId).eq("parentId", args.parentId),
      )
      .collect();

    const existingFiles = files.find(
      (file) => file.name === args.name && file.type === "file",
    );

    if (existingFiles) {
      throw new Error(
        `file with name ${args.name} already exist in this location`,
      );
    }

    const newFileId = await ctx.db.insert("files", {
      name: args.name,
      parentId: args.parentId,
      projectId: args.projectId,
      type: "file",
      content: args.content,
      updatedAt: Date.now(),
    });

    await ctx.db.patch("projects", args.projectId, {
      updatedAt: Date.now(),
    });

    return newFileId;
  },
});

export const createFiles = mutation({
  args: {
    internalKey: v.string(),
    projectId: v.id("projects"),
    parentId: v.optional(v.id("files")),
    files: v.array(v.object({ name: v.string(), content: v.string() })),
  },
  handler: async (ctx, args) => {
    validateInternalKey(args.internalKey);
    const existingFiles = await ctx.db
      .query("files")
      .withIndex("by_project_parent", (q) =>
        q.eq("projectId", args.projectId).eq("parentId", args.parentId),
      )
      .collect();

    const result: { name: string; fileId: string; error?: string }[] = [];
    for (const file of args.files) {
      const existing = existingFiles.find(
        (f) => f.name === file.name && f.type === "file",
      );

      if (existing) {
        result.push({
          name: file.name,
          fileId: existing._id,
          error: "File already exists",
        });
        continue;
      }

      const newFileId = await ctx.db.insert("files", {
        name: file.name,
        content: file.content,
        parentId: args.parentId,
        projectId: args.projectId,
        type: "file",
        updatedAt: Date.now(),
      });

      result.push({ name: file.name, fileId: newFileId });
    }

    return result;
  },
});

export const createBinaryFile = mutation({
  args: {
    internalKey: v.string(),
    projectId: v.id("projects"),
    parentId: v.optional(v.id("files")),
    name: v.string(),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    validateInternalKey(args.internalKey);
    const files = await ctx.db
      .query("files")
      .withIndex("by_project_parent", (q) =>
        q.eq("projectId", args.projectId).eq("parentId", args.parentId),
      )
      .collect();

    const existingFiles = files.find(
      (file) => file.name === args.name && file.type === "file",
    );

    if (existingFiles) {
      throw new Error(
        `file with name ${args.name} already exist in this location`,
      );
    }

    const newFileId = await ctx.db.insert("files", {
      name: args.name,
      parentId: args.parentId,
      projectId: args.projectId,
      type: "file",
      storageId: args.storageId,
      updatedAt: Date.now(),
    });

    await ctx.db.patch("projects", args.projectId, {
      updatedAt: Date.now(),
    });

    return newFileId;
  },
});

export const cleanUpFiles = mutation({
  args: {
    internalKey: v.string(),
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    validateInternalKey(args.internalKey);
    const files = await ctx.db
      .query("files")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    for (const file of files) {
      if (file.storageId) {
        await ctx.storage.delete(file.storageId);
      }
      await ctx.db.delete(file._id);
    }
  },
});

export const updateImportStatus = mutation({
  args: {
    internalKey: v.string(),
    projectId: v.id("projects"),
    status: v.optional(
      v.union(
        v.literal("importing"),
        v.literal("completed"),
        v.literal("failed"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    validateInternalKey(args.internalKey);
    await ctx.db.patch("projects", args.projectId, {
      importStatus: args.status,
      updatedAt: Date.now(),
    });
  },
});

export const createProjectByImport = mutation({
  args: {
    internalKey: v.string(),
    name: v.string(),
    ownerId: v.string(),
    githubOwner: v.string(),
    githubRepo: v.string(),
  },
  handler: async (ctx, args) => {
    validateInternalKey(args.internalKey);
    const projectId = await ctx.db.insert("projects", {
      name: args.name,
      ownerId: args.ownerId,
      importStatus: "importing",
      githubOwner: args.githubOwner,
      githubRepo: args.githubRepo,
      updatedAt: Date.now(),
    });
    return projectId;
  },
});

export const generateUploadUrl = mutation({
  args: {
    internalKey: v.string(),
  },
  handler: async (ctx, args) => {
    validateInternalKey(args.internalKey);
    return await ctx.storage.generateUploadUrl();
  },
});

export const updateExportStatus = mutation({
  args: {
    internalKey: v.string(),
    projectId: v.id("projects"),
    status: v.optional(
      v.union(
        v.literal("exporting"),
        v.literal("completed"),
        v.literal("failed"),
        v.literal("cancelled"),
      ),
    ),
    exportRepoUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    validateInternalKey(args.internalKey);
    await ctx.db.patch("projects", args.projectId, {
      exportStatus: args.status,
      updatedAt: Date.now(),
      exportRepoUrl: args.exportRepoUrl,
    });
  },
});

export const getProjectwithUrl = query({
  args: {
    internalKey: v.string(),
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    validateInternalKey(args.internalKey);
    const files = await ctx.db
      .query("files")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    return await Promise.all(
      files.map(async (file) => {
        if (file.storageId) {
          const url = await ctx.storage.getUrl(file.storageId);
          return { ...file, storageUrl: url };
        }
        return { ...file, storageUrl: null };
      }),
    );
  },
});
