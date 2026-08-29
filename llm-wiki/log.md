# Wiki log

## [2026-08-28] bootstrap | Finance and Cala direction

Created the raw-source layer, wiki contract, index, overview, event brief, Cala finance page, idea comparison, leading concept, and open-question tracker.

Recorded the team's stated direction as finance with Cala. Seeded six concepts and selected Counterparty Brief as the provisional leader because Cala's claimed registry, ownership, sanctions, litigation, rating, filing, and provenance data map directly to the workflow. Set Earnings Gap as the fallback if live Cala tests show weak KYB coverage.

No API behavior, official judging criteria, or team capabilities have been confirmed yet.

## [2026-08-28] research | Winner patterns and fusion direction

Captured official winner pages from OpenAI Build Week, Anthropic's Built with Opus 4.6 hackathon, Google's Gemini Live Agent Challenge, and the Gemini API Developer Competition. Added reference-product captures for Yuka, Shopify, Google Lens, and CARFAX.

The winner research shifted the leading concept from a form-first counterparty brief to Company Lens. The new demo scans a synthetic invoice, resolves the company through Cala, reveals one sourced ownership or risk relationship, adds the entity to a Shopify-like comparison catalog, and exports a review memo. Counterparty Brief remains the underlying workflow. Earnings X-Ray remains the fallback if private-company coverage fails.

## [2026-08-28] idea | Agent-controlled paper hedge fund

Captured the user's agent-controlled hedge-fund idea and visual reference. Added Agent Fund as a high-spectacle alternative to Company Lens.

Agent Fund uses Cala relationships to connect an event to companies and current paper positions. An agent forms competing theses, deterministic rules enforce the mandate, and the interface animates the relationship graph and simulated rebalance through a stateful sphere. The hackathon boundary is paper trading only. The concept proceeds only if Cala can return one useful, source-linked event-to-company relationship.

## [2026-08-28] decision | Agent Fund selected and technical references added

Recorded Agent Fund as the selected concept. Added a technical reference pack with the recommended Next.js and React stack, Motion, React Three Fiber, Drei, React Flow, ELK.js, Zustand, Zod, TanStack Query, Recharts, and Lucide.

The pack defines the three-panel component structure, server-side Cala boundary, normalized evidence contract, seven fund phases, sphere and graph implementation rules, initial design tokens, performance limits, package command, file layout, build order, and cut list. Official docs and observed npm versions were captured in the raw-source layer.

## [2026-08-28] design | shadcn interface and Saloon locked

Recorded shadcn/ui as the component system and pnpm as the package manager. Added an interface plan for cinematic onboarding, a three-column agent Saloon, and a modern paper-trading dashboard.

Selected `@23rd/shader-gradient`, optional `@23rd/live-orb`, `@7ovr/activity-1`, `@7ovr/chat-4`, `@abui/animated-chart`, and `@abui/text-gradient`. Registry source was inspected before installation. The plan uses the Base UI preset because the 7ovr blocks declare Base UI dependencies, maps the animated chart to agent work rather than prices, keeps Recharts for time series, and requires dry-run review because the chart metadata references Motion 12.

## [2026-08-28] handoff | Wiki cleaned for a fresh implementation thread

Recorded the final user decision in the raw layer. Rewrote the repository contract, index, overview, and open questions around Agent Fund only. Removed the superseded fusion backlog, finance idea backlog, Company Lens concept, and Counterparty Brief concept from the curated wiki.

The remaining wiki now provides one reading path: final state, Agent Fund, interface plan, technical reference pack, Cala assumptions, event constraints, winner research, blockers, and history. No application scaffold or registry component has been installed yet.

## [2026-08-29] decision | Product named Sonar AI and the repository became a monorepo

The user named the product Sonar AI, closing the final-fund-name open question. "Agent Fund" remains only as the historical codename in earlier captures and log entries. Renamed the concept page to `concepts/sonar-ai.md`, updated the index, overview, repository contract, and concept page, and captured the decision in `raw-sources/naming-monorepo-decision-2026-08-29.md`.

