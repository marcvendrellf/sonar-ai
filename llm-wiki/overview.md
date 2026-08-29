# Overview

## Final decision

Build [Sonar AI](concepts/sonar-ai.md), an agentic paper hedge fund that uses Cala to trace relationships behind an event before proposing a simulated portfolio change for human approval. The concept was codenamed "Agent Fund" during selection; the product name is now Sonar AI (see the [naming and monorepo decision](../raw-sources/naming-monorepo-decision-2026-08-29.md)). The user reconfirmed this direction and added a read-only eToro connection while keeping all trading simulated (see the [eToro paper-trading decision](../raw-sources/sonar-etoro-paper-decision-2026-08-29.md)).

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
8. Communications/Report Writer turns final decision into internal report and permitted eToro-facing copy after decision, never before.
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

The repository exists as a private GitHub monorepo at `github.com/marcvendrellf/sonar-ai` with the wiki, the repository contract, and the supplied visual asset committed. No application has been scaffolded: there is no `package.json`, pnpm workspace file, or `components.json` yet. The MVP runtime decision is a plain server-side typed orchestrator with five decision agents plus a post-decision Report Writer; exact prompts and schemas remain implementation work.

The selected third-party registry components were inspected with `shadcn view`. They have not been installed.

Team direction is recorded: Marc leads the frontend, while Josep and Axel focus mainly on agents and data. Onboarding remains a dedicated frontend epic. The split between Josep and Axel and ownership of Cala, eToro, shared contracts, risk, fixtures, deployment, and pitch remain open.

## Immediate next actions

1. Agree on the branch policy and assign the remaining ownership areas in the [team workflow](team-workflow.md).
2. Scaffold the pnpm workspace and initialize shadcn with the Base UI `base-nova` preset.
3. Run `shadcn info`, preview selected registry items, and resolve the Animated Chart Motion-version warning.
4. Define and fixture-test the shared contracts in `packages/core`.
5. Build static onboarding, Saloon, and dashboard shells from fixtures.
6. Implement the typed orchestrator/state store and deterministic portfolio analytics/risk engine.
7. Build one fixed portfolio decision with sourced relationships and a human approval step.
8. Test Cala and save a sanitized response fixture.
9. Verify the official eToro interface and save a read-only sanitized market-data fixture.
10. Add Report Writer output only after final decision; connect live Cala and eToro only after the full fixture-driven demo works.

## Success condition

By demo time, a viewer must understand that five specialized agents examined one portfolio decision, deterministic analytics constrained it, Bear/Critic challenged it, a human approved it, and Report Writer left an inspectable receipt.
