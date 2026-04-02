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
