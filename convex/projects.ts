import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { verifyAuthMutation } from "./auth";

export const create = mutation({
  args: {
    name: v.string(),
  },

  handler: async (ctx, args) => {
    const identity = await verifyAuthMutation(ctx);
    await ctx.db.insert("projects", {
      name: args.name,
      ownerId: identity.subject,
      updatedAt: Date.now(),
    });
  },
});

export const getPartial = query({
  args: { limit: v.number() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }
    return await ctx.db
      .query("projects")
      .withIndex("by_updated_at", (q) => q.eq("ownerId", identity.subject))
      .order("desc")
      .take(args.limit);
  },
});

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }
    return await ctx.db
      .query("projects")
      .withIndex("by_updated_at", (q) => q.eq("ownerId", identity.subject))
      .order("desc")
      .collect();
  },
});