Initialized the private GitHub repository `marcvendrellf/sonar-ai` and committed the wiki, raw sources, and repository contract. Recorded the repository as a pnpm workspace monorepo (`apps/web`, `packages/core`, `packages/risk-engine`) in the overview, repository contract, and the technical reference pack's repository layout and build order. No application scaffold or registry component has been installed yet.

## [2026-08-29] planning | Team lanes, onboarding epic, and branch proposal

Recorded Marc as the frontend owner and Josep and Axel as the shared agent and data lane. Added a team workflow page so coding agents can see their evidence, contract, paper-trading, motion, and integration concerns before opening a branch.

Made onboarding a standalone epic. Proposed one issue or coherent feature per branch, cross-lane review for shared contract changes, and a feature-oriented `apps/web` layout. The branch naming policy and individual split between Josep and Axel remain open.

## [2026-08-29] decision | Sonar reconfirmed with paper trading

The user reconfirmed the Sonar AI hedge-fund direction. The maintained wiki now gives new clones one active product path.

Added paper trading through Alpaca's paper environment. Paper money remains mandatory. Sonar cannot submit real-money orders, deposits, withdrawals, or brokerage-account instructions. Recorded the event's broad message: `Build whatever you want, you might just leave with the MVP from your next startup and some cool prizes!`

## [2026-08-29] architecture | MVP agent structure provisionalized

The user asked for the intended agent structure to drive wiki and implementation decisions while respecting hackathon MVP limits. No diagram, role list, or topology details were included in the message, so the exact structure remains open.

Until that structure is supplied, the docs use the existing Scout, Cartographer, Analyst, Skeptic, Marshal, and Trader cast as six typed stages inside one server-side `AnalysisOrchestrator`. Analyst and Skeptic use bounded model calls over one evidence pack; Cartographer, Marshal, and Trader remain adapter-backed or deterministic. Autonomous loops, agent-to-agent filler chat, queues, and workflow frameworks are cut from MVP scope.

## [2026-08-29] architecture | Supplied committee structure adopted

The user supplied a concrete hackathon architecture recommendation: one code-owned orchestrator, five decision agents (Portfolio Manager, Fundamental Analyst, Market Context Analyst, Risk Officer, and Bear/Critic), human approval, then a Communications/Report Writer. The prior Scout/Cartographer/Marshal/Trader stage model is superseded.

Sonar adapts this structure to its existing boundaries. Cala relationship tracing is a sourced research capability, Risk Officer owns deterministic hard blocks, Trader is internal paper-ledger receipt code, and Alpaca is paper-only. MVP cuts swarms, autonomous loops, distributed services, price forecasting, reinforcement learning, multiple MCP servers, and automatic execution.

## [2026-08-29] integration | Alpaca Paper slice

Verified official Alpaca documentation: Paper Only accounts are globally available, paper credentials and endpoint are separate from live, and the API exposes account, positions, and order endpoints. Alpaca is now active provider in project contract.

Added Zod-validated Alpaca Paper account/positions contracts, a server-only client fixed to `https://paper-api.alpaca.markets/v2`, a paper portfolio route, paper-order method, and sanitized fixture. Live paper response capture and U.S.-listed candidate selection remain open.

## [2026-08-29] demo | Cash-only starting state

The user changed the demo setup: start with €1,000 cash and ask Sonar AI to allocate it, instead of showing an already-invested portfolio with €1,000 spare cash. The MVP now uses zero invested exposure, a separate five-asset candidate universe, current-versus-proposed comparison, human approval, and internal paper actions.

## [2026-08-29] implementation | App shell and first dashboard built

Scaffolded the pnpm workspace with a Next.js app in `apps/web` and reserved `packages/core` and `packages/risk-engine`. Initialized shadcn with the Base UI `base-nova` preset, previewed the registry changes, and installed the application-shell block, the selected third-party components, and the required shadcn primitives.

Adapted the shell to the compact navigation required by the interface plan. Built a fixture-driven dashboard with paper-fund metrics, a Recharts NAV series, positions, a sourced relationship path, agent activity, the categorical agent-work chart, risk results, and a decision-receipt Sheet. The registry chart now uses stable agent IDs and respects reduced motion. Typecheck, lint, and the production build pass.

