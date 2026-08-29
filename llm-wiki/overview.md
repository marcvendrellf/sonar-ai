# Overview

## Final decision

Build [Sonar AI](concepts/sonar-ai.md), an agentic paper hedge fund that uses Cala to trace relationships behind an event before proposing a paper-portfolio change for human approval. The concept was codenamed "Agent Fund" during selection; the product name is now Sonar AI (see the [naming and monorepo decision](../raw-sources/naming-monorepo-decision-2026-08-29.md)). Alpaca is the paper-trading provider and all orders stay on its paper endpoint (see the [Alpaca paper-trading verification](../raw-sources/alpaca-paper-trading-verification-2026-08-29.md)).

> The agent does not trade the headline. It trades the relationships behind it.

The event message is broad: `Build whatever you want, you might just leave with the MVP from your next startup and some cool prizes!` Sonar AI is the team's chosen product. Do not reopen concept selection unless the user explicitly asks.

## Product loop

1. Code-owned orchestrator loads €1,000 cash-only portfolio snapshot, mandate, five-asset candidate universe, existing theses, and prepared event or material-change set.
2. Fundamental Analyst evaluates selected assets; Market Context Analyst evaluates relevant news, sector, macro, competitors, regulation, and events. Cala relationship tracing is a sourced research capability used by these stages.
3. Portfolio Manager weighs structured research and proposes allocation changes.
4. Risk Officer runs deterministic portfolio analytics and hard-blocks invalid proposals.
5. Bear/Critic attacks surviving recommendation and identifies failure scenarios.
6. Portfolio Manager revises recommendation using critique and risk report.
7. Human reviews and approves or rejects paper action; Alpaca Paper adapter submits approved orders and local ledger records receipt.
8. Communications/Report Writer turns final decision into internal report after decision, never before.
9. Dashboard stores the decision receipt with evidence, risk comparison, approval, generated report, and bounded material events for the Saloon.

MVP uses one typed orchestrator, five decision agents, one post-decision writer, isolated contexts, bounded model calls, deterministic analytics, and fixture replay. No agent swarm, agent-to-agent filler chat, autonomous loops, workflow framework, or automatic execution.

The memorable reveal is one portfolio decision expanding into sourced relationships, surviving risk comparison and adversarial critique, then receiving explicit human approval for a paper rebalance.

## Interface

The product has three spaces:

- **Onboarding** introduces the fund, mandate, and agents through a cinematic shader-backed flow.
- **The Saloon** is a minimal 3D room with one meeting table and six agent orbs. Selecting an orb moves the camera into a frontal interview view with that agent's task, evidence, disagreement, risk result, and blockers on the right. A bottom-right bell opens the newest source-backed findings from ongoing searches.
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
- server-only Cala and Alpaca Paper adapter with sanitized fixture fallbacks

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
- Alpaca paper endpoint only; live endpoint and credentials forbidden
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

The dashboard data is presentational fixture data, not a reviewed shared contract or Cala/Alpaca fixture. The MVP runtime remains a plain server-side typed orchestrator with five decision agents plus a post-decision Report Writer; exact prompts and schemas remain implementation work. The first Alpaca integration slice adds a Zod-validated Paper account/positions contract, server-only paper client, `/api/alpaca/portfolio` route, fixed paper endpoint, paper-order method, and sanitized fixture fallback. Live paper response capture and U.S.-asset selection remain open.

Onboarding runs at `/` and `/onboarding`; the dashboard has its own `/dashboard` route. A light custom eye orb enters over a clear Shader Gradient, asks for a display name, presentational paper budget, and mandate profile, stores those values locally, then enters `/saloon`. The fuller fund explanation and committee introduction remain to be built. The current budget range predates the €1,000 cash-only MVP decision and must be replaced by the reviewed core fixture rather than treated as a contract.

The Saloon at `/saloon` runs the clay-diorama room. One local `saloon-shell.glb` provides cutaway clay architecture, a scalloped dark table, and six seat plinths with four flat matte materials. One broad warm key, weak fill, subdued local environment, and a 60-frame accumulated shadow light the room. The six selectable custom orbs, table and interview camera states, fixture-driven activity, right-side agent view, DOM labels, keyboard roster, reduced-motion cut, loading state, model-failure state, and WebGL fallback work. The current dashboard and Saloon fixtures still use the earlier Scout/Cartographer-style cast; `feat/dashboard-polish` and `feat/saloon-polish` must map their six visual roles to the five decision agents and post-decision Report Writer from the reviewed orchestrator contract. Assets and licences are recorded in the [Saloon asset provenance](../raw-sources/saloon-asset-provenance-2026-08-29.md).

`pnpm --filter web typecheck`, `lint`, and `build` pass. Team direction is recorded: Marc leads the frontend, while Josep and Axel focus mainly on agents and data. The split between Josep and Axel and ownership of Cala, Alpaca, shared contracts, risk, fixtures, deployment, and pitch remain open.

## Immediate next actions

1. Run the onboarding, dashboard, and Saloon polish branches in parallel from the consolidated `main` checkpoint, following the ownership boundaries in the [team workflow](team-workflow.md).
2. Define and fixture-test the shared contracts in `packages/core`.
3. Replace the dashboard's presentational data with a reviewed validated fixture.
4. Judge the clay Saloon room on the presentation laptop, map its six seats to the reviewed committee topology, and build the bounded material-events bell.
5. Replace onboarding's presentational budget/profile storage with the €1,000 cash-only shared fixture, then add the fund explanation and committee introduction before the existing Saloon handoff.
6. Implement the typed orchestrator/state store and deterministic portfolio analytics/risk engine.
7. Build one fixed portfolio decision with sourced relationships and a human approval step.
8. Test Cala and save a sanitized response fixture.
9. Run one Alpaca Paper account/positions/order test and save sanitized response fixtures.
10. Add Report Writer output only after final decision; connect live Cala and Alpaca Paper only after the full fixture-driven demo works.

## Success condition

By demo time, a viewer must understand that five specialized agents examined one portfolio decision, deterministic analytics constrained it, Bear/Critic challenged it, a human approved it, and Report Writer left an inspectable receipt.
