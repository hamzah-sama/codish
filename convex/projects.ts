import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { verifyAuth } from "./verify.auth";

// Query section
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

export const getProjectById = query({
  args: { id: v.id("projects") },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);
    const project = await ctx.db.get("projects", args.id);
    if (!project) return null;
    if (project.ownerId !== identity.subject) {
      throw new Error("You are not the owner of this project");
    }
    return project;
  },
});

export const getProjectName = query({
  args: { id: v.id("projects") },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);
    const project = await ctx.db.get("projects", args.id);
    if (!project) return null;
    if (project.ownerId !== identity.subject) {
      throw new Error("You are not the owner of this project");
    }
    return project.name;
  },
});

export const getProjectStatus = query({
  args: { id: v.id("projects") },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);
    const project = await ctx.db.get("projects", args.id);
    if (!project) return null;
    if (project.ownerId !== identity.subject) {
      throw new Error("You are not the owner of this project");
    }
    return { status: project.importStatus, updatedAt: project.updatedAt };
  },
});

// Mutation section
export const create = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);
    await ctx.db.insert("projects", {
      name: args.name,
      ownerId: identity.subject,
      updatedAt: Date.now(),
    });
  },
});

export const renameProject = mutation({
  args: { id: v.id("projects"), name: v.string() },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);
    const project = await ctx.db.get("projects", args.id);
    if (!project) return null;
    if (project.ownerId !== identity.subject) {
      throw new Error("You are not the owner of this project");
    }
    await ctx.db.patch(project._id, { name: args.name, updatedAt: Date.now() });
  },
});
