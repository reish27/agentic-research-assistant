import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

const MAX_TITLE = 60;
const MAX_PREVIEW = 80;

export const listBySession = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_sessionId_createdAt", (q) => q.eq("sessionId", sessionId))
      .order("asc")
      .collect();
  },
});

export const sendUser = mutation({
  args: {
    sessionId: v.optional(v.id("sessions")),
    content: v.string(),
    language: v.optional(v.string()),
  },
  handler: async (ctx, { sessionId, content, language }) => {
    const now = Date.now();
    let id = sessionId;
    if (id === undefined) {
      id = await ctx.db.insert("sessions", {
        title:
          content.length > MAX_TITLE
            ? `${content.slice(0, MAX_TITLE - 1).trimEnd()}…`
            : content,
        preview: content,
        language,
        createdAt: now,
        updatedAt: now,
      });
    } else {
      const session = await ctx.db.get(id);
      if (!session) throw new Error("Session not found");
      await ctx.db.patch(id, {
        updatedAt: now,
        preview:
          content.length > MAX_PREVIEW
            ? `${content.slice(0, MAX_PREVIEW - 1).trimEnd()}…`
            : content,
      });
    }
    const messageId = await ctx.db.insert("messages", {
      sessionId: id,
      role: "user",
      content,
      createdAt: now,
    });
    return { sessionId: id, messageId };
  },
});

export const saveAssistant = mutation({
  args: {
    sessionId: v.id("sessions"),
    content: v.string(),
    toolCalls: v.optional(
      v.array(
        v.object({
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
        })
      )
    ),
    pipeline: v.optional(v.string()),
  },
  handler: async (ctx, { sessionId, content, toolCalls, pipeline }) => {
    const now = Date.now();
    const messageId = await ctx.db.insert("messages", {
      sessionId,
      role: "assistant",
      content,
      toolCalls,
      pipeline,
      createdAt: now,
    });
    await ctx.db.patch(sessionId, { updatedAt: now });
    return messageId;
  },
});
