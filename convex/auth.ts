import { ConvexError } from "convex/values";
import { MutationCtx, QueryCtx } from "./_generated/server";

export const verifyAuthMutation = async (ctx: QueryCtx | MutationCtx) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError("UNAUTHORIZED");
  }
  return identity;
};

