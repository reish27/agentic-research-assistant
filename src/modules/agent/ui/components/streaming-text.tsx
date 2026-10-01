"use client";

import { memo, useEffect, useRef, useState } from "react";

export const StreamingText = memo(function StreamingText({
  text,
  speedMs = 12,
}: {
  text: string;
  speedMs?: number;
}) {
  const [count, setCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setCount(0);
    intervalRef.current = setInterval(() => {
      setCount((c) => {
        if (c >= text.length) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return c;
        }
        return c + 3;
      });
    }, speedMs);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [text, speedMs]);

  const done = count >= text.length;
  const visible = text.slice(0, count);

  return (
    <span className="whitespace-pre-wrap">
      {visible}
      {!done && (
        <span className="ml-0.5 inline-block h-4 w-[7px] translate-y-[3px] animate-pulse bg-emerald-400/80" />
      )}
    </span>
  );
});
