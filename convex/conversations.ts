import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { verifyAuth, verifyAuthAndOwnership } from "./utils";

export const create = mutation({
  args: {
    projectId: v.id("projects"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const project = await verifyAuthAndOwnership(ctx, args.projectId);

    const conversationId = await ctx.db.insert("conversations", {
      title: args.title,
      projectId: project._id,
      updatedAt: Date.now(),
    });

    return conversationId;
  },
});

export const getById = query({
  args: {
    id: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    await verifyAuth(ctx);
    const conversation = await ctx.db.get(args.id);
    if (!conversation) {
      throw new Error("conversation not found");
    }
    await verifyAuthAndOwnership(ctx, conversation.projectId);

    return conversation;
  },
});

export const getByProject = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const project = await verifyAuthAndOwnership(ctx, args.projectId);

    return await ctx.db
      .query("conversations")
      .withIndex("by_project", (q) => q.eq("projectId", project._id))
      .order("desc")
      .collect();
  },
});

export const getMessages = query({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    await verifyAuth(ctx);
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) {
      throw new Error("conversation not found");
    }
    await verifyAuthAndOwnership(ctx, conversation.projectId);

    return await ctx.db
      .query("message")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", conversation._id),
      )
      .order("asc")
      .collect();
  },
});
