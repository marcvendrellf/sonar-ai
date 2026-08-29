# Overview

## Final decision

Build [Sonar AI](concepts/sonar-ai.md), an autonomous paper hedge fund that uses Cala to trace relationships behind an event before changing a simulated portfolio. The concept was codenamed "Agent Fund" during selection; the product name is now Sonar AI (see the [naming and monorepo decision](../raw-sources/naming-monorepo-decision-2026-08-29.md)). The user reconfirmed this direction and added a read-only eToro connection while keeping all trading simulated (see the [eToro paper-trading decision](../raw-sources/sonar-etoro-paper-decision-2026-08-29.md)).

> The agent does not trade the headline. It trades the relationships behind it.

The event message is broad: `Build whatever you want, you might just leave with the MVP from your next startup and some cool prizes!` Sonar AI is the team's chosen product. Do not reopen concept selection unless the user explicitly asks.

## Product loop

1. A prepared historical or synthetic event enters the system.
2. Scout identifies the event and relevant news.
3. Cartographer uses Cala to create a source-linked relationship graph.
4. Analyst and Skeptic produce competing evidence-linked theses.
5. Marshal applies deterministic mandate and risk limits.
6. A read-only eToro adapter supplies permitted market or reference data after the interface is verified.
7. Trader applies accepted orders to the internal paper portfolio only.
8. The dashboard updates and stores a decision receipt.

The memorable reveal is one headline expanding into a relationship graph, reaching a second-order portfolio exposure, and causing a sourced paper rebalance.

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
- server-only Cala and read-only eToro adapters with sanitized fixture fallbacks

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
- eToro is read-only unless an official paper-trading interface is verified
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

The dashboard data is presentational fixture data, not a reviewed shared contract or Cala/eToro fixture. The Saloon and onboarding remain separate implementation epics. Team direction is recorded: Marc leads the frontend, while Josep and Axel focus mainly on agents and data. The split between Josep and Axel and ownership of Cala, eToro, shared contracts, risk, fixtures, deployment, and pitch remain open.

## Immediate next actions

1. Agree on the branch policy and assign the remaining ownership areas in the [team workflow](team-workflow.md).
2. Define and fixture-test the shared contracts in `packages/core`.
3. Replace the dashboard's presentational data with a reviewed validated fixture.
4. Build the fixture-driven Saloon shell and execution trace.
5. Build onboarding as its own frontend epic.
6. Implement the typed agent event store and deterministic risk engine.
7. Build one fixed event-to-position relationship reveal.
8. Test Cala and save a sanitized response fixture.
9. Verify the official eToro interface and save a read-only sanitized market-data fixture.
10. Connect live Cala and eToro only after the full fixture-driven demo works.

## Success condition

By demo time, a viewer must understand that several agents examined one event, disagreed, traced Cala relationships, obeyed a risk mandate, changed a paper portfolio, and left an inspectable receipt.
