# Technical reference pack

Sources:

- [React technical references](../raw-sources/react-technical-references-2026-08-28.md)
- [User-selected shadcn components](../raw-sources/user-selected-ui-components-2026-08-28.md)
- [Sonar AI, eToro, and paper-trading decision](../raw-sources/sonar-etoro-paper-decision-2026-08-29.md)

Detailed composition: [interface plan](interface-plan.md)

## Recommended stack

Use one application, Motion for DOM transitions, and one primary 3D sphere. The repository is a pnpm workspace monorepo (see the [naming and monorepo decision](../raw-sources/naming-monorepo-decision-2026-08-29.md)). Isolate the selected WebGL shader background to onboarding and waiting states:

- **Next.js, React, and TypeScript** for the application and server-side Cala adapter.
- **Tailwind CSS and shadcn/ui with the Base UI preset** for the application shell, onboarding, Saloon, dashboard, and accessible controls.
- **23rd Shader Gradient** for onboarding atmosphere and selected waiting states.
- **7ovr Activity and Chat blocks** for agent presence and the Saloon execution trace.
- **abui Animated Chart and Text Gradient** for agent work counts and one thinking label.
- **Motion for React** for panels, number changes, cards, graph labels, and state transitions.
- **React Three Fiber, Drei, and React Postprocessing** for the living sphere.
- **React Flow and ELK.js** for a deterministic relationship graph.
- **Zustand** for demo state and portfolio state.
- **Zod** at every server boundary and fixture load.
- **TanStack Query** for Cala and read-only eToro requests, retries, caching, and fixture fallbacks.
- **Recharts** only for one small portfolio or exposure chart.
- **Lucide React** for interface icons.

Do not use GSAP, Motion, Rive, Lottie, and Three.js for overlapping jobs. Motion plus React Three Fiber is enough. The selected Shader Gradient is a contained background effect, not a third general animation system. Add Rive only if a designer supplies a finished `.riv` asset that replaces the 3D sphere.

## Why these choices

### Next.js instead of a client-only Vite app

The Cala credential must stay on the server. A Next.js route handler can call Cala, validate its response, remove sensitive fields, and return the normalized graph to the browser. The 3D and graph components remain client components.

Use Vite only if the team decides to run entirely from prepared fixtures and does not need a protected API key.

### React Three Fiber for the sphere

The sphere is a product-state display, not decoration. React Three Fiber lets React state drive material, light, rotation, distortion, and camera changes.

Drei's `MeshTransmissionMaterial` can create the glossy, refractive surface in the reference. Keep a cheaper `meshPhysicalMaterial` fallback for weak GPUs. Use postprocessing sparingly. Bloom and subtle noise are enough.

### React Flow instead of a free-running force graph

The graph must tell the same story every time. React Flow supports custom nodes, source-linked edge labels, animated paths, selection, and controlled layouts. ELK.js can place the event on the left, related entities in the center, and portfolio positions on the right.

A force graph looks energetic but may move labels, hide the important path, or produce a different demo on every run.

### Zustand instead of a large workflow framework

The MVP has one linear committee review. A small Zustand store with a typed `FundPhase` is enough. Add XState only if retries, branching, cancellation, and parallel operations become hard to reason about.

## MVP agent architecture

Source basis: [MVP agent-structure direction](../raw-sources/agent-structure-mvp-direction-2026-08-29.md) and [cash-only MVP direction](../raw-sources/cash-only-mvp-direction-2026-08-29.md). Use five decision agents plus one post-decision writer under one code-owned orchestrator. This is an investment committee, not a swarm.

```text
portfolio + mandate + scenario
              |
       AnalysisOrchestrator
        /        |        \
Fundamental  Market      Risk
 Analyst     Context     Officer
        \        |        /
        Portfolio Manager proposal
                  |
            Bear / Critic
                  |
        Portfolio Manager revision
                  |
          human approve/reject
             /            \
       paper ledger    Report Writer
```

Implementation split:

