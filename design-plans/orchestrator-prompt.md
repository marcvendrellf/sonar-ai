# Orchestrator prompt — dashboard rework + SeamUI migration

Paste everything below the line into a fresh agent session at the repository root.

---

You are the orchestrator for a four-phase rework of the Sonar AI dashboard. You do not write product code yourself. You delegate each phase to one subagent, verify the result, and stop the moment a phase fails.

## Repository

- Root: `/Users/marcv/Documents/2_Coding/Coding Projects/28_TechEuropeHackathon`
- App under change: `apps/web` (Next.js 16, React 19, Tailwind v4, shadcn `base-nova` preset on Base UI)
- Package manager: pnpm, declared in `package.json` as `pnpm@11.0.9`. The project contract in `llm-wiki/interface-plan.md` says "Use pnpm for every command." Do not introduce npm or yarn.
- Verification commands, run from the root: `pnpm typecheck`, `pnpm lint`, `pnpm build`.

## Hard boundaries

1. **Do not build, restyle, or scaffold the Saloon.** The repository owner is designing that surface on a parallel branch. The `#saloon` anchor on `apps/web/features/dashboard/dashboard.tsx` and `components/blocks/chat-4.tsx`, `components/ui/message.tsx`, `components/ui/bubble.tsx`, `components/ui/message-scroller.tsx`, `components/ui/live-orb.tsx`, and `components/ui/shader-gradient.tsx` are off limits except where phase 4 must repair an import that phase 4 itself broke. If you believe a Saloon file must change, stop and ask.
2. **Do not edit `llm-wiki/` or `raw-sources/` during phases 1 to 3.** Each plan has a "Design documentation" section; hold all of it until the owner accepts the work, then do it in one pass at the end.
3. **Do not run phases in parallel.** All three plans edit `apps/web/features/dashboard/dashboard.tsx`. Concurrent edits will conflict and phase 3 depends on phase 2 having landed. Run them in the order below, one subagent at a time.
4. **Line numbers in the plans are from commit `4a42f65ce108fe9875c93c7ac7f978e33ed15960` and drift as phases land.** Instruct every subagent to locate its target by the quoted code or copy, not by the line number, and to stop if the quoted content is not found rather than guessing at the nearest match.
5. Do not commit, push, or open a PR unless the owner asks. Report and let them review.

## Before you start

Confirm the working tree is committed or otherwise recoverable, so each phase can be reviewed and reverted independently. If `apps/` is still untracked, say so and ask the owner to commit a baseline before you delegate phase 1. Do not commit on their behalf.

## Phase 1 — Agent cast

- Plan: `design-plans/agent-work-chart-matches-documented-cast.md`
- Suggested model: small. The change is a mechanical string and array edit against a fully specified target.
- Delegate with: "Read `design-plans/agent-work-chart-matches-documented-cast.md` in full and implement exactly what its Changes section specifies, nothing more. Honour its Preserve lists and its Stop conditions. Locate code by the quoted content, not by line number. Do not touch the Saloon files. Report what you changed and the result of `pnpm typecheck`, `pnpm lint`, and `pnpm build`."
- The plan has one open decision: the Trader column reuses `--status-complete` because no sixth `--agent-*` token exists. The subagent must not invent a new colour. If it reports that a distinct hue is wanted, bring that to the owner rather than resolving it yourself.
- Gate: the six columns read Scout, Cartographer, Analyst, Skeptic, Marshal, Trader, and all three commands pass.

## Phase 2 — Market-data status card

- Plan: `design-plans/market-data-status-metric-card.md`
- Suggested model: small.
- Delegate with the same wording as phase 1, substituting the plan path.
- Gate: the metric row renders six cards on one line at 1440px, the new card reads `Market data / Fixture / Alpaca Paper`, and all three commands pass.
- This phase must land before phase 3. Phase 3 strips the `icon` field from every `metrics` entry, including the one this phase adds.

## Phase 3 — Visual rank pass

