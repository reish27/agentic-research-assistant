"use client";

import { memo } from "react";
import { motion } from "framer-motion";

export const TypingIndicator = memo(function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 py-1" aria-label="Agent is thinking">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="size-1.5 rounded-full bg-emerald-400/70"
          animate={{ opacity: [0.25, 1, 0.25], y: [0, -2, 0] }}
          transition={{
            duration: 1.1,
            repeat: Infinity,
            delay: i * 0.18,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
});
