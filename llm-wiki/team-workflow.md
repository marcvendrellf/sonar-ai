# Team workflow

Sources:

- [Team ownership and delivery direction](../raw-sources/team-ownership-and-delivery-2026-08-29.md)
- [Sonar AI, eToro, and paper-trading decision](../raw-sources/sonar-etoro-paper-decision-2026-08-29.md)

Read this page before choosing an issue or opening a branch.

## Ownership

| Person | Primary lane | Responsibility |
| --- | --- | --- |
| Marc | Frontend | Onboarding, Saloon, dashboard, motion, accessibility, responsive behavior, and integration of typed agent events |
| Josep | Agents and data | Shared ownership of agent behavior, Cala and eToro adapters, evidence records, and the analysis pipeline. Individual issues are not split yet. |
| Axel | Agents and data | Shared ownership of agent behavior, Cala and eToro adapters, evidence records, and the analysis pipeline. Individual issues are not split yet. |

Josep and Axel assign one direct owner to every agent-side issue. Two coding agents must not edit the same shared files without coordination.

Ownership still needed: `packages/core`, `packages/risk-engine`, Cala integration, eToro integration, fixtures, deployment, and pitch.

## Concerns by lane

### Josep and Axel

- Agent outputs are typed events, evidence-linked claims, proposed orders, and decision receipts. They are not free-form chat transcripts.
- Every material graph edge and thesis claim includes evidence IDs.
- Analyst and Skeptic can disagree while citing the same evidence.
- Marshal calls the pure deterministic risk engine. A model cannot approve its own exception.
- Cala and eToro credentials remain on the server.
- eToro is read-only unless an official paper-trading interface is verified.
- Sonar simulates orders internally and never submits real-money orders.
- Zod validates every external response and fixture.
- The complete demo works from sanitized fixtures without network access.
- Historical, synthetic, and live data remain labeled.

The frontend must receive stable IDs and explicit records for phases, activity, evidence, graph edges, theses, risk results, prices, paper orders, and receipts. It must not parse prose to discover state.

### Marc

- Onboarding is a dedicated epic, not a last-minute splash screen.
- Motion explains state changes and does not hide evidence or delay navigation.
- The orb, graph, copy, and controls derive from the shared fund phase.
- The Saloon shows observable work only. It does not simulate filler conversation.
- UI components consume contracts from `packages/core` and do not recreate agent or risk logic.
- Generated shadcn primitives stay in `components/ui`; feature composition stays in feature folders.
- Use semantic tokens, keyboard access, and `prefers-reduced-motion`.
- Test onboarding and the main reveal on the presentation laptop.

## Delivery epics

### Epic 0: workspace and contracts

Scaffold the pnpm workspace, initialize shadcn with `base-nova`, inspect registry additions, define shared Zod contracts, and load one valid offline fixture.

### Epic 1: onboarding and motion

Owner: Marc.

Build fund wake-up, mandate setup, agent introduction, and entry into the Saloon.

Done means the flow works with keyboard and pointer input, supports replay and reduced motion, handles WebGL failure, and runs smoothly on the presentation laptop.

### Epic 2: sourced analysis pipeline

Primary lane: Josep and Axel. Assign one owner per issue.

Deliver the fixture-first event flow, Cala normalization, evidence graph, competing theses, typed activity events, and explicit phase transitions.

### Epic 3: Saloon integration

Marc owns the interface. Josep and Axel own the events and evidence records it consumes. Shared contract changes require cross-lane review.

### Epic 4: market data, mandate, risk, portfolio, and receipt

The data lane owns the read-only eToro adapter and price fixtures. The risk-engine owner owns deterministic pass, resize, and reject results. Marc owns portfolio and receipt presentation.

Done means one paper order is accepted and another is resized or rejected. No path can submit a live order.

### Epic 5: demo integration and lock

Freeze the event, five paper positions, Cala fixture, eToro price fixture, three-minute script, and offline mode. Run the production build on the presentation laptop.

## Branch proposal

Use one issue or coherent feature per branch from current `main`:

```text
feat/<issue-number>-<short-name>
fix/<issue-number>-<short-name>
docs/<issue-number>-<short-name>
```

Examples:

```text
feat/12-onboarding-flow
feat/18-agent-event-contract
feat/23-etoro-market-data
```

Rules:

1. One person and one coding agent own a branch at a time.
2. Open a draft pull request early when changing shared contracts.
3. Do not mix registry installation, contract changes, and a full feature in one pull request.
4. Require cross-lane review for `packages/core`, API shapes, phase names, visual mappings, and fixtures.
5. Merge foundation and contract work before dependent branches.
6. Delete merged branches and start follow-up work from current `main`.

Feature-per-branch is the current proposal. The exact naming policy still needs team acceptance.

## Proposed repository structure

```text
apps/
  web/
    app/
      onboarding/page.tsx
      saloon/page.tsx
      dashboard/page.tsx
      decisions/[id]/page.tsx
      api/analyze-event/route.ts
      api/market-data/route.ts
    features/
      onboarding/
      saloon/
      dashboard/
      relationship-graph/
      decision-receipt/
      fund-orb/
    components/
      ui/                    # shadcn-managed primitives only
      shell/
    lib/
      client/
      server/
        analysis/
          agents/
        cala/
        etoro/               # read-only adapter
      demo/
    fixtures/
    tests/
      e2e/
packages/
  core/
    src/
      analysis.ts
      agents.ts
      evidence.ts
      events.ts
      market-data.ts
      phases.ts
      portfolio.ts
      receipts.ts
  risk-engine/
    src/
      engine.ts
      mandate.ts
      rules/
```

Folder rules:

- `packages/core` owns cross-lane types and Zod schemas and imports neither React nor Next.js.
- `packages/risk-engine` stays pure and consumes plain values from `packages/core`.
- `lib/server/cala` is the only Cala client location.
- `lib/server/etoro` is the only eToro integration location and exposes read-only normalized data.
- Route handlers stay thin.
- Keep unit tests beside the module they test. Reserve `tests/e2e` for complete flows.

## Coding-agent handoff

Before work:

- read the wiki in the order listed in [index](index.md);
- name the epic, issue, branch, owner, and likely files;
- identify the contract consumed or produced;
- check whether another branch owns the same shared files.

Before review:

- run the relevant pnpm checks;
- test fixture mode;
- list contract and fixture changes;
- show reduced-motion and keyboard checks for UI work;
- show evidence-link and deterministic-risk tests for agent work;
- prove eToro code cannot submit orders;
- update the wiki when architecture, scope, ownership, or demo behavior changes.
