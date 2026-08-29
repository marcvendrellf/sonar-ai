# Team workflow

Sources:

- [Team ownership and delivery direction](../raw-sources/team-ownership-and-delivery-2026-08-29.md)
- [Alpaca paper-trading verification](../raw-sources/alpaca-paper-trading-verification-2026-08-29.md)
- [UI consolidation and parallel branch decision](../raw-sources/ui-consolidation-branch-decision-2026-08-29.md)

Read this page before choosing an issue or opening a branch.

## Ownership

| Person | Primary lane | Responsibility |
| --- | --- | --- |
| Marc | Frontend | Onboarding, Saloon, dashboard, motion, accessibility, responsive behavior, and integration of typed agent events |
| Josep | Agents and data | Shared ownership of agent behavior, Cala and Alpaca adapters, evidence records, and the analysis pipeline. Individual issues are not split yet. |
| Axel | Agents and data | Shared ownership of agent behavior, Cala and Alpaca adapters, evidence records, and the analysis pipeline. Individual issues are not split yet. |

Josep and Axel assign one direct owner to every agent-side issue. Two coding agents must not edit the same shared files without coordination.

Ownership still needed: `packages/core`, `packages/risk-engine`, Cala integration, Alpaca integration, fixtures, deployment, and pitch.

## Concerns by lane

### Josep and Axel

- MVP agent runtime is one code-owned server-side `AnalysisOrchestrator` with five decision agents: Portfolio Manager, Fundamental Analyst, Market Context Analyst, Risk Officer, and Bear/Critic. Communications/Report Writer runs only after human decision. This is not six always-running services.
- Agent outputs are typed reports and material events with evidence-linked claims, portfolio actions, approval records, and decision receipts. They are not free-form chat transcripts.
- Fundamental and Market Context agents receive isolated evidence packs. Risk Officer calls deterministic analytics and can hard-block. Bear/Critic flags uncertainty but cannot veto. Report Writer cannot influence allocation.
- Portfolio Manager proposes and revises sizing; it does not calculate risk manually. Cala relationship tracing is a research capability, not a separate agent. Trader is deterministic paper-ledger code.
- Every material graph edge and thesis claim includes evidence IDs.
- Fundamental/Market Context reports can support different conclusions while citing the same evidence; Bear/Critic challenges proposal without veto power.
- Risk Officer calls the pure deterministic risk engine. A model cannot approve its own exception.
- Cala and Alpaca credentials remain on the server.
- Alpaca is fixed to paper trading; live endpoint and credentials are forbidden.
- Sonar submits only human-approved, deterministic-risk-passed paper orders and never submits real-money orders.
- Zod validates every external response and fixture.
- The complete demo works from sanitized fixtures without network access.
- Historical, synthetic, and live data remain labeled.

The frontend must receive stable IDs and explicit records for phases, activity, findings, evidence, graph edges, theses, risk results, prices, paper orders, and receipts. It must not parse prose to discover state.

### Marc

- Onboarding is a dedicated epic, not a last-minute splash screen.
- Motion explains state changes and does not hide evidence or delay navigation.
- The orb, graph, copy, and controls derive from the shared fund phase.
- The Saloon shows observable work only. It does not simulate filler conversation.
- The warm Saloon rebuild keeps one React Three Fiber runtime, stores every room asset locally, records provenance and licenses, uses simple matte clay-style materials and broad soft light, and avoids photoreal texture packs.
- UI components consume contracts from `packages/core` and do not recreate agent or risk logic.
- Generated shadcn primitives stay in `components/ui`; feature composition stays in feature folders.
- Use semantic tokens, keyboard access, and `prefers-reduced-motion`.
- Test onboarding and the main reveal on the presentation laptop.

## Delivery epics

### Epic 0: workspace and contracts

Scaffold the pnpm workspace, initialize shadcn with `base-nova`, inspect registry additions, define shared Zod contracts, and load one valid offline fixture.

### Epic 1: onboarding and motion

Owner: Marc.

Status: the opening interaction is implemented at `/` and `/onboarding`; completion enters `/saloon`, while the dashboard remains available at `/dashboard`.

Preserve the light custom eye orb, light Sonar-blue Shader Gradient, editorial heading font, and inline `Hi, [name]!` interaction as Scene 1. Keep the opening wash clear and pale; exclude navy, deep-water, and near-black tones. The implemented continuation now confirms the €1,000 all-cash baseline, offers the three deterministic mandate profiles as compact percentage cards, and lets the user toggle U.S. stocks, ETFs, and select crypto as presentational research classes. All three classes start selected. Question copy uses the same reduced-motion-safe blur-and-rise language as the opening greeting, and React Bits `BorderGlow` frames selection cards and primary actions. A follow-up must connect these locally stored choices to the reviewed shared fixture, then add the fund explanation, committee introduction, and entry into the Saloon without adding chrome to the opening scene.

