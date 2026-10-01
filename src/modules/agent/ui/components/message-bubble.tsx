"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Copy, Terminal, TestTube2, FileCode2, CircleAlert } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ToolCallRow } from "./tool-call-row";
import { StreamingText } from "./streaming-text";
import { ReasoningView } from "./reasoning-view";
import type { ChatMessage, PipelineResult } from "../../types";

function CodeBlock({ code, language }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800 bg-[#0a0a0c]">
      <div className="flex items-center justify-between border-b border-zinc-800/60 bg-zinc-900/60 px-3.5 py-2">
        <span className="font-mono text-[11px] text-zinc-500">
          {language || "text"}
        </span>
        <button
          onClick={() => {
            navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 1600);
          }}
          className="flex items-center gap-1.5 text-[11px] text-zinc-500 transition-colors hover:text-zinc-300 active:scale-[0.98]"
          aria-label="Copy code"
        >
          {copied ? (
            <Check className="size-3 text-emerald-400" strokeWidth={2} />
          ) : (
            <Copy className="size-3" strokeWidth={1.5} />
          )}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="max-h-[420px] overflow-auto p-4 text-[13px] leading-relaxed">
        <code className="font-mono text-zinc-300">{code}</code>
      </pre>
    </div>
  );
}

function StageHeader({
  icon,
  title,
  status,
  statusLabel,
}: {
  icon: React.ReactNode;
  title: string;
  status: "ok" | "fail" | "info";
  statusLabel: string;
}) {
  const color =
    status === "ok" ? "text-emerald-400" : status === "fail" ? "text-red-400" : "text-zinc-400";
  const dot =
    status === "ok" ? "bg-emerald-500" : status === "fail" ? "bg-red-500" : "bg-zinc-500";
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex size-6 shrink-0 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/60 text-zinc-400">
        {icon}
      </div>
      <span className="text-[13px] font-medium text-zinc-200">{title}</span>
      <span className={`ml-auto flex items-center gap-1.5 font-mono text-[11px] ${color}`}>
        <span className={`size-1.5 rounded-full ${dot}`} />
        {statusLabel}
      </span>
    </div>
  );
}

function CodeStage({ code, language }: { code: string; language: string }) {
  return (
    <div>
      <StageHeader
        icon={<FileCode2 className="size-3.5" strokeWidth={1.5} />}
        title="Agent 2 · Generated Code"
        status="info"
        statusLabel={language || "text"}
      />
      <div className="mt-2.5">
        <CodeBlock code={code} language={language.toLowerCase() || "text"} />
      </div>
    </div>
  );
}