## [2026-08-29] correction | Application-shell sidebar restored

Restored the collapsible sidebar, inset header, sidebar rail, and responsive trigger from `@shadcnblocks/application-shell1` after the first adaptation replaced the block with top navigation. Fixed the shadcn font token so Geist renders through `--font-geist-sans`.

## [2026-08-29] implementation | Shared contracts, risk engine, and agent-backend scaffold

Built `@sonar-ai/core` (the cross-lane Zod contract, stable-ID helpers, evidence-integrity gate, and one golden `InvestmentCommitteeState` fixture) and `@sonar-ai/risk-engine` (the pure deterministic Risk Officer: metrics, stress, compare, and pass/resize/reject rules with reproducible numbers). Both are React/Next-free and fully unit-tested; a purity guard forbids IO imports in the risk engine. Turnover is defined sell-side, so the cash-only baseline deploys without a false breach.

Addressed a contract review: stored the revision-0 proposal so every `riskChecks[].actionId` resolves, added action- and receipt-scoped integrity gates, surfaced all four mandate limits in `RiskMetrics`, and tightened the turnover doc.

Wired both packages plus Zod into `apps/web` (workspace deps + `transpilePackages`) and scaffolded the agent backend under `apps/web/lib/server`: validated server `env.ts`, the `AgentRunner`/`AgentDef` seam with a deterministic `StubAgentRunner`, and the closed tool-name set. Documented the whole structure, conventions, and per-folder responsibilities in [`apps/web/lib/server/README.md`](../apps/web/lib/server/README.md) so both agent-lane owners can claim files without collision. Orchestrator, agents, tools, and adapters remain to be implemented (Phases 3–6).

## [2026-08-29] correction | Alpaca Paper replaces prior broker assumption

The active broker direction is Alpaca Trading API with a Paper Only account. Alpaca account and position reads use a server-only client with a fixed Paper endpoint; paper order submission remains behind evidence, deterministic risk, and explicit human approval gates. Prior broker references remain historical captures only and are not active implementation guidance.

## [2026-08-29] implementation | Deterministic committee orchestrator

Implemented the Phase 3 server-side committee flow under `apps/web/lib/server/analysis`: isolated contexts, typed definitions for Fundamental Analyst, Market Context Analyst, Portfolio Manager, Risk Officer, Bear/Critic, and post-decision Report Writer, plus evidence, deterministic-risk, and human-approval gates. Added deterministic internal paper-ledger application and sequential fixture replay with fixed timestamps. The flow pauses at `awaiting_approval`, rejects mandate hard blocks, and cannot mutate paper state before approval. Extended the stub runner with deterministic per-stage output sequences and tightened evidence integrity to include revision-0 proposal claims. Orchestration tests cover pause, approval, replay, and hard-block behavior.

## [2026-08-29] implementation | OpenAI structured-output runner

Added the official `openai` TypeScript SDK behind the existing `AgentRunner` seam. Live stages use Responses API `responses.parse()` with each agent's Zod schema, disabled response storage, bounded output tokens and timeout, zero SDK-level retries, and one exact code-owned retry budget. The model receives no tools and cannot select stages or gates. `SONAR_OFFLINE=true` continues to force deterministic fixture execution. Offline unit tests cover request shape, schema parsing, retry count, and sanitized failures; no live API request was made.

## [2026-08-29] implementation | Cala research tools and bounded graph traversal

Implemented Cala's fixed server-side REST boundary with Zod validation, sanitized failures, entity resolution, schema introspection, selective profile and numerical-observation retrieval, structured knowledge query, sourced search, and breadth-first relationship traversal capped at depth 3 and 50 nodes. Added deterministic synthetic fixture provider with a supplier-to-company and company-to-policy-event path. Raw Cala MCP remains outside model context because its dynamic schema conflicts with strict function tools.

