# Rida — Project Context

## What this is
Standalone AI coding-agent chat interface ("Rida.agent", assistant persona: **Koda**).
Started Aug 26 2026 as a spin-off from a separate project called **Nelta** (`~/Nelta` — do NOT touch it; it is unrelated). Rida lives at `~/rida`.

## Stack
- Next.js 16.3.3 (App Router, Turbopack dev), React 19.2, TypeScript
- Tailwind CSS v4 (`@import "tailwindcss"` + `@theme inline`, no tailwind.config)
- framer-motion v13, react-textarea-autosize, lucide-react
- Fonts: Geist + Geist Mono via `next/font` (`--font-geist-sans`, `--font-geist-mono`; mapped to `font-sans` / `font-mono` utilities)
- No shadcn/radix — all UI is custom. Backend is Convex + Inngest (see Current state).

## Run
```
npm run dev   # http://localhost:3000 (Turbopack)
npx tsc --noEmit   # typecheck (passes clean)
```

## Current state
Frontend: Next.js agent UI at `/`, now backed by Convex for persistence.
- Convex (local deployment via `npx convex dev`, writes `.env.local`): `convex/schema.ts` has `sessions` + `messages`; `convex/sessions.ts` (list/create), `convex/messages.ts` (listBySession/sendUser/saveAssistant). `agent-view.tsx` persists the scripted run (optimistic local `pendingMessages` + `tempToRealRef` dedupe) and hydrates from `useQuery`.
- Inngest: `src/inngest/client.ts` + `src/app/api/inngest/route.ts` (serve, `functions: []` — no functions registered yet).

Python multi-agent pipeline (separate from the Next app, CLI-only, NOT exposed to the UI):
- `main.py` orchestrates Agent 1 reasoner → Agent 2 coder → Agent 4 compiler → Agent 3 tester, with compile-fix and test-fix loops. A router classifies every question first: general questions are answered directly by Agent 1's model (`mode: "answer"`), only programming tasks reach Agents 2–4.
- Interlinking rules: Agents 2 and 3 are fully separate — **Agent 3 (tester) receives ONLY the user prompt + Agent 1's reasoning, never the generated code**, so expected outputs are spec-derived by construction (independent oracle). The code is used only to *execute* the tests. Test cases are generated ONCE per run and re-run via `run_tests()` on every fix round so failures stay stable regressions. `format_failures()` sends only failing tests back to Agent 2.
- LLM config (`agents/llm.py`): provider auto-detected from whichever key is in `.env` — `GROQ_API_KEY` → Groq, `OPENROUTER_API_KEY` → OpenRouter (Groq wins if both; `LLM_PROVIDER` overrides). Per-agent models via `REASONER_MODEL` / `CODER_MODEL` / `TESTER_MODEL`, all defaulting to `openai/gpt-oss-120b`. Clients are lazy (`get_llm`), so importing agent modules no longer requires a key.
- Requires `GROQ_API_KEY` or `OPENROUTER_API_KEY` in a `.env` file (not `.env.local`).
- **Exposed to the UI**: `pipeline.py` wraps the orchestration as an event generator (`run_pipeline(problem)`); `main.py` is a thin CLI over it; `coding_api.py` (FastAPI on :8001, uvicorn) serves `POST /solve` (JSON in the UI's `PipelineResult` shape — consumed via `NEXT_PUBLIC_API_URL` in `.env.local`) and `POST /solve/stream` (SSE events). The frontend (`agent-view.tsx` + `src/lib/chat-store.ts`) calls `/solve` and renders reasoning/code/compile/test via `MessageBubble`'s `PipelineResultView`.

## Design system
- Dark-only: bg zinc-950 (`#09090b`), single desaturated emerald accent, zinc neutrals
- Rounded-2xl containers, inset top highlight + diffusion shadow on composer
- Mono font for all numbers/tool labels/paths; strokeWidth 1.5 on icons
- Fixed pointer-events-none grain SVG overlay (z-50); springs (stiffness ~100-300, damping ~15-30), no linear easing

## Pending decisions / next steps
1. **Orchestration** — backend is now decided and wired: Inngest for background jobs + Convex as the single DB (realtime, no second source of truth). Still open: *where* the agent pipeline runs. Either port Agent 1–4 into Inngest functions with Convex as shared state, or keep the Python pipeline as the execution engine and have Convex/Inngest record per-step artifacts around it.
2. Streaming UX — `/solve` is synchronous (~30–90s); `POST /solve/stream` (SSE) already exists on :8001 but the UI doesn't consume it yet.
3. Code-block rendering/syntax highlighting for replies (not yet built)

## Conventions
- No emojis anywhere. No comments unless needed. No Inter font. Emerald accent only.
- Perpetual animations isolated + memoized; timers/intervals always cleaned up in useEffect returns.
