"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ChevronDown,
  Globe,
  Lightbulb,
  Keyboard,
  Monitor,
  ListOrdered,
  ShieldAlert,
  Gauge,
  HardDrive,
} from "lucide-react";

interface ReasoningSection {
  title: string;
  body: string;
  lines: string[];
}

// Section headers we expect from Agent 1's reasoning output.
const SECTION_HEADERS = [
  "PROBLEM UNDERSTANDING",
  "INPUT FORMAT",
  "OUTPUT FORMAT",
  "ALGORITHM",
  "IMPORTANT EDGE CASES",
  "TIME COMPLEXITY",
  "SPACE COMPLEXITY",
];

function parseReasoning(text: string): {
  language: string | null;
  sections: ReasoningSection[];
} {
  let language: string | null = null;

  // LANGUAGE is special — parse it first, strip it from the body.
  const langMatch = text.match(/LANGUAGE:\s*([^\n]+)/i);
  if (langMatch) language = langMatch[1].trim();

  // Find each section header's start index.
  const positions: { header: string; index: number }[] = [];
  const headerRe = new RegExp(
    `^(${SECTION_HEADERS.map((h) => h.replace(/ /g, "\\s+")).join("|")})\\s*:`,
    "gm"
  );
  let match: RegExpExecArray | null;
  while ((match = headerRe.exec(text)) !== null) {
    positions.push({ header: match[1].replace(/\s+/g, " "), index: match.index });
  }

  if (positions.length === 0) {
    // No recognizable structure — show raw text.
    return { language, sections: [{ title: "Overview", body: text.trim(), lines: [] }] };
  }

  const sections: ReasoningSection[] = [];
  for (let i = 0; i < positions.length; i++) {
    const start = positions[i].index;
    const headerAt = text.indexOf(":", start) + 1;
    const end = i + 1 < positions.length ? positions[i + 1].index : text.length;
    const raw = text.slice(headerAt, end).trim();
    sections.push({
      title: positions[i].header,
      body: raw,
      lines: raw.split("\n").map((l) => l.trim()).filter(Boolean),
    });
  }

  return { language, sections };
}

const SECTION_META: Record<
  string,
  { icon: React.ReactNode; accent: string }
> = {
  "PROBLEM UNDERSTANDING": { icon: <Lightbulb className="size-3.5" strokeWidth={1.5} />, accent: "text-amber-400" },
  "INPUT FORMAT": { icon: <Keyboard className="size-3.5" strokeWidth={1.5} />, accent: "text-sky-400" },
  "OUTPUT FORMAT": { icon: <Monitor className="size-3.5" strokeWidth={1.5} />, accent: "text-violet-400" },
  ALGORITHM: { icon: <ListOrdered className="size-3.5" strokeWidth={1.5} />, accent: "text-emerald-400" },
  "IMPORTANT EDGE CASES": { icon: <ShieldAlert className="size-3.5" strokeWidth={1.5} />, accent: "text-rose-400" },
  "TIME COMPLEXITY": { icon: <Gauge className="size-3.5" strokeWidth={1.5} />, accent: "text-cyan-400" },
  "SPACE COMPLEXITY": { icon: <HardDrive className="size-3.5" strokeWidth={1.5} />, accent: "text-teal-400" },
};

function isList(lines: string[]) {
  return lines.some((l) => /^[-•*]|\d+[.)]/.test(l));
}

function SectionBody({ section }: { section: ReasoningSection }) {
  const lines = section.lines;

  const md = (
    <div className="md-content text-[13px] leading-relaxed text-zinc-400">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="mb-1.5 last:mb-0">{children}</p>,
          ul: ({ children }) => (
            <ul className="mb-1.5 list-disc space-y-1 pl-5">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-1.5 list-decimal space-y-1 pl-5">{children}</ol>
          ),
          li: ({ children }) => <li className="text-zinc-400">{children}</li>,
          strong: ({ children }) => (
            <strong className="font-semibold text-zinc-100">{children}</strong>
          ),
          code: ({ className, children, ...props }) => {
            const isBlock = className?.includes("language-") || String(children).includes("\n");
            if (isBlock) {
              return (
                <pre className="mb-2 mt-1 overflow-x-auto rounded-lg border border-zinc-800 bg-[#0a0a0c] p-3 font-mono text-[12px] leading-relaxed text-zinc-300">
                  <code>{children}</code>
                </pre>
              );
            }
            return (
              <code
                className="rounded-md border border-zinc-800 bg-zinc-900/80 px-1.5 py-0.5 font-mono text-[12px] text-emerald-300"
                {...props}
              >
                {children}
              </code>
            );
          },
        }}
      >
        {section.body}
      </ReactMarkdown>
    </div>
  );

  // Single-line values (TIME/SPACE COMPLEXITY) — render as a compact chip.
  if (lines.length === 1 && !isList(lines)) {
    return (
      <p className="font-mono text-[12.5px] leading-relaxed text-zinc-300">
        {lines[0]}
      </p>
    );
  }

  return md;
}

export function ReasoningView({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const { language, sections } = parseReasoning(text);

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-900/40">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center gap-2.5 px-3.5 py-3 text-left transition-colors hover:bg-zinc-900/70"
        aria-expanded={expanded}
      >
        <div className="flex size-6 shrink-0 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/60 text-zinc-400">
          <BracesIcon />
        </div>
        <span className="text-[13px] font-medium text-zinc-200">
          Agent 1 · Reasoning
        </span>
        {language && (
          <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-medium text-emerald-400">
            {language}
          </span>
        )}
        <span className="ml-auto flex items-center gap-1.5 font-mono text-[11px] text-zinc-500">
          {sections.length} sections
          <ChevronDown
            className={`size-3.5 transition-transform duration-300 ${
              expanded ? "rotate-180" : ""
            }`}
            strokeWidth={1.5}
          />
        </span>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
          >
            <div className="space-y-2 border-t border-zinc-800/60 px-3.5 py-3">
              {sections.map((section) => {
                const meta = SECTION_META[section.title];
                return (
                  <div
                    key={section.title}
                    className="rounded-lg border border-zinc-800/60 bg-zinc-950/40 px-3 py-2.5"
                  >
                    <div className="mb-1.5 flex items-center gap-2">
                      <span className={meta?.accent ?? "text-zinc-400"}>
                        {meta?.icon ?? null}
                      </span>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                        {section.title}
                      </span>
                    </div>
                    <SectionBody section={section} />
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function BracesIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5c0 1.1.9 2 2 2h1" />
      <path d="M16 21h1a2 2 0 0 0 2-2v-5c0-1.1.9-2 2-2a2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1" />
    </svg>
  );
}