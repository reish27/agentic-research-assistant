"use client";

import { useRef, useState } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { motion } from "framer-motion";
import { ArrowUp, Square } from "lucide-react";

export function Composer({
  onSend,
  generating,
  onStop,
}: {
  onSend: (text: string) => void;
  generating: boolean;
  onStop: () => void;
}) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed || generating) return;
    onSend(trimmed);
    setValue("");
    textareaRef.current?.focus();
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-6 md:px-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.15 }}
        className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_20px_40px_-15px_rgba(0,0,0,0.5)] backdrop-blur transition-colors focus-within:border-zinc-700"
      >
        <TextareaAutosize
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          minRows={1}
          maxRows={8}
          placeholder={
            generating
              ? "The agent is working — stop it to interject..."
              : "Ask anything..."
          }
          className="w-full resize-none bg-transparent px-4 pt-4 pb-2 text-sm leading-relaxed text-zinc-200 outline-none placeholder:text-zinc-600"
        />
        <div className="flex items-center gap-2 px-3 pb-3">
          <span className="ml-auto" />
          {generating ? (
            <motion.button
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              onClick={onStop}
              className="flex size-8 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-800 text-zinc-200 transition-transform hover:scale-105 active:scale-95"
              aria-label="Stop generation"
            >
              <Square className="size-3 fill-current" strokeWidth={1.5} />
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              transition={{ type: "spring", stiffness: 300, damping: 18 }}
              onClick={submit}
              disabled={!value.trim()}
              className="flex size-8 items-center justify-center rounded-xl bg-emerald-500 text-zinc-950 shadow-[0_0_16px_-4px_rgba(52,211,153,0.35)] disabled:bg-zinc-800 disabled:text-zinc-600 disabled:shadow-none"
              aria-label="Send message"
            >
              <ArrowUp className="size-4" strokeWidth={2} />
            </motion.button>
          )}
        </div>
      </motion.div>
    </div>
  );
}