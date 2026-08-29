# Technical reference pack

Sources:

- [React technical references](../raw-sources/react-technical-references-2026-08-28.md)
- [User-selected shadcn components](../raw-sources/user-selected-ui-components-2026-08-28.md)

Detailed composition: [interface plan](interface-plan.md)

## Recommended stack

Use one application, Motion for DOM transitions, and one primary 3D sphere. Isolate the selected WebGL shader background to onboarding and waiting states:

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
- **TanStack Query** for Cala requests, retries, caching, and the fixture fallback.
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

The MVP has seven named phases but one linear demo. A small Zustand store with a typed `FundPhase` is enough. Add XState only if retries, branching, cancellation, and parallel operations become hard to reason about.

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
    CalaClient
    ResponseNormalizer
    EvidenceValidator
    HypothesisGenerator
    RiskEngine
    FixtureFallback
```

The browser never receives the Cala credential. The model never receives uncited graph prose as fact. The risk engine remains a pure deterministic module.

## Shared data contract

Define one normalized response before building UI:

```text
Analysis
  event
  nodes[]
  edges[]
  evidence[]
  bullThesis
  bearThesis
  proposedOrders[]
  riskChecks[]
  acceptedOrders[]
  phase
```

Each edge and thesis claim carries one or more `evidenceIds`. Every timestamp includes its source and whether the event is live, historical, or synthetic.

## Fund state model

Use this explicit union:

```text
idle
observing
tracing
challenging
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

## Suggested file layout

```text
app/
  page.tsx
  onboarding/page.tsx
  saloon/page.tsx
  dashboard/page.tsx
  decisions/[id]/page.tsx
  api/analyze-event/route.ts
components/
  onboarding/OnboardingFlow.tsx
  saloon/AgentRoster.tsx
  saloon/AgentChat.tsx
  saloon/EvidencePanel.tsx
  dashboard/PortfolioSummary.tsx
  dashboard/PriceChart.tsx
  dashboard/RecentTrades.tsx
  dashboard/AgentActivityChart.tsx
  orb/FundOrbCanvas.tsx
  orb/FundOrb.tsx
  graph/RelationshipGraph.tsx
  graph/nodes/
  receipt/DecisionReceipt.tsx
lib/
  cala/client.ts
  cala/normalize.ts
  evidence/schema.ts
  risk/engine.ts
  demo/fixtures.ts
  demo/store.ts
```

Keep the Cala adapter, normalized schema, risk engine, and fixtures independent from the React components.

## Build order

1. Scaffold the Base UI shadcn project and inspect every selected registry component with a dry run.
2. Build the static onboarding, Saloon, and dashboard shells.
3. Implement the typed demo store and phase controls.
4. Adapt Activity and Chat to typed agent events.
5. Make the sphere respond to three phases: idle, tracing, and complete.
6. Render one fixed relationship graph from a fixture and animate the active path.
7. Implement the pure risk engine and portfolio rebalance.
8. Connect the recent-trades table and decision receipt.
9. Add the server-side Cala adapter with the fixture fallback.
10. Add Shader Gradient, the active-agent chart, and final polish after the full three-minute sequence works.

## Cut list if time runs short

Cut postprocessing first, then the full seven-state sphere, then the live orb, then the active-agent chart, then interactive graph dragging. Keep a static price chart if needed. Never cut source inspection, the deterministic risk rejection, the fixture fallback, the Saloon disagreement, or the decision receipt.
