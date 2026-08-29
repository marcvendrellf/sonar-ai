# Technical reference pack

Sources:

- [React technical references](../raw-sources/react-technical-references-2026-08-28.md)
- [User-selected shadcn components](../raw-sources/user-selected-ui-components-2026-08-28.md)
- [Alpaca paper-trading verification](../raw-sources/alpaca-paper-trading-verification-2026-08-29.md)
- [Saloon 3D authoring references](../raw-sources/saloon-3d-authoring-references-2026-08-29.md)
- [Saloon clay-style visual decision](../raw-sources/saloon-clay-style-decision-2026-08-29.md)

Detailed composition: [interface plan](interface-plan.md)

## Recommended stack

Use one application, Motion for DOM transitions, and one WebGL scene per active screen. The Saloon places its meeting table and agent orbs in one shared scene. The repository is a pnpm workspace monorepo (see the [naming and monorepo decision](../raw-sources/naming-monorepo-decision-2026-08-29.md)). Isolate the selected WebGL shader background to onboarding and waiting states:

- **Next.js, React, and TypeScript** for the application and server-side Cala adapter.
- **Tailwind CSS and shadcn/ui with the Base UI preset** for the application shell, onboarding, Saloon, dashboard, and accessible controls.
- **23rd Shader Gradient** for onboarding atmosphere and selected waiting states.
- **7ovr Activity and Chat blocks** for agent presence and the Saloon execution trace.
- **abui Animated Chart and Text Gradient** for agent work counts and one thinking label.
- **Motion for React** for panels, number changes, cards, graph labels, and state transitions.
- **React Three Fiber, Drei, and React Postprocessing** for the living fund sphere and the single-table Saloon scene.
- **Triplex** as a development-only visual workspace for React Three Fiber composition and light tuning. It is not a production runtime dependency.
- **Locally stored, license-recorded assets** for the simple room shell and an optional subdued environment. Photoreal material packs are not part of the clay-style target.
- **React Flow and ELK.js** for a deterministic relationship graph.
- **Zustand** for demo state and portfolio state.
- **Zod** at every server boundary and fixture load.
- **TanStack Query** for Cala and Alpaca Paper requests, retries, caching, and fixture fallbacks.
- **Recharts** only for one small portfolio or exposure chart.
- **Lucide React** for interface icons.

Do not use GSAP, Motion, Rive, Lottie, and Three.js for overlapping jobs. Motion plus React Three Fiber is enough. The selected Shader Gradient is a contained background effect, not a third general animation system. Add Rive only if a designer supplies a finished `.riv` asset that replaces the 3D sphere.

Do not add the Spline runtime or a second WebGL canvas to the final Saloon. Do not replace the room with an abstract threecn effect. Spline and threecn may help with reference work, but the shipped room remains one local asset inside the existing React Three Fiber scene.

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
- `Communications/Report Writer` runs only after human decision. It formats decision record and internal report. It cannot mutate allocation.

Cala relationship tracing is a sourced tool/data capability used by research stages, not a separate agent. Alpaca Paper is the execution adapter after approval. Trader remains deterministic paper-ledger receipt code, not an autonomous agent.

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

`search_company_information` and relationship tracing use Cala or sanitized fixtures. Market and portfolio data use Alpaca Paper or fixture. `save_recommendation` writes internal state only. Alpaca order submission requires explicit human approval and deterministic risk pass; no tool can reach a live endpoint.

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
    SaloonSceneCanvas
      MeetingTable
      AgentOrbs
      SaloonCameraRig
    AgentInterviewPanel
    NewFindingsBell
    NewFindingsPanel
    SaloonRosterFallback
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
    AlpacaPaperClient
    AlpacaNormalizer
    MarketDataFixtureFallback
```

The browser never receives Cala or Alpaca credentials. Alpaca client is server-only and fixed to `https://paper-api.alpaca.markets/v2`; it cannot reach a live endpoint. The model never receives uncited graph prose as fact. The risk engine remains a pure deterministic module.

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
  findings[]
  bullThesis
  bearThesis
  proposedOrders[]
  riskChecks[]
  acceptedOrders[]
  marketSnapshot
  phase