Extended OpenAI runner with code-owned per-stage tool allowlists, strict argument parsing, output validation, sequential function calls, an eight-call default cap, one total output-token budget, and a 60,000-character tool-result cap. Fundamental Analyst receives company/entity research tools; Market Context receives entity/query/search/traversal tools. Source evidence and normalized traversal graph artifacts merge into committee state before gates. Search/query remain discovery-only, unsourced edges are omitted, unknown fixture entities return no false match, and empty traversals remain valid. Portfolio Manager, Risk Officer, and order path stay isolated from raw research tools. Corrected implementation against official wire examples: numerical retrieval groups introspected metric IDs by type, relationship provenance is read from nested properties, metric discovery is paged, and traversal does not expand beyond requested depth. Workspace typecheck, lint, 84 tests, and production build pass. No live Cala request was made.
## [2026-08-29] correction | Risk preferences drive agent discovery

The MVP input is now risk preferences only. Market Context Analyst runs first, uses Cala research and relationship traversal to shortlist symbols from the system-supplied Alpaca tradable universe, Fundamental Analyst evaluates that shortlist, and Portfolio Manager allocates. Removed user-selected company IDs from orchestration and recording contracts. Approved live-mode actions now route through injected Alpaca Paper order submission; offline mode retains deterministic internal ledger fallback. Decision source: [risk-preferences-only MVP direction](../raw-sources/risk-preferences-only-mvp-2026-08-29.md).

Added sanitized Alpaca Paper fixtures for USD account/positions, tradable asset discovery, accepted orders, and non-tradable rejection. Added provider tests and client asset-list method. Capture: [Alpaca Paper fixture capture](../raw-sources/alpaca-paper-fixtures-2026-08-29.md).

Added Alpaca latest-quote and daily-history schemas/client methods, fixture provider support, closed-registry read tools, and agent allowlists. Research agents can now verify tradability, spread, price history, drawdown, and execution context without order access.

Added MVP analysis API routes: `POST /api/analysis/run` accepts mandate only, `GET /api/analysis/run/:runId` retrieves state, and `POST /api/analysis/run/:runId` applies approval/rejection. Run state initially used an in-memory store; subsequent entry records its file-backed replacement. Company-selection fields are rejected.

Connected dashboard workflow controls to run/fetch/approval routes with fixture fallback. Added live safety validation requiring explicit USD mandate before a run can reach Alpaca Paper execution.

Replaced in-memory-only run storage with schema-validated, atomic file persistence at `data/analysis-runs.json` (override with `SONAR_RUN_STORE_PATH`). The local paper-run store is gitignored and contains no credentials.

Dashboard account metrics and positions now hydrate from `/api/alpaca/portfolio`, while the fixture path remains the fallback. Narrative/static NAV panels remain intentionally demo presentation data pending historical portfolio endpoint support.

Added `/api/analysis/history`; NAV chart now consumes persisted run NAV points when available and retains deterministic fixture series before the first run.

Upgraded research prompts with shared professional investment-committee protocol, private deliberate reasoning, explicit evidence/fact/inference separation, falsification, scenarios, catalysts, valuation, liquidity, correlation, and confidence checks. PM and Bear/Critic now receive fuller research summaries instead of only quality/valuation snippets. Hidden chain-of-thought is not persisted; outputs remain structured and auditable.
## [2026-08-29] decision | Saloon changed to one 3D meeting table

Replaced the planned three-column Saloon with a minimal 3D room built around one physical meeting table. Six agent orbs use the existing faceless sphere language and share one React Three Fiber canvas.

The default camera shows the full gathering. Selecting an orb moves the camera into a frontal interview composition and opens that agent's task, evidence, contradictions, risk results, and blockers in a right-side DOM panel. The game quality comes from spatial composition and camera movement, not fake chat, character statistics, or a dense HUD. This entry records the design only; implementation remains part of the Saloon frontend epic.

## [2026-08-29] decision | New findings bell added to the Saloon

Added one notification bell at the bottom-right of the agent scene. It opens a newest-first list of source-backed findings produced as agents continue searching. Selecting a finding opens the relevant agent interview and affected evidence, relationship, claim, or risk record.

