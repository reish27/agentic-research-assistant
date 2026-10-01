"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import type { ChatMessage, PipelineResult, Session } from "@/modules/agent/types";

// Convex-backed chat store.
// Reads/writes the `sessions` + `messages` tables from the real deployment.

export function useChatStore() {
  const sessionsResult = useQuery(api.sessions.list);
  const sendUserMutation = useMutation(api.messages.sendUser);
  const saveAssistantMutation = useMutation(api.messages.saveAssistant);
  const setLanguageMutation = useMutation(api.sessions.setLanguage);
  const removeSessionMutation = useMutation(api.sessions.remove);

  const [activeId, setActiveId] = useState<Id<"sessions"> | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Keep a ref of the active session so fire-and-forget saves from the
  // view always target the right conversation.
  const sessionIdRef = useRef<Id<"sessions"> | null>(null);
  sessionIdRef.current = activeId;

  const persistedMessages = useQuery(
    api.messages.listBySession,
    activeId ? { sessionId: activeId } : "skip"
  );

  useEffect(() => {
    if (sessionsResult !== undefined) setHydrated(true);
  }, [sessionsResult]);

  const sessions: Session[] = useMemo(
    () =>
      (sessionsResult ?? []).map((s) => ({
        id: s._id,
        title: s.title,
        preview: s.preview,
        updatedAt: s.updatedAt,
      })),
    [sessionsResult]
  );

  const messages: ChatMessage[] = useMemo(
    () =>
      (persistedMessages ?? []).map((m) => {
        let pipeline: PipelineResult | undefined;
        if (m.pipeline) {
          try {
            pipeline = JSON.parse(m.pipeline) as PipelineResult;
          } catch {
            pipeline = undefined;
          }
        }
        return {
          id: m._id,
          role: m.role,
          content: m.content ?? undefined,
          toolCalls: m.toolCalls,
          pipeline,
        };
      }),
    [persistedMessages]
  );

  const activeLanguage = useMemo(() => {
    const found = (sessionsResult ?? []).find((s) => s._id === activeId);
    return found?.language ?? null;
  }, [sessionsResult, activeId]);

  const setActiveSession = useCallback((id: string | null) => {
    setActiveId(id ? (id as Id<"sessions">) : null);
  }, []);

  const newChat = useCallback(() => setActiveSession(null), [setActiveSession]);

  // Persist the user's message (+ create a session if needed).
  // Returns { sessionId, messageId } once committed to Convex.
  const sendUserMessage = useCallback(
    async (content: string, language?: string) => {
      const result = await sendUserMutation({
        sessionId: sessionIdRef.current ?? undefined,
        content,
        language,
      });
      // If this created a new session, switch to it so subsequent saves
      // land in the right conversation.
      if (!sessionIdRef.current) setActiveId(result.sessionId);
      return result;
    },
    [sendUserMutation]
  );

  const saveAssistantMessage = useCallback(
    async (
      content: string,
      pipeline?: PipelineResult,
      sessionId?: Id<"sessions">
    ) => {
      // Explicit target session (captured at send time) so the reply
      // lands in the ORIGINAL chat even if the user switches sessions
      // while the request is still running.
      const sid = sessionId ?? sessionIdRef.current;
      if (!sid) return null;
      await saveAssistantMutation({
        sessionId: sid,
        content,
        pipeline: pipeline ? JSON.stringify(pipeline) : undefined,
      });
      return null;
    },
    [saveAssistantMutation]
  );

  const stopStreaming = useCallback(() => {}, []);

  const deleteSession = useCallback(
    async (sessionId: Id<"sessions">) => {
      await removeSessionMutation({ sessionId });
      // If we deleted the currently active session, clear it.
      if (sessionIdRef.current === sessionId) setActiveId(null);
    },
    [removeSessionMutation]
  );

  const setSessionLanguage = useCallback(
    async (language: string, sessionId?: Id<"sessions">) => {
      const sid = sessionId ?? sessionIdRef.current;
      if (!sid) return;
      await setLanguageMutation({ sessionId: sid, language });
    },
    [setLanguageMutation]
  );

  return {
    hydrated,
    sessions,
    messages,
    activeId,
    setActiveSession,
    newChat,
    sendUserMessage,
    saveAssistantMessage,
    stopStreaming,
    setSessionLanguage,
    activeLanguage,
    deleteSession,
  };
}