```

Each edge and thesis claim carries one or more `evidenceIds`. Every timestamp includes its source and whether the event is live, historical, synthetic, or a fixture replay. A finding notification has a stable ID, agent ID, material event type, observation time, evidence IDs, affected record IDs, data-mode label, summary, and read state.

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

- Render one WebGL canvas per active screen.
- Cap device pixel ratio around 1.5.
- Pause rendering when the tab is hidden.
- Avoid real-time shadows if a baked or contact shadow works.
- Respect `prefers-reduced-motion` and render a static sphere state.
- Test the deployed build on the presentation laptop before adding postprocessing.

## Saloon 3D scene

Source: [single-table 3D Saloon decision](../raw-sources/saloon-single-table-3d-decision-2026-08-29.md)

The first Saloon uses one React Three Fiber canvas with one meeting table and six agent orbs. Keep every orb in the same scene so the application pays for one renderer and one animation loop.

The accepted warm-scene rebuild uses one authored clay-style static set. The optimized local `saloon-shell.glb` contains only an open creamy floor, a deep rounded dark-cream table with a broad floor-reaching center base, and seat plinths; there are no walls or room props. Keep the custom agent orbs, hit areas, selected-only float, camera owner, and DOM details in React code.

Suggested ownership:

```text
apps/web/
  features/saloon/
    saloon-scene.tsx          # Canvas, camera, warm shadow key, open-floor extension
    saloon-shell.tsx          # useGLTF/EXR loaders, UV validation, clay materials
    agent-orb.tsx             # naturally lit orb with eased selection and hover motion
  public/
    models/saloon/
      saloon-shell.glb
      provenance.md
    textures/saloon/
      saloon-lightmap.exr
    environments/saloon/
      warm_restaurant_night_1k.hdr
