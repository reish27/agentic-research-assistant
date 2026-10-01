"use client";

import { motion } from "framer-motion";
import { Plus, MessageSquare, X, ChevronsLeftRight, Trash2 } from "lucide-react";
import type { Session } from "../../types";

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(ts: number) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function groupSessions(sessions: Session[]) {
  const today = startOfDay(Date.now());
  const groups: { label: string; sessions: Session[] }[] = [
    { label: "Today", sessions: [] },
    { label: "Yesterday", sessions: [] },
    { label: "Earlier", sessions: [] },
  ];
  for (const session of sessions) {
    const day = startOfDay(session.updatedAt);
    if (day === today) groups[0].sessions.push(session);
    else if (day === today - DAY_MS) groups[1].sessions.push(session);
    else groups[2].sessions.push(session);
  }
  return groups.filter((g) => g.sessions.length > 0);
}

function SessionGroup({
  label,
  sessions,
  activeId,
  onSelect,
  onDelete,
}: {
  label: string;
  sessions: Session[];
  activeId: string;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="space-y-1">
      <p className="px-3 pb-1 text-[11px] font-medium uppercase tracking-widest text-zinc-600">
        {label}
      </p>
      {sessions.map((session) => (
        <div
          key={session.id}
          onClick={() => onSelect(session.id)}
          className="group relative flex w-full cursor-pointer items-start gap-2.5 rounded-lg px-3 py-2 text-left transition-colors hover:bg-zinc-800/50 active:scale-[0.99]"
        >
          {session.id === activeId && (
            <motion.span
              layoutId="active-session"
              className="absolute inset-0 rounded-lg border border-zinc-700/60 bg-zinc-800/70"
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
            />
          )}
          <MessageSquare
            className={`relative mt-0.5 size-3.5 shrink-0 ${
              session.id === activeId ? "text-emerald-400" : "text-zinc-600"
            }`}
            strokeWidth={1.5}
          />
          <span className="relative min-w-0 flex-1">
            <span
              className={`block truncate text-[13px] font-medium ${
                session.id === activeId ? "text-zinc-100" : "text-zinc-400"
              }`}
            >
              {session.title}
            </span>
            <span className="block truncate text-xs text-zinc-600">
              {session.preview}
            </span>
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(session.id);
            }}
            className="relative z-10 hidden rounded-md p-1 text-zinc-600 transition-colors hover:bg-red-500/10 hover:text-red-400 group-hover:block"
            aria-label={`Delete ${session.title}`}
            title="Delete chat"
          >
            <Trash2 className="size-3.5" strokeWidth={1.5} />
          </button>
        </div>
      ))}
    </div>
  );
}

export function AgentSidebar({
  sessions,
  activeSession,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onClose,
}: {
  sessions: Session[];
  activeSession: string;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  onClose?: () => void;
}) {
  const groups = groupSessions(sessions);

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col border-r border-zinc-800/70 bg-zinc-950/80">
      <div className="flex items-center justify-between px-4 pt-5 pb-4">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500 font-mono text-sm font-bold text-zinc-950">
            R
          </div>
          <span className="text-sm font-semibold tracking-tight text-zinc-100">
            Rida<span className="text-emerald-400">.</span>agent
          </span>
        </div>
        {onClose ? (
          <button
            onClick={onClose}
            className="rounded-md p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 md:hidden"
            aria-label="Close sidebar"
          >
            <X className="size-4" strokeWidth={1.5} />
          </button>
        ) : (
          <ChevronsLeftRight className="size-4 text-zinc-700" strokeWidth={1.5} />
        )}
      </div>

      <div className="px-3 pb-3">
        <button
          onClick={onNewChat}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-700/60 bg-zinc-800/40 px-3 py-2.5 text-sm font-medium text-zinc-200 transition-all hover:border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-300 active:scale-[0.98]"
        >
          <Plus className="size-4" strokeWidth={1.5} />
          New session
        </button>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-4 [scrollbar-width:thin]">
        {groups.map((group) => (
          <SessionGroup
            key={group.label}
            label={group.label}
            sessions={group.sessions}
            activeId={activeSession}
            onSelect={onSelectSession}
            onDelete={onDeleteSession}
          />
        ))}
      </nav>
    </aside>
  );
}