Done means the flow works with keyboard and pointer input, supports replay and reduced motion, handles WebGL failure, and runs smoothly on the presentation laptop.

### Epic 2: sourced analysis pipeline

Primary lane: Josep and Axel. Assign one owner per issue.

Deliver the fixture-first portfolio-review flow, typed `AnalysisOrchestrator`, isolated agent contexts, Cala normalization, evidence graph, deterministic portfolio comparison, adversarial critique, typed activity events, human approval, and explicit phase transitions. Do not add a workflow framework or autonomous loop for MVP.

### Epic 3: Saloon integration

Marc owns the single-table 3D scene, local clay-style cutaway shell and asset provenance, shared-canvas agent orbs, table and interview camera states, broad soft-light rig, right-side selected-agent details, bottom-right new-findings bell, keyboard fallback, and reduced-motion behavior. Josep and Axel own the events, finding records, evidence records, deduplication, and live or fixture delivery it consumes. Shared contract changes require cross-lane review.

### Epic 4: market data, mandate, risk, portfolio, and receipt

The data lane owns the Alpaca Paper adapter and market-data fixtures. The risk-engine owner owns deterministic pass, resize, and reject results. Marc owns portfolio and receipt presentation.

Status: the fixture dashboard now uses outlined shadcn cards, dark and light themes, three animated headline metrics, and a gradient-area NAV chart. Browser-local demo sign-in and sign-up routes feed the sidebar account menu and sign-out control; they are not production authentication. The dashboard still needs reviewed shared fixtures and the committee-role mapping.

Done means one recommendation is approved by a human, one action is accepted, and another is resized or rejected by deterministic checks. No path can submit a live order.

### Epic 5: demo integration and lock

Freeze the €1,000 all-cash baseline, five-asset U.S. candidate universe, Cala fixture, Alpaca Paper fixture, three-minute script, and offline mode. Run the production build on the presentation laptop.

## Branch policy

The consolidated UI checkpoint is the common baseline on `main`. Three frontend agents may now work in parallel from that exact commit:

```text
feat/onboarding-polish
feat/dashboard-polish
feat/saloon-polish
```

Ownership boundaries:

| Branch | Primary ownership |
| --- | --- |
| `feat/onboarding-polish` | `apps/web/app/page.tsx`, `apps/web/app/onboarding/`, `apps/web/features/onboarding/` |
| `feat/dashboard-polish` | `apps/web/app/dashboard/`, `apps/web/features/dashboard/` |
| `feat/saloon-polish` | `apps/web/app/saloon/`, `apps/web/features/saloon/`, Saloon assets and `apps/web/scripts/build-saloon-shell.mjs` |

Shared files require coordination before editing:

- `apps/web/app/globals.css`;
- `apps/web/app/layout.tsx`;
- `apps/web/components/application-shell1.tsx` and other cross-feature components;
- `apps/web/package.json` and `pnpm-lock.yaml`;
- `packages/core` and `packages/risk-engine`;
- shared fixtures and maintained wiki pages.

Rules:

1. One person and one coding agent own each branch at a time.
2. Each branch starts from the same consolidated `main` commit.
3. Do not edit another branch's primary feature folder.
4. Ask before changing a shared file. Keep the change narrow and report it in the handoff.
5. Open a draft pull request early when changing shared contracts or fixture shapes.
6. Require cross-lane review for `packages/core`, API shapes, phase names, visual mappings, and fixtures.
7. Rebase or merge current `main` before final validation when another UI branch lands first.
8. Delete merged branches and start follow-up work from current `main`.

## Proposed repository structure

```text
apps/
  web/
    app/
      onboarding/page.tsx
      saloon/page.tsx
      dashboard/page.tsx
      decisions/[id]/page.tsx
      api/analyze-event/route.ts       # invokes one typed committee run
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
          orchestrator.ts
          agents/
            portfolio-manager.ts
            fundamental-analyst.ts
            market-context.ts
            risk-officer.ts
            bear-critic.ts
            report-writer.ts
        cala/
        alpaca/              # paper-only adapter
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
      findings.ts
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
- `lib/server/alpaca` is the only Alpaca integration location and exposes paper-only normalized data and order methods.
- `lib/server/analysis` owns orchestrator and agent stage boundaries. Agent contexts stay isolated and outputs use Zod schemas.
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
- show human-approval gate and post-decision Report Writer ordering;
- prove Alpaca code cannot reach live endpoint and submits only paper orders;
- update the wiki when architecture, scope, ownership, or demo behavior changes.