function CompileStage({ compile }: { compile: NonNullable<PipelineResult["compile"]> }) {
  const passed = compile.success;
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-900/40">
      <div className="flex items-center gap-2 px-3.5 py-3">
        <div
          className={`flex size-6 shrink-0 items-center justify-center rounded-lg border ${
            passed
              ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-400"
              : "border-red-900/40 bg-red-950/20 text-red-400"
          }`}
        >
          <Terminal className="size-3.5" strokeWidth={1.5} />
        </div>
        <span className="text-[13px] font-medium text-zinc-200">Agent 4 · Compilation</span>
        <span className={`ml-auto flex items-center gap-1.5 font-mono text-[11px] ${passed ? "text-emerald-400" : "text-red-400"}`}>
          <span className={`size-1.5 rounded-full ${passed ? "bg-emerald-500" : "bg-red-500"}`} />
          {passed ? "Passed" : "Failed"}
        </span>
      </div>

      {/* Compiler output — show the message + error like a terminal */}
      {(compile.message || compile.error) && (
        <div className="mx-3.5 mb-3 overflow-hidden rounded-lg border border-zinc-800 bg-[#0a0a0c]">
          <div className="flex items-center gap-2 border-b border-zinc-800/60 bg-zinc-900/60 px-3 py-1.5">
            <span className="h-2 w-2 rounded-full bg-red-500/60" />
            <span className="h-2 w-2 rounded-full bg-yellow-500/60" />
            <span className="h-2 w-2 rounded-full bg-green-500/60" />
            <span className="ml-1 font-mono text-[10px] text-zinc-500">py_compile output</span>
          </div>
          <div className="p-3 font-mono text-[12px] leading-relaxed">
            {compile.message && (
              <div className={passed ? "text-emerald-300/90" : "text-zinc-300"}>{compile.message}</div>
            )}
            {compile.error && (
              <div className="mt-1 whitespace-pre-wrap text-red-400/90">{compile.error}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function TestStage({ test }: { test: NonNullable<PipelineResult["test"]> }) {
  const allPassed = test.all_passed ?? false;
  const results = test.results ?? [];
  const passed = test.passed_tests ?? 0;
  const total = test.total_tests ?? 0;

  return (
    <div>
      <StageHeader
        icon={<TestTube2 className="size-3.5" strokeWidth={1.5} />}
        title="Agent 3 · Test Results"
        status={allPassed ? "ok" : "fail"}
        statusLabel={`${passed}/${total} passed`}
      />
      {allPassed && (
        <div className="mt-2.5 flex items-center gap-2 rounded-lg border border-emerald-900/40 bg-emerald-950/20 px-3 py-2">
          <Check className="size-3.5 shrink-0 text-emerald-400" strokeWidth={2} />
          <span className="text-[13px] text-emerald-300">
            All {total} test{total === 1 ? "" : "s"} passed
          </span>
        </div>
      )}
      {/* Always show every test with input, expected output and actual output */}
      {results.length > 0 && (
        <div className="mt-2.5 space-y-1.5">
          {results.map((r, i) => (
            <div
              key={i}
              className={`overflow-hidden rounded-lg border ${
                r.passed
                  ? "border-zinc-800/60 bg-zinc-900/40"
                  : "border-red-900/40 bg-red-950/20"
              }`}
            >
              {/* Test header */}
              <div className="flex items-center gap-2 px-3 py-2">
                <span
                  className={`shrink-0 font-mono text-[11px] ${
                    r.passed ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {r.passed ? "✓" : "✗"}
                </span>
                <span className="font-mono text-[11px] text-zinc-400">
                  Test {r.test_number ?? i + 1}
                </span>
                <span className="ml-auto font-mono text-[10px] uppercase tracking-wider text-zinc-600">
                  {r.passed ? "Passed" : "Failed"}
                </span>
              </div>
              {/* Details */}
              <div className="space-y-2 border-t border-zinc-800/50 px-3 py-2.5">
                <div className="grid gap-2 md:grid-cols-2">
                  <div>
                    <div className="mb-0.5 font-mono text-[10px] uppercase tracking-wider text-zinc-600">
                      Input
                    </div>
                    <pre className="whitespace-pre-wrap rounded-md border border-zinc-800 bg-[#0a0a0c] px-2.5 py-1.5 font-mono text-[11px] text-sky-300/90">
                      {r.input !== undefined ? r.input : "—"}
                    </pre>
                  </div>
                  <div>
                    <div className="mb-0.5 font-mono text-[10px] uppercase tracking-wider text-zinc-600">
                      Expected Output
                    </div>
                    <pre className="whitespace-pre-wrap rounded-md border border-zinc-800 bg-[#0a0a0c] px-2.5 py-1.5 font-mono text-[11px] text-zinc-300">
                      {r.expected_output !== undefined ? r.expected_output : "—"}
                    </pre>
                  </div>
                </div>
                <div>
                  <div className="mb-0.5 font-mono text-[10px] uppercase tracking-wider text-zinc-600">
                    Actual Output
                  </div>
                  <pre className={`whitespace-pre-wrap rounded-md border px-2.5 py-1.5 font-mono text-[11px] ${
                    r.passed
                      ? "border-zinc-800 bg-[#0a0a0c] text-zinc-300"
                      : "border-red-900/50 bg-red-950/30 text-red-300/90"
                  }`}>
                    {r.actual_output !== undefined && r.actual_output !== "" ? r.actual_output : "(no output)"}
                  </pre>
                </div>
                {r.error && (
                  <div className="font-mono text-[11px] text-red-400/70">{r.error}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PipelineResultView({ pipeline }: { pipeline: PipelineResult }) {
  // Answer-only mode (plain question, no code pipeline).
  if (pipeline.mode === "answer" || (!pipeline.reasoning && !pipeline.code && !pipeline.error)) {
    return <MarkdownContent text={pipeline.answer ?? ""} />;
  }

  return (
    <div className="space-y-3">
      {pipeline.error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-900/40 bg-red-950/20 px-3.5 py-3">
          <CircleAlert className="mt-0.5 size-4 shrink-0 text-red-400" strokeWidth={1.5} />
          <span className="text-[13px] text-red-300">{pipeline.error}</span>
        </div>
      )}
      {pipeline.reasoning && <ReasoningView text={pipeline.reasoning} />}
      {pipeline.code && (
        <CodeStage code={pipeline.code} language={pipeline.language ?? "text"} />
      )}
      {pipeline.compile && <CompileStage compile={pipeline.compile} />}
      {pipeline.test && <TestStage test={pipeline.test} />}
    </div>
  );
}

function MarkdownContent({ text }: { text: string }) {
  return (
    <div className="md-content text-[13.5px] leading-relaxed text-zinc-300">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className ?? "");
            const isBlock = match || String(children).includes("\n");
            if (isBlock) {
              const lang = match ? match[1] : "text";
              return <CodeBlock code={String(children)} language={lang} />;
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
          pre({ children }) {
            return <>{children}</>;
          },
          a({ href, children }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 underline decoration-emerald-500/30 underline-offset-2 hover:text-emerald-300"
              >
                {children}
              </a>
            );
          },
          h1: ({ children }) => (
            <h1 className="mb-2 mt-4 text-lg font-semibold text-zinc-100">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mb-2 mt-4 text-base font-semibold text-zinc-100">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-1.5 mt-3 text-sm font-semibold text-zinc-100">
              {children}
            </h3>
          ),
          ul: ({ children }) => (
            <ul className="mb-3 list-disc space-y-1 pl-5">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-3 list-decimal space-y-1 pl-5">{children}</ol>
          ),
          li: ({ children }) => <li className="text-zinc-300">{children}</li>,
          p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
          strong: ({ children }) => (
            <strong className="font-semibold text-zinc-100">{children}</strong>
          ),
          blockquote: ({ children }) => (
            <blockquote className="mb-3 border-l-2 border-emerald-500/40 pl-3 text-zinc-400">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-4 border-zinc-800" />,
          table: ({ children }) => (
            <div className="mb-3 overflow-x-auto">
              <table className="w-full border-collapse text-[13px]">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-left font-medium text-zinc-200">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-zinc-800 px-3 py-1.5 text-zinc-300">
              {children}
            </td>
          ),
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}

export function MessageBubble({ message }: { message: ChatMessage }) {
  const [copied, setCopied] = useState(false);

  if (message.role === "user") {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="flex justify-end"
      >
        <div className="max-w-[85%] rounded-2xl rounded-br-md border border-zinc-800 bg-zinc-800/50 px-4 py-3 text-sm leading-relaxed text-zinc-200 md:max-w-[70%]">
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className="flex gap-3.5"
    >
      <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg border border-emerald-500/25 bg-emerald-500/10 font-mono text-[10px] font-bold tracking-tight text-emerald-400">
        R
      </div>
      <div className="min-w-0 flex-1 space-y-2.5">
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="space-y-1.5">
            {message.toolCalls.map((tool) => (
              <ToolCallRow key={tool.id} tool={tool} />
            ))}
          </div>
        )}
        {message.content && (
          <div className="rounded-2xl rounded-tl-md border border-zinc-800/80 bg-zinc-900/40 px-4 py-3.5 text-sm leading-relaxed text-zinc-300">
            {message.stream ? (
              <StreamingText text={message.content} />
            ) : message.pipeline ? (
              <PipelineResultView pipeline={message.pipeline} />
            ) : (
              <MarkdownContent text={message.content} />
            )}
            {!message.stream && (
              <button
                onClick={() => {
                  navigator.clipboard.writeText(message.content ?? "");
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1600);
                }}
                className="mt-2 flex items-center gap-1.5 text-xs text-zinc-600 transition-colors hover:text-zinc-400 active:scale-[0.98]"
                aria-label="Copy reply"
              >
                {copied ? (
                  <Check className="size-3 text-emerald-400" strokeWidth={2} />
                ) : (
                  <Copy className="size-3" strokeWidth={1.5} />
                )}
                {copied ? "Copied" : "Copy"}
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}