- `Portfolio Manager` owns capital allocation and revision. It receives summaries and portfolio state; it does not browse broadly, calculate risk math, or invent ratios.
- `Fundamental Analyst` evaluates business, financial strength, valuation, catalysts, and risks from an isolated company evidence pack.
- `Market Context Analyst` evaluates news, sector, macro, competitors, regulation, earnings calendar, and material events from an isolated context pack.
- `Risk Officer` calls deterministic analytics and can hard-block `POSITION_LIMIT_BREACH`, `RISK_MANDATE_BREACH`, or `DATA_INVALID`. It cannot be overridden by Portfolio Manager.
- `Bear/Critic` receives proposal, evidence, research summaries, context, and risk report. It flags uncertainty and failure scenarios but cannot veto.
- `Communications/Report Writer` runs only after human decision. It formats decision record, internal report, and permitted eToro-facing copy. It cannot mutate allocation.

Cala relationship tracing is a sourced tool/data capability used by research stages, not a separate agent. eToro remains read-only. Trader is deterministic paper-ledger code, not an agent and not a broker client.

For MVP, use plain TypeScript orchestration rather than LangGraph, AutoGen, a queue, distributed services, or autonomous background loops. Persist one `InvestmentCommitteeState` per run. Permit fixture replay and one bounded retry at external/model stages. Keep stage boundaries replaceable for future workers without changing UI contracts.

The orchestrator may run Fundamental Analyst and Market Context Analyst in parallel after asset selection. Risk waits for proposed actions; Bear/Critic waits for risk output; Report Writer waits for human decision.

The browser receives stage events and final records, never prompts, credentials, hidden chain-of-thought, or uncited prose. Agent messages are rendered summaries derived from typed outputs.

### Isolated agent context

Do not give every agent one giant prompt:

- Fundamental: mandate, company data, filings, previous thesis, research tools.
- Market Context: portfolio holdings, selected assets, current events, sector and macro evidence.
- Risk: portfolio state, proposed changes, mandate, deterministic analytics tools.
- Bear/Critic: recommendation, supporting/opposing evidence, fundamental report, context report, risk report.
- Portfolio Manager: structured summaries from all stages plus portfolio and mandate.
- Report Writer: final decision record, approval, evidence, and portfolio comparison only.

### Authority model and MVP tools

Do not use vote counting. Each role owns a domain:

| Role | Authority | Cannot do |
| --- | --- | --- |
| Portfolio Manager | Propose and revise allocation | Override Risk Officer or approve its own exception |
| Fundamental Analyst | Evaluate asset quality and valuation | Set portfolio sizing |
| Market Context Analyst | Explain material external context | Turn one macro fact into an automatic trade |
| Risk Officer | Hard-block invalid data or mandate breaches | Approve a breach |
| Bear/Critic | Flag weak assumptions and failure scenarios | Veto recommendation |
| Report Writer | Explain approved decision | Influence allocation |

Expose small typed tools only:

```text
get_portfolio_snapshot()
get_price_history(instrument)
get_company_fundamentals(instrument)
search_company_information(query)
calculate_portfolio_metrics(portfolio)
calculate_asset_exposure(portfolio, instrument)
run_stress_test(portfolio, scenario)
compare_portfolio_scenarios(current, proposed)
get_existing_thesis(instrument)
save_recommendation(recommendation)
```

`search_company_information` and relationship tracing use Cala or sanitized fixtures. Price data uses read-only eToro adapter or fixture. `save_recommendation` writes internal state only. No tool submits orders, changes brokerage accounts, or lets one agent call another directly.

## Core packages

Use pnpm consistently:

```bash
pnpm add motion three @react-three/fiber @react-three/drei \
  @react-three/postprocessing @xyflow/react elkjs zustand \
  @tanstack/react-query zod recharts lucide-react
```

After creating the project, run `pnpm dlx shadcn@latest info`. The `@7ovr` blocks declare Base UI dependencies, so initialize with a Base UI preset such as `base-nova`.

Preview selected registry components before installing:

```bash
pnpm dlx shadcn@latest add \
  @23rd/shader-gradient @23rd/live-orb \
  @7ovr/activity-1 @7ovr/chat-4 \
  @abui/animated-chart @abui/text-gradient \
  --dry-run
```

The Animated Chart registry metadata references Motion 12. Inspect the dry run and keep one compatible Motion version rather than silently downgrading the application.

## Application boundaries

```text
Browser
  Onboarding
    ShaderGradient
    MandateSetup
    AgentIntroduction
  Saloon
    AgentRoster
    AgentChat
    EvidencePanel
  Dashboard
    PortfolioSummary
    FundOrbCanvas
    PriceChart
    RecentTrades
    AgentActivityChart
    RelationshipGraph
    DecisionReceipt

Server
  /api/analyze-event
    AnalysisOrchestrator
      FundamentalAnalyst
      MarketContextAnalyst
      RiskOfficer
      BearCritic
      PortfolioManager
      ReportWriter
    CalaClient
    ResponseNormalizer
    EvidenceValidator
    RiskEngine
    FixtureFallback
  /api/market-data
    EtoroReadOnlyClient
    MarketDataNormalizer
    MarketDataFixtureFallback
```

The browser never receives Cala or eToro credentials. The eToro adapter is read-only and cannot submit orders. The model never receives uncited graph prose as fact. The risk engine remains a pure deterministic module.

## Shared data contract

Define one normalized response before building UI:

```text
Analysis
  run
  portfolioSnapshot
  mandate
  materialEvents[]
  fundamentalReports[]
  marketContext
  riskReport
  proposedActions[]
  bearCase
  finalRecommendation
  userDecision
  report
  activities[]
  nodes[]
  edges[]
  evidence[]
  bullThesis
  bearThesis
  proposedOrders[]
  riskChecks[]
  acceptedOrders[]
  marketSnapshot
  phase
```

Each edge and thesis claim carries one or more `evidenceIds`. Every timestamp includes its source and whether the event is live, historical, or synthetic.

Each stage output carries `runId`, `stage`, `status`, `startedAt`, `completedAt`, and a stable output ID. Failed or skipped stages remain visible in the receipt. A model output is invalid until its Zod schema passes and all material claims resolve to known evidence IDs. `userDecision` is required before paper-ledger mutation.

Use one `InvestmentCommitteeState` object enriched by each stage, not prose passed from prompt to prompt. Keep deterministic analytics outputs separate from model interpretation.

MVP starts with `portfolioSnapshot.cash = €1,000` and zero invested positions. Candidate instruments are a separate five-asset research universe. Current-versus-proposed comparison therefore compares all-cash baseline against proposed allocation and retained cash.

## Fund state model

Use this explicit union:

```text
idle
observing
tracing
proposing
challenging
awaiting_approval
executing
blocked
complete
```

The sphere, panel copy, graph animation, and allowed controls all derive from the same phase. Never run unrelated animation timers that can drift apart.

## Sphere implementation

### Geometry

- One high-quality sphere, not a particle cloud.
- Slightly irregular vertex motion through a shader or Drei material distortion.
- A small shadow plane to anchor it to the panel.
- One environment map for controlled reflections.

### State properties

Map each phase to:

- material color;
- roughness and transmission;
- distortion strength;
- rotation speed;
- key light color;
- ring or seam visibility;
- scale pulse.

Drive changes through springs rather than replacing the entire canvas.

### Performance budget

- Render one WebGL canvas.
- Cap device pixel ratio around 1.5.
- Pause rendering when the tab is hidden.
- Avoid real-time shadows if a baked or contact shadow works.
- Respect `prefers-reduced-motion` and render a static sphere state.
- Test the deployed build on the presentation laptop before adding postprocessing.

## Relationship graph implementation

Use four node types:

- event;
- company or person;
- relationship or evidence cluster;
- portfolio position.

Use three edge treatments:

- gray for known context;
- cyan for the active causal hypothesis;
- amber for uncertain or incomplete evidence.

