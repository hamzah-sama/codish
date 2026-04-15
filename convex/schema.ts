import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  projects: defineTable({
    name: v.string(),
    ownerId: v.string(),
    updatedAt: v.number(),
    importStatus: v.optional(
      v.union(
        v.literal("importing"),
        v.literal("completed"),
        v.literal("failed"),
      ),
    ),
    settings: v.optional(
      v.object({
        installCommand: v.optional(v.string()),
        devCommand: v.optional(v.string()),
      }),
    ),
    githubOwner: v.optional(v.string()),
    githubRepo: v.optional(v.string()),
  })
    .index("by_owner", ["ownerId"])
    .index("by_updated_at", ["ownerId", "updatedAt"]),

  files: defineTable({
    projectId: v.id("projects"),
    parentId: v.optional(v.id("files")),
    name: v.string(),
    type: v.union(v.literal("folder"), v.literal("file"), v.literal("binary")),
    content: v.optional(v.string()), // Only for type "file"
    storageId: v.optional(v.id("_storage")), // Only for type "binary"
    updatedAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_parent", ["parentId"])
    .index("by_project_parent", ["projectId", "parentId"]),

  conversations: defineTable({
    projectId: v.id("projects"),
    title: v.string(),
    updatedAt: v.number(),
  }).index("by_project", ["projectId"]),

  message: defineTable({
    conversationId: v.id("conversations"),
    projectId: v.id("projects"),
    content: v.string(),
    role: v.union(v.literal("user"), v.literal("assistant")),
    status: v.optional(
      v.union(
        v.literal("processing"),
        v.literal("completed"),
        v.literal("cancelled"),
      ),
    ),
  })
    .index("by_conversation", ["conversationId"])
    .index("by_conversation_status", ["conversationId", "status"])
    .index("by_project_status", ["projectId", "status"]),
});