Search attempts do not create notifications. The event store records only material changes with stable finding IDs, source links, observation times, and live, historical, synthetic, or fixture labels. The hackathon demo may replay a bounded fixture stream instead of running an unbounded background search loop.

## [2026-08-29] design | Warm asset-first Saloon rebuild planned

The first procedural Saloon lab proved the table view, selectable custom orbs, interview camera, right-side details, and fixture findings flow, but its smooth white primitives and strong studio environment were rejected because the room reads as cold and glossy.

Recorded an asset-first rebuild. Keep the existing React Three Fiber behavior and replace only the room, table, seats, materials, and light treatment with one locally stored textured shell. Triplex is the development-only visual editor, Poly Haven is the preferred CC0 asset source, and Drei remains the runtime. threecn is the closest shadcn-style 3D registry but does not provide the required warm interior. Spline is limited to reference work because its documented GLTF/GLB export drops lighting, environment, interaction, and several material features.

The rebuild reserves polished highlights and cyan emission for agent state. The room uses matte plaster, dark wood, textile, stone, one warm architectural key, a weak fill, a low-intensity local environment, recorded asset provenance, offline loading, and the existing accessibility and fallback behavior.

## [2026-08-29] implementation | Minimal onboarding introduction preserved

Restored the selected onboarding opening from `feat/onboarding-flow`: one dark custom eye orb enters over a warm cream, coral, peach, and lavender shader, then Motion reveals the inline `Hi, [name]!` greeting. The scene keeps all field chrome, branding, instructions, actions, footer copy, and secondary content hidden. Enter validates and stores the normalized name. The replacement multi-panel onboarding was removed; the opening paper NAV question remains the next scene to build without replacing this minimal introduction.

## [2026-08-29] decision | Saloon visual target changed to a clay game diorama

The user selected a supplied cutaway clay-style room as the visual target and rejected photoreal texture experiments. The Saloon should look like a compact game diorama with rounded forms, warm sand architecture, a dark brown table, simple seat plinths, matte color blocks, and only low-frequency surface variation.

The light target is now broad and very soft. Remove the hard point-light highlights and strong studio reflections. Use one broad warm key, weak fill, low environment contribution, and wide low-opacity accumulated or contact shadows. Keep the orbs slightly smoother than the room without making them glossy, glassy, or metallic.

## [2026-08-29] design | Onboarding palette aligned to Sonar

Kept the selected minimal custom eye-orb opening and replaced the warm orange palette with the animated Shader Gradient using only Sonar's light colors: `#D9E8EF`, `#8FBED2`, and `#3F87A8`. Navy, deep-water, and near-black tones are excluded so the background stays clear, pale, and smooth. The orb uses its light variant, while the greeting and inline name input use the app's editorial heading font instead of Inter. Onboarding is isolated to `/onboarding`; `/` remains the dashboard. After the name acknowledgement, the flow now asks for a €250,000–€2,500,000 paper budget and one of three explicit deterministic mandate profiles: Tight, Core, or Wide sandbox. The selections persist locally for later contract integration, and all transitions respect reduced motion.

## [2026-08-29] implementation | Clay-diorama Saloon room shipped

Replaced the procedural white Saloon room with the cutaway clay diorama. The
room is one local `saloon-shell.glb` generated by
`apps/web/scripts/build-saloon-shell.mjs`: a base slab, a back wall, side walls
that step down towards the open front, a low cutaway rim, one niche, one slot, a
scalloped dark table, and six seat plinths. Every part is a rounded box or an
eased lathe, merged by material into four meshes, 12,760 triangles, 217 kB. It
carries no textures and no UVs; four flat matte materials are bound by material
name at runtime. Lighting is one broad warm key, a weak hemisphere fill, one
subdued local environment, and a shadow accumulated once over 60 frames.

Interaction is unchanged: one canvas, six selectable orbs, table and interview
camera modes, empty-space and `Escape` return, DOM labels, right-side details,
fixture playback, reduced-motion cut, and the WebGL roster fallback. A static
loading and model-failure state was added; the model was removed on disk to
confirm the DOM controls and orb selection survive it. `pnpm --filter web
typecheck`, `lint`, and `build` pass.

