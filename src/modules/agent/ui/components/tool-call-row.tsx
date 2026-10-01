"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  FilePen,
  Terminal,
  Search,
  Check,
  LoaderCircle,
} from "lucide-react";
import type { ToolCall as ToolCallType } from "../../types";

const ICONS = {
  read: FileText,
  edit: FilePen,
  terminal: Terminal,
  search: Search,
} as const;

export function ToolCallRow({ tool }: { tool: ToolCallType }) {
  const Icon = ICONS[tool.kind];
  const running = tool.status === "running";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className="group flex items-center gap-3 rounded-xl border border-zinc-800/80 bg-zinc-900/60 px-3.5 py-2.5"
    >
      <div
        className={`flex size-7 shrink-0 items-center justify-center rounded-lg border ${
          running
            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
            : "border-zinc-700/60 bg-zinc-800/60 text-zinc-400"
        }`}
      >
        <Icon className="size-3.5" strokeWidth={1.5} />
      </div>
      <span className="shrink-0 font-mono text-xs font-medium text-zinc-300">
        {tool.label}
      </span>
      <span className="truncate font-mono text-xs text-zinc-500">
        {tool.detail}
      </span>
      <div className="ml-auto shrink-0">
        <AnimatePresence mode="wait" initial={false}>
          {running ? (
            <motion.span
              key="spin"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
            >
              <LoaderCircle className="size-3.5 animate-spin text-emerald-400" strokeWidth={1.5} />
            </motion.span>
          ) : (
            <motion.span
              key="check"
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.4 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
              className="flex size-4 items-center justify-center rounded-full bg-emerald-500/15"
            >
              <Check className="size-2.5 text-emerald-400" strokeWidth={2.5} />
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
