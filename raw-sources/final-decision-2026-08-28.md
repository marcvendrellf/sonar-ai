# Final product decision

- Source: user decision in the project session
- Captured: 2026-08-28
- Status: immutable capture

## Selected concept

Build Agent Fund, an autonomous paper hedge fund that uses Cala to trace relationships behind news and events before changing a simulated portfolio.

The central line is:

> The agent does not trade the headline. It trades the relationships behind it.

## Product boundary

- Paper trading only
- No broker connection
- No customer funds
- No promised returns
- No personalized investment advice
- Every relationship and thesis claim must link to evidence
- Deterministic mandate and risk checks control simulated execution

## Interface decision

Use shadcn/ui with a Base UI preset and pnpm.

The product has:

1. cinematic onboarding;
2. the Saloon, where agents and their work are visible;
3. a modern dashboard for the paper portfolio, prices, trades, agent activity, Cala relationships, and decision receipts.

Selected registry components:

- `@23rd/shader-gradient`
- optional `@23rd/live-orb`
- `@7ovr/activity-1`
- `@7ovr/chat-4`
- `@abui/animated-chart`
- `@abui/text-gradient`
- regular shadcn components for the application shell

The supplied futuristic white-panel image remains the primary visual reference.