Five details differ from the written plan and are recorded here rather than
re-planned:

- The shell is original geometry. No source model or photoreal material pack was
  used, and the only downloaded runtime asset is one CC0 Poly Haven HDRI at
  `environmentIntensity` 0.18. An earlier photoreal texture pass on this branch
  was built and then withdrawn when the clay decision landed; its assets are
  recorded in the [asset provenance](../raw-sources/saloon-asset-provenance-2026-08-29.md).
- The default camera is straight-on and elevated about 32 degrees rather than
  rotated into a three-quarter view, because the supplied reference is framed
  that way and a rotated view unbalances the six DOM labels.
- The interview camera rises about 2.8 units above the orb instead of standing
  level with it. At the framing distance the pose lands outside the room, and
  the lift is what keeps the sight line clear of the wall it looks over.
- Selecting an agent now sets a floor under its orb emission. Warm agent colours
  were sinking into the warm clay when idle, and the interface plan reserves the
  strongest contrast for the selected agent.
- The evidence path is a seven-node link inlay in the table top, matching the
  reference, rather than a ring. Geometry is fixed and revealed by visibility,
  so tracing the path allocates nothing.

Triplex was not used. The values were tuned directly in source against the
browser, and the exposed-control step remains available if the room is retuned.

## [2026-08-29] integration | UI baseline consolidated for parallel polish

Consolidated the onboarding, dashboard, Saloon, shared shell, local 3D assets, and maintained wiki into one checkpoint. The public route order is now `/` and `/onboarding` for onboarding, `/dashboard` for the dashboard, and `/saloon` for the Saloon. The onboarding completion enters the Saloon. This corrects the earlier log entry that described `/` as the dashboard.

Removed an unused registry demo, its unused alert primitive, the temporary registry entry that installed it, and a generated validation transcript. Kept each product surface in its feature folder and recorded shared-file boundaries.

The checkpoint also integrates the newer €1,000 cash-only, Alpaca Paper, and investment-committee direction already on `main`. The current onboarding budget range and Scout/Cartographer UI fixtures predate that decision and remain explicit polish-branch migration work rather than reviewed contracts.

The next UI pass splits from this baseline into `feat/onboarding-polish`, `feat/dashboard-polish`, and `feat/saloon-polish`. Each branch has one writer; changes to global CSS, layout, application shell, dependencies, shared contracts, fixtures, or wiki pages require coordination.

## [2026-08-29] implementation | Onboarding choices and glow refined

Replaced the legacy variable budget step with the reviewed €1,000 all-cash paper baseline. The three mandate cards now lead with their four percentage limits and omit the longer descriptions. Added a research-class step for U.S. stocks, ETFs, and select crypto; all three start selected, at least one remains selected, and the choice is stored locally for the current presentational flow.

Integrated a typed React Bits `BorderGlow` component around the submitted-name acknowledgement, onboarding selection cards, and primary actions. After submission, the greeting becomes `Hello, [name]!` inside an intro-sweep glow before the baseline appears. Onboarding question headings now reveal word by word with the existing blur-and-rise motion language and retain a static reduced-motion path. The locally stored mandate and research classes still need the reviewed shared fixture contract. `pnpm --filter web typecheck`, `lint`, and `build` pass, and the complete onboarding flow was exercised in the browser, including selection toggling and local-storage output.

## [2026-08-29] implementation | Dashboard and demo access polished

Restyled the fixture dashboard with outlined shadcn cards, dark and light themes, three concise top metrics, `slot-text` number animation, and a gradient-area NAV chart. Replaced the abstract logo with the orb's two thin eye bars and moved the demo-user control to the bottom of the sidebar.

Added `/login` and `/signup` from the reviewed shadcn blocks, adapted both to one-click browser-local demo entry, and added sidebar sign-out. The login panel now shows a smaller white orb over a black, finance-themed React Bits `BorderGlow` background at reduced opacity. This remains demo session state rather than production authentication. `pnpm --filter web typecheck`, `lint`, and `build` pass.
