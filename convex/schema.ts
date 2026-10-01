import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const toolCall = v.object({
  id: v.string(),
  kind: v.union(
    v.literal("read"),
    v.literal("edit"),
    v.literal("terminal"),
    v.literal("search")
  ),
  label: v.string(),
  detail: v.string(),
  status: v.union(v.literal("running"), v.literal("done")),
});

export default defineSchema({
  sessions: defineTable({
    title: v.string(),
    preview: v.string(),
    language: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_updatedAt", ["updatedAt"]),

  messages: defineTable({
    sessionId: v.id("sessions"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.optional(v.string()),
    toolCalls: v.optional(v.array(toolCall)),
    pipeline: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_sessionId_createdAt", ["sessionId", "createdAt"]),
});
