"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PanelLeft, GitBranch, CircleSlash, Sparkles } from "lucide-react";
import { AgentSidebar } from "../components/agent-sidebar";
import { Composer } from "../components/composer";
import { MessageBubble } from "../components/message-bubble";
import { TypingIndicator } from "../components/typing-indicator";
import { StatusDot } from "../components/status-dot";
import { useChatStore } from "@/lib/chat-store";
import type { Session } from "../../types";

type Phase = "idle" | "thinking";

const API_ENDPOINT =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/ask";

function EmptyState({ onPick }: { onPick: (text: string) => void }) {
  const suggestions = [
    "Why is the dev server recompiling on every save?",
    "Profile the /projects route for waterfalls",
    "Write tests for the usage limiter",
    "Explain the lifecycle module in one paragraph",
  ];

  return (
    <div className="flex flex-col items-center justify-center px-4 py-24 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="flex size-12 items-center justify-center rounded-2xl border border-emerald-500/25 bg-emerald-500/10"
      >
        <Sparkles className="size-5 text-emerald-400" strokeWidth={1.5} />
      </motion.div>
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="mt-6 text-2xl font-semibold tracking-tight text-zinc-100"
      >
        What are we shipping today?
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.14 }}
        className="mt-2 max-w-[42ch] text-sm leading-relaxed text-zinc-500"
      >
        A multi-agent research system spins up to answer — reasoning, writing
        code, and verifying it before replying.
      </motion.p>
      <div className="mt-8 grid w-full max-w-xl grid-cols-1 gap-2 sm:grid-cols-2">
        {suggestions.map((s, i) => (
          <motion.button
            key={s}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.2 + i * 0.06,
              type: "spring",
              stiffness: 100,
              damping: 20,
            }}
            onClick={() => onPick(s)}
            className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3 text-left text-[13px] leading-snug text-zinc-400 transition-all hover:border-emerald-500/30 hover:bg-emerald-500/5 hover:text-zinc-200 active:scale-[0.98]"
          >
            {s}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

export function AgentView() {
  const {
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
  } = useChatStore();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, phase]);

  const activeTitle =
    sessions.find((s) => s.id === activeId)?.title ?? "New session";

  const runPlan = useCallback(
    async (prompt: string) => {
      setError(null);
      setPhase("thinking");

      // Full conversation context so the LLM can follow up on previous turns.
      // Snapshot BEFORE persisting, so we don't double-include the new prompt.
      const history = [
        ...messages
          .filter((m) => m.content)
          .map((m) => ({ role: m.role, content: m.content ?? "" })),
        { role: "user", content: prompt },
      ];

      // Persist the user message (creates the session on first message).
      // Capture the target session id so the reply lands in THIS chat even
      // if the user switches sessions mid-request.
      const { sessionId } = await sendUserMessage(
        prompt,
        activeLanguage ?? undefined
      );

      try {
        // Remembered language from this chat (memory). Since the backend
        // only supports Python, this stays pinned to "python" after the
        // first code question in a session.
        const rememberedLanguage = activeLanguage ?? undefined;

        const response = await fetch(API_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: prompt,
            language: rememberedLanguage,
            history,
          }),
        });

        if (!response.ok) {
          throw new Error(`Backend responded ${response.status}`);
        }

        const data = await response.json();

        if (data.error) {
          setError(data.error);
          saveAssistantMessage(
            `_Error:_ ${data.error}`,
            {
              status: "error",
              error: data.error,
            },
            sessionId
          );
        } else if (data.reasoning || data.code || data.mode === "answer") {
          saveAssistantMessage(
            data.answer ?? "Done.",
            {
              mode: data.mode,
              status: data.status,
              language: data.language,
              answer: data.answer,
              reasoning: data.reasoning,
              code: data.code,
              compile: data.compile,
              test: data.test,
              error: data.error,
            },
            sessionId
          );

          // Pin the language for the rest of this chat (memory).
          if (data.language) setSessionLanguage(data.language, sessionId);
        } else if (typeof data.answer === "string" && data.answer.trim()) {
          saveAssistantMessage(
            data.answer,
            {
              status: "success",
              language: data.language,
              mode: data.mode,
              answer: data.answer,
            },
            sessionId
          );
          if (data.language) setSessionLanguage(data.language, sessionId);
        } else {
          setError("The agent returned an empty response.");
          saveAssistantMessage(
            "_The agent returned an empty response._",
            { status: "error", error: "Empty response" },
            sessionId
          );
        }
      } catch (err) {
        const message =
          err instanceof Error
            ? `Could not reach the agent at ${API_ENDPOINT}.\n${err.message}`
            : "Could not reach the agent. Is the backend running?";
        setError(message);
        saveAssistantMessage(`_${message.split("\n")[0]}_`, undefined, sessionId);
      } finally {
        setPhase("idle");
      }
    },
    [sendUserMessage, setActiveSession, saveAssistantMessage, activeLanguage, setSessionLanguage, messages]
  );

  const handleStop = useCallback(() => {
    stopStreaming();
    setPhase("idle");
  }, [stopStreaming]);

  const resetToSession = useCallback(
    (id: string | null) => {
      stopStreaming();
      setPhase("idle");
      setError(null);
      setActiveSession(id);
    },
    [setActiveSession, stopStreaming]
  );

  const sessionsForSidebar: Session[] = useMemo(
    () =>
      sessions.map((s) => ({
        id: s.id,
        title: s.title,
        preview: s.preview,
        updatedAt: s.updatedAt,
      })),
    [sessions]
  );

  if (!hydrated) {
    return (
      <div className="flex h-dvh items-center justify-center bg-zinc-950">
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <TypingIndicator />
          Loading…
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-dvh overflow-hidden bg-zinc-950 font-sans text-zinc-100">
      <div className="hidden md:block">
        <AgentSidebar
          sessions={sessionsForSidebar}
          activeSession={activeId ?? ""}
          onSelectSession={(id) => resetToSession(id)}
          onNewChat={() => resetToSession(null)}
          onDeleteSession={(id) => deleteSession(id as never)}
        />
      </div>

      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 260, damping: 30 }}
              className="fixed inset-y-0 left-0 z-40 md:hidden"
            >
              <AgentSidebar
                sessions={sessionsForSidebar}
                activeSession={activeId ?? ""}
                onSelectSession={(id) => {
                  resetToSession(id);
                  setSidebarOpen(false);
                }}
                onNewChat={() => {
                  resetToSession(null);
                  setSidebarOpen(false);
                }}
                onDeleteSession={(id) => deleteSession(id as never)}
                onClose={() => setSidebarOpen(false)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-zinc-800/70 px-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-800/60 hover:text-zinc-300 md:hidden"
            aria-label="Open sidebar"
          >
            <PanelLeft className="size-4" strokeWidth={1.5} />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-sm font-medium tracking-tight text-zinc-200">
              {activeTitle}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-1.5 font-mono text-xs text-zinc-500 sm:flex">
              <GitBranch className="size-3.5" strokeWidth={1.5} />
              main
            </span>
            {activeLanguage && (
              <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 font-mono text-[11px] font-medium text-emerald-400">
                <span className="size-1.5 rounded-full bg-emerald-400" />
                {activeLanguage}
              </span>
            )}
            <AnimatePresence mode="wait">
              {phase === "idle" ? (
                <motion.span
                  key="ready"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 px-2.5 py-1 text-[11px] font-medium text-zinc-400"
                >
                  <StatusDot />
                  Ready
                </motion.span>
              ) : (
                <motion.span
                  key="busy"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 font-mono text-[11px] font-medium text-emerald-400"
                >
                  <CircleSlash
                    className="size-3 animate-spin [animation-duration:2.5s]"
                    strokeWidth={1.5}
                  />
                  Researching
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          {messages.length === 0 && phase === "idle" ? (
            <EmptyState onPick={runPlan} />
          ) : (
            <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8 md:px-6">
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
              {phase === "thinking" && !messages.some((m) => m.role === "assistant") && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 pl-11 text-xs text-zinc-600"
                >
                  Multi-agent system is researching your question
                  <TypingIndicator />
                </motion.div>
              )}
              {error && phase === "idle" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 pl-11 text-xs text-red-400"
                >
                  {error}
                </motion.div>
              )}
            </div>
          )}
        </div>

        <Composer onSend={runPlan} generating={phase !== "idle"} onStop={handleStop} />
      </main>
    </div>
  );
}