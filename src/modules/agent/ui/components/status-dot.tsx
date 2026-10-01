"use client";

import { memo } from "react";
import { motion } from "framer-motion";

export const StatusDot = memo(function StatusDot() {
  return (
    <span className="relative flex size-2">
      <motion.span
        className="absolute inline-flex size-full rounded-full bg-emerald-400"
        animate={{ scale: [1, 2], opacity: [0.5, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
      />
      <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
    </span>
  );
});
