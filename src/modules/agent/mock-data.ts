export type PlanToolKind = "read" | "edit" | "terminal" | "search";

export interface AgentPlan {
  thinkingMs: number;
  tools: { kind: PlanToolKind; label: string; detail: string; doneMs: number }[];
  reply: string;
}

export const SCRIPTED_PLAN: AgentPlan = {
  thinkingMs: 1500,
  tools: [
    {
      kind: "search",
      label: "grep",
      detail: "\"useTransition\" src/modules --type tsx",
      doneMs: 1200,
    },
    {
      kind: "read",
      label: "read_file",
      detail: "src/modules/projects/ui/views/project-view.tsx",
      doneMs: 1000,
    },
    {
      kind: "edit",
      label: "edit_file",
      detail: "+38 −11 · 3 files touched",
      doneMs: 1600,
    },
    {
      kind: "terminal",
      label: "run_terminal",
      detail: "pnpm lint && pnpm test · all green in 8.4s",
      doneMs: 1400,
    },
  ],
  reply:
    "Done. The stale-closure came from `onBuildEvent` being captured during the first render of `ProjectView` — every subsequent socket event read a dead ref.\n\nWhat changed:\n\n1. Wrapped the handler in `useEffectEvent` so it always sees fresh props without re-subscribing.\n2. Replaced the manual `setTimeout` retry ladder with an abortable `AbortSignal.timeout(8000)`.\n3. Added a regression test that fires three rapid build events against a fake clock.\n\nLint and the full suite pass. Want me to open a PR against `feat/agent-runtime`?",
};

export const SUGGESTIONS = [
  "Why is the dev server recompiling on every save?",
  "Profile the /projects route for waterfalls",
  "Write tests for the usage limiter",
  "Explain the lifecycle module in one paragraph",
];
