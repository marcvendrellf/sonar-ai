# Overview

## Final decision

Build [Sonar AI](concepts/sonar-ai.md), an agentic paper hedge fund that uses Cala to trace relationships behind an event before proposing a simulated portfolio change for human approval. The concept was codenamed "Agent Fund" during selection; the product name is now Sonar AI (see the [naming and monorepo decision](../raw-sources/naming-monorepo-decision-2026-08-29.md)). The active brokerage integration is Alpaca Paper Trading.

> The agent does not trade the headline. It trades the relationships behind it.

The event message is broad: `Build whatever you want, you might just leave with the MVP from your next startup and some cool prizes!` Sonar AI is the team's chosen product. Do not reopen concept selection unless the user explicitly asks.

## Product loop

1. Code-owned orchestrator loads €1,000 cash-only portfolio snapshot, mandate, five-asset candidate universe, existing theses, and prepared event or material-change set.
2. Fundamental Analyst evaluates selected assets; Market Context Analyst evaluates relevant news, sector, macro, competitors, regulation, and events. Cala relationship tracing is a sourced research capability used by these stages.
3. Portfolio Manager weighs structured research and proposes allocation changes.
4. Risk Officer runs deterministic portfolio analytics and hard-blocks invalid proposals.
5. Bear/Critic attacks surviving recommendation and identifies failure scenarios.
6. Portfolio Manager revises recommendation using critique and risk report.
7. Human reviews and approves or rejects paper action; Trader applies approved changes only to internal paper portfolio.
8. Communications/Report Writer turns final decision into internal report after decision, never before.
9. Dashboard stores decision receipt with evidence, risk comparison, approval, and generated report.

MVP uses one typed orchestrator, five decision agents, one post-decision writer, isolated contexts, bounded model calls, deterministic analytics, and fixture replay. No agent swarm, agent-to-agent filler chat, autonomous loops, workflow framework, or automatic execution.

The memorable reveal is one portfolio decision expanding into sourced relationships, surviving risk comparison and adversarial critique, then receiving explicit human approval for a paper rebalance.

## Interface

The product has three spaces:

- **Onboarding** introduces the fund, mandate, and agents through a cinematic shader-backed flow.
- **The Saloon** shows the agent roster, current tasks, disagreements, evidence, and execution trace.
- **Dashboard** shows paper NAV, P&L, exposure, cash, prices, positions, recent paper trades, agent activity, relationship paths, and decision receipts.

Use the [interface plan](interface-plan.md) as the UI contract.

## Technology decision

- pnpm workspace monorepo in the private GitHub repo `marcvendrellf/sonar-ai`
- Next.js, React, and TypeScript
- shadcn/ui with the Base UI `base-nova` preset
- Tailwind CSS
- Motion for DOM transitions
- React Three Fiber, Drei, and restrained postprocessing for the primary faceless sphere
- `@23rd/live-orb` only as a minimal fallback or onboarding host
- React Flow and ELK.js for deterministic relationship layout
- Zustand, TanStack Query, Zod, Recharts, and Lucide
- server-only Cala and Alpaca Paper adapters with sanitized fixture fallbacks

Selected shadcn registry components:

- `@23rd/shader-gradient`
- `@23rd/live-orb`
- `@7ovr/activity-1`
- `@7ovr/chat-4`
- `@abui/animated-chart`
- `@abui/text-gradient`

Use the [technical reference pack](technical-reference-pack.md) for installation and architecture. Use the [team workflow](team-workflow.md) for ownership, delivery epics, branch boundaries, and coding-agent handoffs.

## Non-negotiable boundaries

- Paper trading only
- Alpaca is fixed to its Paper endpoint; live trading is disabled
- No real-money orders, deposits, withdrawals, or brokerage-account control
- No customer funds
- No return claims
- No personalized investment advice
- Every material graph edge and thesis claim has evidence IDs
- Relationships are not presented as proof of causation
- The model produces hypotheses and explanations, not source facts
- Deterministic rules enforce the mandate
- Historical, synthetic, and live information are labeled
- The demo always has sanitized fixtures as a fallback

## Current implementation state

The repository is a pnpm workspace monorepo at `github.com/marcvendrellf/sonar-ai`. The Next.js application now lives in `apps/web`, with reserved workspace packages at `packages/core` and `packages/risk-engine`.

shadcn is initialized with the Base UI `base-nova` preset. The application-shell block, selected third-party registry components, and required shadcn primitives are installed. The first fixture-driven dashboard uses the `application-shell1` collapsible sidebar and includes paper-fund metrics, a NAV chart, sourced relationship path, positions table, adapted agent activity feed, agent-work chart, risk outcome, and inspectable decision receipt. `pnpm typecheck`, `pnpm lint`, and `pnpm build` pass.

The dashboard data remains presentational fixture data, not a reviewed live Cala/Alpaca fixture. The MVP runtime has a server-side typed orchestrator with isolated stage contexts, deterministic evidence/risk/human gates, a deterministic internal paper ledger, five decision-agent definitions, and a post-decision Report Writer seam. Fixture execution is serial and replayable. Live execution uses the official OpenAI TypeScript SDK, Responses API, Zod structured outputs, and a bounded function-call loop behind the same `AgentRunner` seam. SDK retries are disabled; code owns retry count, timeout, token cap, stage order, tool allowlists, and gates.

Cala REST integration is implemented server-side with entity resolution, schema introspection, selective profile/metric retrieval, structured query, sourced search, and breadth-first relationship traversal bounded to depth 3 and 50 nodes. Fundamental Analyst and Market Context Analyst receive separate research tool subsets. Search/query guide discovery but produce no citable receipt; profile, fundamentals, and traversal normalize underlying-source evidence. Runner merges those evidence records and normalized traversal graph artifacts into committee state before gates run. `SONAR_OFFLINE=true` uses a deterministic synthetic Cala provider with an inspectable supplier/event path. No live Cala credential or event response was used, so coverage and freshness remain unverified. Portfolio Manager still receives research summaries rather than raw Cala access; Risk remains deterministic; no model can route stages or reach order execution.

## Immediate next actions

1. Agree on the branch policy and assign the remaining ownership areas in the [team workflow](team-workflow.md).
2. Define and fixture-test remaining shared contracts in `packages/core`.
3. Replace the dashboard's presentational data with a reviewed validated fixture.
4. Build the fixture-driven Saloon shell and execution trace.
5. Build onboarding as its own frontend epic.
6. Run one credentialed Cala experiment; save sanitized query, entity, introspection, retrieval, and useful graph-path responses.
7. Add Alpaca-supported U.S. candidate instruments and save sanitized account, position, and order fixtures.
8. Connect the orchestrator to a thin API route only after the offline path remains intact.

## Success condition

By demo time, a viewer must understand that five specialized agents examined one portfolio decision, deterministic analytics constrained it, Bear/Critic challenged it, a human approved it, and Report Writer left an inspectable receipt.
