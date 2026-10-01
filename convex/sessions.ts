import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("sessions")
      .withIndex("by_updatedAt")
      .order("desc")
      .take(100);
  },
});

export const create = mutation({
  args: { title: v.string(), preview: v.string() },
  handler: async (ctx, { title, preview }) => {
    const now = Date.now();
    const sessionId = await ctx.db.insert("sessions", {
      title,
      preview,
      createdAt: now,
      updatedAt: now,
    });
    return sessionId;
  },
});

// Remembers the programming language pinned for this conversation.
export const setLanguage = mutation({
  args: { sessionId: v.id("sessions"), language: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.sessionId, { language: args.language });
  },
});

// Deletes a session and all of its messages.
export const remove = mutation({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_sessionId_createdAt", (q) => q.eq("sessionId", sessionId))
      .collect();
    for (const message of messages) {
      await ctx.db.delete(message._id);
    }
    await ctx.db.delete(sessionId);
  },
});