```

The exact public asset path may follow the existing Next.js asset convention, but all runtime files must remain inside the repository and load without network access. Record source URL, retrieval date, author when provided, license, and local filename in the provenance note.

Use `useGLTF` for the shell and preload it after the Saloon route becomes likely to open. If the selected source asset needs cleanup, optimize it before committing. Prefer one merged static shell, a few shared materials, no photoreal texture set, and no unnecessary animation tracks. Target a device-pixel-ratio cap of 1.5. After approval, remove invisible geometry and compress the model without changing the accepted camera compositions.

Accepted lighting pipeline:

- `pnpm --filter web build:saloon-shell` first writes geometry under ignored `.saloon-build/`, then runs Blender 5.2.1 LTS in factory-clean background mode;
- the Blender script preserves `Floor`, `Sand`, `Table`, and `Plinth`, creates consecutive `UVMap` and `Lightmap` layers, packs the second layer globally without overlap, and exports them as `TEXCOORD_0` and `TEXCOORD_1`;
- Cycles uses 512 samples, four diffuse bounces, one 3,400 K overhead area light at `(-2.8, 10.0, 1.0)`, a 6 m size, 800 W energy, and low warm World illumination at strength 0.22;
- Diffuse Direct and Indirect are enabled while Color is disabled, so the 2,048 px RGB half-float EXR stores illumination rather than baking the clay albedo twice;
- `SaloonShell` loads the EXR with `flipY = false`, `channel = 1`, and `LinearSRGBColorSpace`, rejects a mesh without `uv` and `uv1`, and assigns the cached lightmap to the table and plinth materials at intensity 0.35. The open floor responds only to runtime light, avoiding a baked-light boundary;
- one warm overhead runtime directional key casts VSM-filtered shadows from every orb and static mesh. A restrained warm hemisphere supplies bounce; there is no progressive convergence;
- the retained local HDR is not loaded, orb materials have no emissive floor or environment contribution, and the fake radial shadow cards are removed;
- only the selected orb floats. Selected motion and pointer scale use frame-rate-independent damping; unselected orbs do not bob, lift, or spin;
- the final GLB is 356,104 bytes and the final EXR is 9,272,735 bytes. Both load from the application origin;
- the table carries no WebGL evidence graph, and the default right panel contains only the roster and each agent's work rather than a timeline or evidence dashboard;
- the overview framing prioritizes the table and six agents on an open floor;
- orb labels, state rings, the top scene header, timeline controls, and the bottom canvas instruction are removed. Fixture playback remains automatic, and identity and status remain available in the DOM roster and selected-agent panel.

The browser result was compared in hardware-accelerated Chrome at 1,440 x 900 across the idle table, active table, and all six interview views. The presentation-laptop DPR 1.5 performance check remains open until it runs on that machine.

Material rules:

- unsaturated creamy floor: `roughness` 0.95 to 1 and `metalness` 0;
- dark cream/taupe table and seats: `roughness` 0.82 to 0.95 and `metalness` 0;
- agent orbs: `roughness` 0.55 to 0.72, `metalness` 0, and low environment intensity;
- use flat colors, subtle ambient occlusion, or low-frequency procedural variation only;
- do not use visible wood grain, fabric weave, stone veining, or photoreal normal maps;
- let rounded bevels, silhouette, ambient occlusion, and soft light describe the geometry;
- dispose or reuse generated GPU resources and do not create materials inside the render loop.

Use Triplex only while authoring. Expose a small set of source-backed controls for the table camera, interview camera offset, broad-key position, radius and intensity, fill level, shadow opacity and blur, and the main material roughness values. Save accepted values to source and verify the ordinary Next.js development and production builds without Triplex running.

Use two explicit camera modes:

```text
table
interview(agentId)
```

The table mode uses a slightly elevated camera that keeps the gathering visible. Selecting an orb sets `interview(agentId)` and moves the camera to a frontal view of that orb. The right-side details remain DOM UI outside the canvas. Returning to `table` restores the overview camera.

Drive camera position, look target, selected orb emphasis, labels, and the details panel from the same selection state. Use Motion for the DOM panel and React Three Fiber interpolation or Drei camera helpers for the 3D transition. Do not let two animation systems own the same camera values.

Implementation rules:

- use instancing or shared geometry and materials for repeated orb meshes where it does not erase agent identity;
- use simple collision-free fixed seats around the table instead of physics;
- keep hit areas larger than the visible orb and provide a matching keyboard-accessible DOM roster;
- keep text, evidence, controls, and long-form details in DOM;
- cut or crossfade camera poses for reduced motion;
- provide a static table or roster fallback when WebGL initialization fails;
- preserve selected agent state outside the canvas so routing, replay, and tests remain deterministic.

### New findings delivery

The bottom-right bell is DOM UI over the Saloon scene. The client event store derives its unread count from typed finding records. Selecting a finding sets the selected agent and affected record before opening the interview panel.

A search attempt does not create a finding. The server emits a finding only after validation and deduplication produce a new evidence-linked record or a material change to a relationship, claim, risk flag, or proposed order. Use stable finding and evidence IDs so retries do not duplicate notifications.

Keep material-event delivery behind a server boundary. The browser must not hold Cala, Alpaca, search-provider, or model credentials. The transport can be bounded polling or server-sent events; choose it during implementation based on the agent pipeline. Both live and fixture delivery must feed the same validated finding schema.

The hackathon fallback replays a short deterministic finding sequence with preserved source and data-mode labels. Continuous search can start another analysis cycle, but it cannot bypass risk checks or submit an order.

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
| User clay-style Saloon reference | Cutaway game diorama, rounded forms, matte color blocks, broad warm light, soft shadows | Photoreal textures, realistic decorative detail, glossy room materials |
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
- Alpaca stays in `apps/web/lib/server/alpaca` and exposes paper-only normalized data and approved-order methods.
- UI code imports shared types from `packages/core` and never infers agent or risk state by parsing prose.
- The risk engine consumes plain data from `packages/core` and returns plain results.
- A contract change updates its schema, fixture, parser, and consuming test in the same pull request.

## Build order

1. Scaffold the pnpm workspace, initialize shadcn with `base-nova`, inspect each registry component, and define validated shared contracts plus one fixture.
2. Build the four-scene onboarding flow as its own Marc-owned feature.
3. Build the single-table clay Saloon and dashboard shells, then map their presentational fixtures to reviewed shared contracts.
4. Implement typed `AnalysisOrchestrator`, `InvestmentCommitteeState`, isolated agent outputs, sourced evidence, material events, and explicit phase transitions.
5. Make the sphere respond to idle, tracing, and complete.
6. Render one fixed relationship graph from a fixture and animate the active path.
7. Implement deterministic portfolio metrics, Risk Officer hard blocks, and human approval gate.
8. Connect the Saloon trace, recommendation comparison, approval control, and decision receipt to typed records.
9. Add server-side Cala and Alpaca Paper adapter behind fixture fallbacks.
10. Add Shader Gradient, the active-agent chart, and final polish only after the full three-minute sequence works.

## Cut list if time runs short

Cut autonomous loops, workflow-framework integration, postprocessing, secondary room props, the full sphere state set, the live orb, the active-agent chart, then interactive graph dragging. Keep the rounded dark-cream table, open creamy floor, one broad warm shadow-casting light, six selectable committee seats, a static price chart if needed, and the non-WebGL Saloon fallback. Never cut source inspection, deterministic risk rejection, fixture fallback, Bear/Critic challenge, human approval, or the decision receipt.
