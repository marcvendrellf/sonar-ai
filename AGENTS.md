# Agent Fund repository contract

## Final objective

Build Agent Fund for the {Tech: Europe} x Cala Summer Lock-In. It is an autonomous paper hedge fund that traces source-linked relationships behind events before changing a simulated portfolio.

The concept decision is final. Do not restart ideation or reintroduce discarded concepts unless the user explicitly asks.

## Three layers

1. `raw-sources/` contains immutable captures and supplied assets. External sources remain authoritative. Never rewrite a capture. Add a dated replacement when a source changes.
2. `llm-wiki/` contains the maintained project synthesis. Agents may edit these pages as evidence, implementation, and decisions change.
3. `AGENTS.md` defines the repository contract.

Do not copy the raw layer into the wiki. Cite the smallest useful source and explain what it changes.

## Required reading order

Before planning or implementation, read:

1. `llm-wiki/index.md`
2. `llm-wiki/overview.md`
3. `llm-wiki/concepts/agent-fund.md`
4. `llm-wiki/interface-plan.md`
5. `llm-wiki/technical-reference-pack.md`
6. `llm-wiki/open-questions.md`

Read `llm-wiki/cala-finance.md` before making Cala assumptions.

## Current page types

- `index.md` is content-oriented navigation and the required first read.
- `overview.md` records the final decision, scope, state, and next actions.
- `concepts/agent-fund.md` defines the product, demo, risk boundaries, and visual direction.
- `interface-plan.md` defines onboarding, the Saloon, dashboard, and selected shadcn components.
- `technical-reference-pack.md` defines the stack, architecture, performance rules, and build order.
- `cala-finance.md` records Cala's claimed capabilities and unverified assumptions.
- `event-brief.md` records confirmed event constraints.
- `hackathon-winner-patterns.md` preserves relevant external product lessons.
- `open-questions.md` tracks blockers with closure conditions.
- `log.md` is chronological and append-only.

Prefer updating these pages over creating new pages.

## Claim types

Use these labels when the distinction matters:

- **Fact** comes directly from a cited source or observed command output.
- **Inference** follows from facts but remains unconfirmed.
- **Decision** records a team or user choice.
- **Blocker** prevents implementation or validation.
- **Open question** includes a concrete closure condition.

Treat Cala product-page statements as vendor claims until an API fixture confirms them. Never claim that Cala supports a field, geography, freshness level, or relation unless a source or test proves it.

## Product boundaries

- Paper trading only
- No broker or exchange integration
- No customer funds
- No promised returns
- No personalized investment advice
- Every material graph edge and thesis claim carries evidence IDs
- Relationships never become unqualified causal claims
- Historical, synthetic, and live information are labeled
- The model proposes hypotheses and explanations
- Deterministic code enforces the mandate and risk checks
- The demo retains a sanitized offline fixture path

## Implementation decisions

- Use pnpm consistently. Do not mix pnpm, npm, yarn, or Bun commands.
- Use Next.js, React, and TypeScript.
- Use shadcn/ui with the Base UI `base-nova` preset.
- Run `pnpm dlx shadcn@latest info` after scaffolding and before component work.
- Preview third-party registry additions with `--dry-run`, `--view`, or `--diff` before installation.
- Never use `--overwrite` without reviewing the diff.
- Use semantic shadcn tokens and component variants instead of raw status colors.
- Preserve required shadcn composition and accessibility structure.
- Keep Cala credentials and calls on the server.
- Validate server responses and fixtures with Zod.
- Keep the risk engine pure and independent from React.

Selected registries:

- `@23rd/shader-gradient`
- optional `@23rd/live-orb`
- `@7ovr/activity-1`
- `@7ovr/chat-4`
- `@abui/animated-chart`
- `@abui/text-gradient`

## Source and citation rules

- Link wiki facts to files in `raw-sources/` when a local capture exists.
- Include original URL and retrieval date in each web capture.
- For Cala experiments, save sanitized request shape, response shape, date, and result in a new raw source.
- Never save API keys, private attendee details, customer data, or personal financial data.
- Separate source facts from agent analysis in data structures and UI.

## Ingest workflow

1. Read the index and relevant current pages.
2. Add the source to `raw-sources/` without changing older captures.
3. Update every wiki page whose conclusion changes.
4. Update `llm-wiki/index.md` if navigation changes.
5. Append one dated entry to `llm-wiki/log.md`.
6. Update `llm-wiki/open-questions.md` when a blocker opens or closes.

## Maintenance checks

Check for stale event details, unsupported Cala claims, broken links, orphan pages, contradictory implementation decisions, unresolved blockers, raw captures without retrieval dates, and registry code that drifted from its inspected source.

Confirm that:

- `index.md` reflects current content;
- `overview.md` reflects current implementation state;
- `log.md` remains chronological;
- concept selection remains closed;
- the offline demo path still works.
