# Rida — Project Context

## What this is
Standalone AI coding-agent chat interface ("Rida.agent", assistant persona: **Koda**).
Started Aug 26 2026 as a spin-off from a separate project called **Nelta** (`~/Nelta` — do NOT touch it; it is unrelated). Rida lives at `~/rida`.

## Stack
- Next.js 16.3.3 (App Router, Turbopack dev), React 19.2, TypeScript
- Tailwind CSS v4 (`@import "tailwindcss"` + `@theme inline`, no tailwind.config)
- framer-motion v13, react-textarea-autosize, lucide-react
- Fonts: Geist + Geist Mono via `next/font` (`--font-geist-sans`, `--font-geist-mono`; mapped to `font-sans` / `font-mono` utilities)
- No shadcn/radix — all UI is custom. No backend yet.

## Run
```
npm run dev   # http://localhost:3000 (Turbopack)
npx tsc --noEmit   # typecheck (passes clean)
```

## Current state (all frontend-only, mocked)
Homepage `/` renders the full agent UI:
- `src/app/page.tsx` → `src/modules/agent/ui/views/agent-view.tsx` ('use client' orchestrator)
- Simulated agent loop in agent-view: user sends → "thinking" phase (~1.5s) → assistant message with tool calls that complete sequentially → typewriter-streamed reply. Fully scripted via `SCRIPTED_PLAN` in `src/modules/agent/mock-data.ts`. Stop button cancels via timer refs with cleanup.
- Components (`src/modules/agent/ui/components/`):
  - `agent-sidebar.tsx` — sessions (Today/Yesterday groups), layoutId active pill, mobile slide-over drawer, mock user footer
  - `composer.tsx` — autosize input, Enter=send/Shift+Enter=newline, custom animated model dropdown (Forge-1 Pro / Swift Mini / Atlas Coder XL), ctx counter, send↔stop morphing button
  - `message-bubble.tsx`, `tool-call-row.tsx` — tool calls (grep/read_file/edit_file/run_terminal) with spinner→check animation
  - `streaming-text.tsx`, `typing-indicator.tsx`, `status-dot.tsx` — memoized perpetual-motion leaves with strict interval cleanup
- Data types in `src/modules/agent/types.ts`. Sessions/messages are hardcoded mocks; no persistence.

## Design system
- Dark-only: bg zinc-950 (`#09090b`), single desaturated emerald accent, zinc neutrals
- Rounded-2xl containers, inset top highlight + diffusion shadow on composer
- Mono font for all numbers/tool labels/paths; strokeWidth 1.5 on icons
- Fixed pointer-events-none grain SVG overlay (z-50); springs (stiffness ~100-300, damping ~15-30), no linear easing

## Pending decisions / next steps
1. **Backend** — user wants Inngest for background jobs; DB choice was interrupted mid-discussion between:
   - Keep-it-simple option: Prisma+Postgres+tRPC style persistence with SSE/polling
   - Add Convex alongside (realtime-first, but two sources of truth)
   - Full Convex migration (clean single source of truth, bigger rewrite)
   User leaned "inngest and then convex for db" — confirm before building.
2. Wire real LLM streaming to replace SCRIPTED_PLAN
3. Real session persistence (currently `SESSIONS`/`INITIAL_MESSAGES` mocks unused by the view)
4. Code-block rendering/syntax highlighting for replies (not yet built)

## Conventions
- No emojis anywhere. No comments unless needed. No Inter font. Emerald accent only.
- Perpetual animations isolated + memoized; timers/intervals always cleaned up in useEffect returns.