Animate only the path currently being explained. All other edges remain still. Clicking an edge opens the source, relation type, observation date, and confidence limitation.

## Motion rules

- Use `AnimatePresence` for cards entering and leaving.
- Use layout animations when the portfolio weights change.
- Use shared layout IDs when an event card becomes a graph node.
- Keep normal transitions between 180 and 350 milliseconds.
- Reserve the slower 700 to 1,200 millisecond motion for the main graph reveal.
- Animate numbers with Motion values rather than a separate counter library.
- Never animate red and green market ticks continuously. The product is reasoning, not casino theatre.

## Visual references and what to borrow

| Reference | Borrow | Do not copy |
| --- | --- | --- |
| User image | Warm white, large radius, editorial spacing, glossy sphere, deep blue active state | Quantum text, branding, exact layout |
| IBM Quantum | Scientific restraint, blue depth, technical credibility | Corporate density |
| Palantir Foundry | Objects connected by sourced relationships | Enterprise chrome and excessive controls |
| BlackRock Aladdin | Mandate, exposure, scenario, and risk vocabulary | Dense institutional dashboard styling |
| Linear | Fast transitions, quiet hierarchy, precise spacing | Dark developer-tool identity |
| Rive | State-driven animation thinking | A second runtime unless it replaces Three.js |

## Initial design tokens

```css
--canvas: #f3f4f2;
--panel: #fbfbfa;
--ink: #161719;
--muted: #85898f;
--line: rgba(22, 23, 25, 0.10);
--navy: #06182f;
--blue: #087f9d;
--cyan: #39bdd1;
--amber: #d7a742;
--risk: #c95b55;
--radius-panel: 32px;
--gap-panel: 20px;
```

Use `Instrument Sans`, `Geist`, or another available neutral grotesk. Pick one family. Do not combine several display fonts.

## Repository layout (pnpm workspace)

The repository is a monorepo. Use feature folders inside `apps/web`, keep shadcn-managed primitives in `components/ui`, and keep external integrations under `lib/server`.

The full proposed tree and ownership rules live in the [team workflow](team-workflow.md).

Workspace rules:

- `packages/core` and `packages/risk-engine` never import React or Next.js.
- `packages/core` owns cross-lane Zod schemas and stable IDs for events, evidence, graph records, theses, market snapshots, orders, risk results, and receipts.
- Cala stays in `apps/web/lib/server/cala`.
- eToro stays in `apps/web/lib/server/etoro` and exposes read-only normalized data only.
- UI code imports shared types from `packages/core` and never infers agent or risk state by parsing prose.
- The risk engine consumes plain data from `packages/core` and returns plain results.
- A contract change updates its schema, fixture, parser, and consuming test in the same pull request.

## Build order

1. Scaffold the pnpm workspace, initialize shadcn with `base-nova`, inspect each registry component, and define validated shared contracts plus one fixture.
2. Build the four-scene onboarding flow as its own Marc-owned feature.
3. Build static Saloon and dashboard shells against reviewed fixture contracts.
4. Implement typed `AnalysisOrchestrator`, `InvestmentCommitteeState`, isolated agent outputs, sourced evidence, and explicit phase transitions.
5. Make the sphere respond to idle, tracing, and complete.
6. Render one fixed relationship graph from a fixture and animate the active path.
7. Implement deterministic portfolio metrics, Risk Officer hard blocks, and human approval gate.
8. Connect the Saloon trace, recommendation comparison, approval control, and decision receipt to typed records.
9. Add server-side Cala and read-only eToro adapters behind fixture fallbacks.
10. Add Shader Gradient, the active-agent chart, and final polish only after the full three-minute sequence works.

## Cut list if time runs short

Cut autonomous loops, framework integration, postprocessing, then full sphere state set, then live orb, then active-agent chart, then interactive graph dragging. Keep a static price chart if needed. Never cut source inspection, deterministic risk rejection, fixture fallback, Bear/Critic challenge, human approval, or decision receipt.
