import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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
export const renameFIles = mutation({
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
        sibling._id !== file.type &&
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
  },
});
