# Overview

## Final decision

Build [Agent Fund](concepts/agent-fund.md), an autonomous paper hedge fund that uses Cala to trace relationships behind an event before changing a simulated portfolio.

> The agent does not trade the headline. It trades the relationships behind it.

Do not reopen concept selection unless the user explicitly asks. Company Lens and the earlier finance ideas are no longer active scope.

## Product loop

1. A prepared historical or synthetic event enters the system.
2. Scout identifies the event and relevant news.
3. Cartographer uses Cala to create a source-linked relationship graph.
4. Analyst and Skeptic produce competing evidence-linked theses.
5. Marshal applies deterministic mandate and risk limits.
6. Trader executes accepted paper orders.
7. The dashboard updates and stores a decision receipt.

The memorable reveal is one headline expanding into a relationship graph, reaching a second-order portfolio exposure, and causing a sourced paper rebalance.

## Interface

The product has three spaces:

- **Onboarding** introduces the fund, mandate, and agents through a cinematic shader-backed flow.
- **The Saloon** shows the agent roster, current tasks, disagreements, evidence, and execution trace.
- **Dashboard** shows paper NAV, P&L, exposure, cash, prices, positions, recent paper trades, agent activity, relationship paths, and decision receipts.

Use the [interface plan](interface-plan.md) as the UI contract.

## Technology decision

- Next.js, React, and TypeScript
- pnpm only
- shadcn/ui with the Base UI `base-nova` preset
- Tailwind CSS
- Motion for DOM transitions
- React Three Fiber, Drei, and restrained postprocessing for the primary faceless sphere
- `@23rd/live-orb` only as a minimal fallback or onboarding host
- React Flow and ELK.js for deterministic relationship layout
- Zustand, TanStack Query, Zod, Recharts, and Lucide

Selected shadcn registry components:

- `@23rd/shader-gradient`
- `@23rd/live-orb`
- `@7ovr/activity-1`
- `@7ovr/chat-4`
- `@abui/animated-chart`
- `@abui/text-gradient`

Use the [technical reference pack](technical-reference-pack.md) for installation and architecture.

## Non-negotiable boundaries

- Paper trading only
- No broker or exchange connection
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

No application has been scaffolded. The repository currently contains the wiki and the supplied visual asset. There is no `package.json`, pnpm lockfile, or `components.json`.

The selected third-party registry components were inspected with `shadcn view`. They have not been installed.

## Immediate next actions

1. Scaffold the Next.js project with pnpm and the shadcn Base UI `base-nova` preset.
2. Run `shadcn info`.
3. Preview every selected registry item with `--dry-run`.
4. Resolve the Animated Chart Motion-version warning before installation.
5. Build static onboarding, Saloon, and dashboard shells from fixtures.
6. Implement the typed agent event store and deterministic risk engine.
7. Build one fixed event-to-position relationship reveal.
8. Test Cala and save a sanitized response fixture.
9. Connect live Cala only after the full fixture-driven demo works.

## Success condition

By demo time, a viewer must understand that several agents examined one event, disagreed, traced Cala relationships, obeyed a risk mandate, changed a paper portfolio, and left an inspectable receipt.