- Plan: `design-plans/dashboard-visual-rank.md`
- Suggested model: mid-tier. This is the only phase with real structural work — re-nesting eight regions into three spacing bands while preserving four anchor ids, pruning imports that become unused, and applying a keep-or-delete rule across six card descriptions. The plan names every individual decision, so the subagent is not being asked to exercise taste, but it is being asked to restructure JSX without breaking anchors or accessibility labels.
- Delegate with: "Read `design-plans/dashboard-visual-rank.md` in full and implement its five numbered Changes exactly. The plan tells you precisely which descriptions and badges to delete and which to keep — do not extend the rule to anything it does not name. Preserve every `id` anchor and `aria-label`. Locate code by the quoted content, not by line number. Do not touch the Saloon files. Report what you changed and the result of `pnpm typecheck`, `pnpm lint`, and `pnpm build`."
- Gate: all three commands pass with no unused-import warning; `#dashboard`, `#saloon`, `#decisions`, and `#mandate` still resolve.
- The plan's own stop condition requires a rendered before/after comparison to confirm the hierarchy actually improved. You cannot settle that from source. Run `pnpm dev`, capture the page at 390px and 1440px, and hand the comparison to the owner. Treat phase 3 as provisionally complete until they confirm.

## Phase 4 — SeamUI buttons

Do not start this phase until the owner has accepted phases 1 to 3.

SeamUI (https://seamui.dev) is a shadcn-style distribution built on Base UI with Tailwind v4, which matches this repository's stack. Components install into `components/ui/`.

The commands the owner supplied are:

```
bunx --bun @seamui/cli@latest init
bunx --bun @seamui/cli@latest add button
```

Three things must be resolved before running anything:

1. **`bun` is not installed on this machine** (`which bun` returns nothing) and this repository is a pnpm workspace. SeamUI publishes a shadcn-compatible registry, so the same component is reachable without bun:
   ```
   pnpm dlx shadcn@latest add https://seamui.dev/r/button.json --dry-run
   ```
   Present both routes to the owner and let them choose. Do not install bun without being asked.
2. **`init` writes theme tokens and depth shadows.** `apps/web/app/globals.css` currently owns `--sonar-*`, `--status-*`, and `--agent-*`, and every one of them is referenced by the dashboard. If `init` rewrites that file, the surface loses its palette. Copy `globals.css` aside first, run `init`, diff, and restore any removed variable. `init` also creates `lib/motion.ts`; that is additive and fine.
3. **`add button` overwrites `apps/web/components/ui/button.tsx`, which has six consumers**: `components/ui/sheet.tsx`, `components/ui/dialog.tsx`, `components/ui/sidebar.tsx`, `components/ui/message-scroller.tsx`, `components/blocks/chat-4.tsx`, and `features/dashboard/dashboard.tsx`. The current button exports `Button` and `buttonVariants` and supports `variant` in `default | outline | secondary | ghost | destructive | link` and `size` in `default | sm | lg | icon`. Before accepting the overwrite, read the SeamUI button source from the dry run and confirm it exports `buttonVariants` and covers every variant and size in use — `ghost` and `size="icon"` are load-bearing for the sidebar. If it does not, stop and report the gap; do not paper over it with per-call-site classNames.

On "labels": the owner asked for buttons and labels. SeamUI's front page advertises `button`, `voice-visualizer`, and `agent-status`; it does not confirm a label or badge component. Check the registry. If SeamUI ships a label or badge, propose the swap for `components/ui/badge.tsx` and its two consumers (`components/blocks/activity-1.tsx`, `features/dashboard/dashboard.tsx`) and wait for approval. If it does not, leave the shadcn badge in place and say so — do not substitute a different library.

Gate: `pnpm typecheck`, `pnpm lint`, `pnpm build` all pass, every button on `/` still renders with its intended variant, the sidebar collapse control still works, and the receipt Sheet still opens.

## Reporting

After every phase, report: the files changed, the diff summary, the three command results verbatim, any Stop condition the subagent hit, and anything it chose not to do. Do not advance to the next phase on a failure — stop and report.
