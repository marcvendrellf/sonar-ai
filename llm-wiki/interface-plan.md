# Interface plan

Sources:

- [User-selected UI components](../raw-sources/user-selected-ui-components-2026-08-28.md)
- [Alpaca Paper Trading verification](../raw-sources/alpaca-paper-trading-verification-2026-08-29.md)
- [Alpaca paper-trading verification](../raw-sources/alpaca-paper-trading-verification-2026-08-29.md)
- [Saloon 3D authoring references](../raw-sources/saloon-3d-authoring-references-2026-08-29.md)
- [Saloon clay-style visual decision](../raw-sources/saloon-clay-style-decision-2026-08-29.md)

## Product structure

The selected application has three primary spaces:

1. **Onboarding** introduces the fund, its mandate, and its agents.
2. **The Saloon** shows agents talking and working through the current event.
3. **Dashboard** shows the paper portfolio, recent trades, prices, decisions, and agent activity.

The Saloon is a modern operations room. Do not turn it into a cowboy theme. The name adds character, while the interface stays restrained and futuristic.

## Component decision

Use shadcn/ui with the Base UI preset. The selected `@7ovr` blocks declare `@base-ui/react`, so `base-nova` is the least surprising starting point.

Use pnpm for every command. Run `shadcn info` after the app exists, then preview all registry additions with `--dry-run` before installing them.

```bash
pnpm dlx shadcn@latest info

pnpm dlx shadcn@latest add \
  @23rd/shader-gradient \
  @23rd/live-orb \
  @7ovr/activity-1 \
  @7ovr/chat-4 \
  @abui/animated-chart \
  @abui/text-gradient \
  --dry-run
```

After reviewing the dry run:

```bash
pnpm dlx shadcn@latest add \
  @23rd/shader-gradient \
  @23rd/live-orb \
  @7ovr/activity-1 \
  @7ovr/chat-4 \
  @abui/animated-chart \
  @abui/text-gradient

pnpm dlx shadcn@latest add \
  button card badge avatar table tabs tooltip sheet dialog \
  separator skeleton progress input scroll-area sonner
```

Do not use `--overwrite` without reviewing a diff.

## 1. Onboarding

Onboarding is a dedicated delivery epic owned by Marc. It must be estimated, implemented, and reviewed separately from the dashboard. See the [team workflow](team-workflow.md) for acceptance criteria and branch boundaries.

### Goal

Explain the fund in less than one minute, establish the agent cast, and let the user launch a paper mandate.

### Scene 1: Meet the fund

Use `@23rd/shader-gradient` behind a nearly empty full-screen composition with only the light Sonar blues: `#D9E8EF`, `#8FBED2`, and `#3F87A8`. Keep the wash pale, clear, soft, and slow; do not bring the primary navy, deep-water, or near-black colors into this opening background. Use the app's editorial heading font for the greeting and name input rather than Inter.

One light `@23rd/live-orb` instance rises from below the viewport to the center over 1,800 milliseconds. It stays still during the entrance, then enables its pointer-following gaze after settling. Only then does Motion reveal `Hi,` character by character with a short blur-and-rise animation. The user types their name directly into the same `Hi, [name]!` line.

Do not show field chrome, an underline, branding, instructions, a continue action, a footer, or secondary copy in this scene. The orb and greeting are the only visible elements. Enter accepts and stores the normalized name. With reduced motion, place the orb in its final position immediately and show the complete inline greeting.

### Scene 2: Confirm the paper baseline

After the name acknowledgement, smoothly reduce the orb and confirm the reviewed MVP baseline: €1,000 cash and 0% invested exposure. Do not ask the user to choose the opening capital for the MVP. The existing €250,000 to €2,500,000 range is a presentational placeholder that `feat/onboarding-polish` must remove when it connects to the shared fixture contract.

### Scene 3: Choose the risk profile

Ask how much room the agents should have, then map the answer to explicit deterministic limits. Use mandate language rather than personalized-investment labels:

- `Tight mandate`: 20% maximum position, 35% maximum sector, 20% minimum cash, and 10% maximum turnover per event;
- `Core mandate`: 30% maximum position, 45% maximum sector, 10% minimum cash, and 20% maximum turnover per event;
- `Wide sandbox`: 40% maximum position, 60% maximum sector, 5% minimum cash, and 30% maximum turnover per event.

Recommend the Core mandate for the demo. Do not use consumer labels such as conservative, balanced, or aggressive. The model cannot override the selected limits.

### Scene 4: The fund wakes

Copy:

- Eyebrow: `An agentic paper fund`
- Headline: `It does not trade the headline.`
- Reveal: `It trades the relationships behind it.`
- Primary action: `Initialize the fund`

Use `@abui/text-gradient` for one short status such as `Establishing mandate...`. Do not apply it to the headline or body copy.

### Scene 5: Meet the agents

Introduce five decision agents and one post-decision writer. Roster status comes from typed orchestrator events, not simulated background workers:

| Agent | Responsibility | Output |
| --- | --- | --- |
| Portfolio Manager | Weighs research, portfolio, and risk; revises after critique | Allocation proposal |
| Fundamental Analyst | Reviews business, financial strength, valuation, and catalysts | Fundamental report |
| Market Context Analyst | Reviews news, sector, macro, competitors, and regulation | Context report |
| Risk Officer | Runs deterministic analytics and hard-blocks breaches | Risk report |
| Bear/Critic | Attacks recommendation and identifies failure scenarios | Counter-case |
| Report Writer | Formats approved decision after human review | Internal report |

Adapt `@7ovr/activity-1` into an agent roster. Each row shows name, role, status, and current task. Use local abstract avatars rather than stock-person photos.

### Scene 6: Enter the Saloon

Show committee online, mandate locked, and initial paper portfolio ready. The action is `Start portfolio review`.

### Motion acceptance

- Keep ordinary scene transitions between 180 and 350 milliseconds.
- Reserve 700 to 1,200 milliseconds for the main fund wake-up or relationship reveal.
- Drive coordinated changes from explicit onboarding or fund state. Do not stack unrelated timers.
- Preserve all copy and actions when `prefers-reduced-motion` is enabled.
- Provide a static CSS fallback if WebGL fails.
- Test the complete flow on the presentation laptop.
- Let the team replay onboarding without clearing application data.

## 2. The Saloon

Source: [single-table 3D Saloon decision](../raw-sources/saloon-single-table-3d-decision-2026-08-29.md)

### Purpose

The Saloon makes the staged investment-committee run legible through a minimal 3D meeting scene. It should feel like a small game because the user can inspect the room and choose an agent, not because the screen is covered in game statistics.

It answers:

- Who is at the table?
- Who is working, waiting, or blocked?
- What is the selected agent doing?
- What evidence or decision is attached to that work?
- What have the agents found since the user last checked?

### Default scene

Use one physical meeting table in a warm, restrained 3D room. The six agent orbs sit around the table. Keep the room sparse. The table, seating, light, and orb state carry the composition.

Render the table and all six orbs in one React Three Fiber canvas. Do not create one WebGL canvas per agent. Use the faceless sphere language already defined for the fund rather than humanoid characters or a literal Western saloon.

The default camera uses a slightly elevated view that keeps the full table and every agent visible. Each orb needs a readable identity label and a non-color state cue. A short phase label and latest material event may sit outside the canvas, but the first view should not become a dashboard or chat transcript.

### Warm material rebuild plan

The first procedural lab reads as a bright product-photography cyclorama. Its materials already use moderate or high roughness, so increasing roughness alone will not solve the problem. The cold result comes from a strong apartment environment, hard point-light highlights, smooth white geometry without a clear authored silhouette, and studio-style reflections.

The [user-supplied clay-style reference](../raw-sources/assets/saloon-clay-style-reference-2026-08-29.png) replaces photoreal interior materials as the target. Rebuild the room as a compact cutaway video-game diorama with rounded geometry, matte clay-like color blocks, broad soft light, and blurred low-contrast shadows. Keep the existing React Three Fiber canvas, custom agent orbs, selection state, table and interview camera modes, DOM labels, details panel, findings bell, fixture runtime, reduced-motion path, and keyboard fallback. Replace only the room shell, table, seats, and their lighting and material treatment.

#### Tool decision

- Use [Triplex](https://triplex.dev/) as a development-only visual workspace for placement, scale, camera framing, light position, and exposed material controls. Do not add it to the production runtime.
- Use locally stored, license-recorded [Poly Haven](https://polyhaven.com/) assets only for a subdued environment or a small supporting asset when needed. Do not let realistic texture maps define the room. Poly Haven states that its assets are CC0.
- Keep React Three Fiber and Drei as the only 3D runtime.
- Treat [threecn](https://threecn.dev/) as an optional source for isolated copy-paste effects. Its observed catalog does not contain a complete warm meeting-room interior, so it must not define the room architecture.
- Use Spline only for reference composition or a disposable prototype. Its documented GLTF/GLB export omits lighting, environment, fog, interaction, post-processing, and several material features.

#### Visual target

The Saloon should resemble a compact environment from a polished indie game, not a real interior, Western bar, luxury showroom, spaceship, or white studio.

- Frame the default view as a slightly elevated three-quarter diorama with a visible cutaway room boundary.
- Build the room from a few large rounded forms with generous bevels and clean silhouettes.
- Use warm sand clay for the architecture, a dark chocolate-brown table, and simple rounded seat plinths.
- Use flat or low-frequency tonal variation. Avoid visible wood grain, fabric weave, stone veins, photoreal normal maps, and decorative clutter.
- Use high-roughness, zero-metalness room materials. Keep the orbs only slightly smoother, never glass or chrome.
- Reserve cyan emission and the strongest contrast for the selected agent and active evidence path.
- Keep the background quiet enough that names, state labels, and the interview panel remain readable.

#### Implementation sequence

1. **Freeze behavior before replacing visuals.** Record the current table and interview views, orb selection, empty-space return, label behavior, reduced-motion cut, and WebGL fallback. The rebuild must preserve these behaviors.
2. **Choose and record the minimum source material.** Prefer original simple geometry. Store every runtime asset locally, add its original URL, retrieval date, and license to a provenance note, and reject assets with unclear redistribution rights. Do not add a photoreal material pack to solve this scene.
3. **Create one clay-style room shell.** Build or adapt one optimized `saloon-shell.glb` containing the cutaway architecture, rounded table, and simple seat plinths. Keep the six orbs and their hit areas in React code. Do not create a second canvas or a second animation loop.
4. **Integrate the shell.** Load the shell through Drei `useGLTF`, keep a single scene owner, and place it around the existing fixed seat and camera coordinate system. Add a static loading and failure state so the DOM controls never disappear.
5. **Author simple matte materials.** Use restrained colors, high roughness, zero metalness, and only subtle low-frequency variation or ambient occlusion. Let bevels and soft light describe the forms. Do not use transmission, mirror reflections, clearcoat, realistic wood or textile maps, or emissive room materials.
6. **Relight for a baked game look.** Use one very broad warm key, a weak hemispheric or neutral fill, little or no reflective environment contribution on the room, and broad blurred contact shadows. Keep the agent light local. Remove the current hard point lights and bright studio environment.
7. **Tune visually in Triplex.** Expose only the controls needed to compare camera framing, key-light spread and intensity, fill level, shadow opacity and blur, and the main material roughness values. Save accepted values back to source.
8. **Optimize after the look is approved.** Prefer simple geometry and flat materials, use no real-time mirror, cap device pixel ratio at 1.5, and keep the local shell small enough for the offline demo. Judge the complete authored scene on the presentation laptop before removing details that support its silhouette.
9. **Validate the complete Saloon.** Test the table and every interview pose, keyboard selection, `Escape`, narrow layout, reduced motion, fixture findings, WebGL failure, production build, and offline loading.

#### Rebuild acceptance

The rebuild is done when:

- the room reads as a warm, minimal clay-style game diorama before any agent becomes active;
- the cutaway shell, rounded table, seat plinths, and soft light match the supplied visual direction;
- no photographic texture, hard point-light highlight, or luxury-interior detail competes with the agents;
- the agent orbs remain the only intentionally smoother objects, without becoming glassy;
- all six agents remain visible and selectable in the table view;
- every interview pose preserves the right-panel composition;
- no runtime asset requires a CDN or a Spline scene request;
- asset provenance and licenses are recorded;
- reduced motion, keyboard access, fallback UI, and fixture mode still work;
- the production build stays smooth on the presentation laptop.

### Orb selection and interview view

Selecting an orb changes the camera to a frontal interview composition:

```text
┌────────────────────────────────────────────┬──────────────────────┐
│                                            │ Selected agent       │
│       frontal 3D view of selected orb      │ role and status      │
│                                            │ current task         │
│                                            │ evidence and blockers│
└────────────────────────────────────────────┴──────────────────────┘
```

- Keep the selected orb in the main 3D scene rather than replacing it with a separate avatar.
- Move and reframe the camera from explicit selection state. Do not run an unrelated animation timer.
- Show the selected agent's name, role, current status, current task, latest material event, linked evidence, open contradiction, and blocker when those records exist.
- Keep source facts, model claims, and deterministic risk results visually distinct.
- Let `Escape`, a visible back action, or selecting empty room space return to the table view.
- Preserve the selected agent in the URL or shared Saloon state so the view is reproducible during the demo.

The right panel uses ordinary DOM and shadcn primitives. Do not render paragraphs or controls inside WebGL.

### Observable activity

The Saloon execution trace uses human-readable messages, but it is not autonomous agents generating filler. One orchestrator emits a material event only when a stage produces an observable typed result.

The Saloon does not simulate six agents chatting. Record activity only when:

- a source was read;
- a relationship was added;
- a thesis claim was created;
- a contradiction was found;
- a risk check blocked or resized an action;
- Bear/Critic identified a failure scenario;
- human approval was recorded;
- a paper allocation was applied.

The selected agent panel may show these records as a compact activity list. Every material record has a source badge or system badge. Opening a source shows publisher, URL, observation time, and the graph edge or claim it supports.

A user question such as `Why did you reduce this position?` must resolve from the decision receipt, not unbounded chat history.

### New findings bell

Source: [Saloon new-findings notification decision](../raw-sources/saloon-new-findings-notification-decision-2026-08-29.md)

Place one notification bell at the bottom-right of the Saloon scene. Anchor it in DOM over the scene viewport so it stays usable when the camera moves. Do not attach a separate bell to each orb.

The bell shows an unread count and opens a newest-first findings panel. A finding is material only when an agent:

- adds a source-backed fact;
- adds or changes a relationship;
- creates or changes a thesis claim;
- finds a contradiction;
- changes a risk flag or order proposal.

A completed search with no new evidence does not create a notification.

Each finding shows the agent, observation time, source badge, live/historical/synthetic/fixture label, one-sentence change, and the affected evidence, edge, claim, or risk record. Selecting a finding opens the relevant agent interview and details. Preserve unread state by stable finding ID, not list position.

Ring or pulse the bell once for a new material finding. Do not animate it continuously. Use a polite live-region announcement, keep the button keyboard accessible, and disable the pulse under reduced motion.

Agents may keep searching while the Saloon is open. The demo can replay a bounded fixture stream when live search is unavailable. Every notification still requires a real evidence record; continuous search cannot become filler activity.

### Agent states

Use the existing semantic states:

- idle;
- reading;
- tracing;
- debating;
- checking risk;
- awaiting approval;
- executing;
- blocked;
- complete.

Map state to orb motion, material, light, a text label, and an icon where needed. Color alone cannot carry status. Do not use raw Tailwind green or red classes in components.

### Motion and fallback

- Keep ordinary panel changes between 180 and 350 milliseconds.
- Keep the camera move into or out of interview view between 500 and 800 milliseconds.
- With reduced motion, cut or crossfade between camera poses instead of flying through the room.
- Provide a keyboard-accessible DOM roster that selects the same agents as the orbs.
- If WebGL fails, replace the room with a static table illustration or structured roster while preserving selection and the right-side details.
- On narrow screens, keep the selected orb or table view primary and open details in a full-height Sheet.

## 3. Dashboard

### Top row

Use shadcn Cards for:

- paper NAV;
- Alpaca Paper account status, clearly labeled live or fixture;
- Alpaca paper-data status, clearly labeled live or fixture;
- daily paper P&L;
- gross exposure;
- available cash;
- active risk flags.

Animate number changes with Motion. The cards should not flash continuously.

### Portfolio and prices

Use Recharts for a single price or NAV time series. Use a shadcn Table for current positions and recent paper trades.

Recent-trade columns:

- time;
- asset;
- side;
- quantity;
- paper price;
- thesis;
- agent;
- risk result;
- decision receipt.

Use a Sheet for recommendation details. The receipt contains source evidence, current-versus-proposed metrics, approval state, and rejected or resized alternative actions.

### Most active agents

Use `@abui/animated-chart` for work completed by agent:

- assets researched;
- relationships traced;
- risks surfaced;
- proposals challenged;
- decisions approved.

Do not use the animated column chart for prices. It is categorical, not a time series.

### Activity and decisions

Place the adapted activity feed beside recent decisions. A click opens the relevant Saloon agent interview, material event, or decision receipt.

### Relationship view

Keep React Flow for the sourced event-to-position path. Do not replace it with the activity chart. Animate only the path currently selected.

### Recommendation review

Make human approval visible and explicit. Show:

- current versus proposed allocation;
- volatility, beta, sector exposure, concentration, and stress-test deltas;
- evidence IDs behind each material action;
- Risk Officer hard blocks and resize explanation;
- Bear/Critic severity, strongest counterargument, and failure scenarios;
- `Review reasoning`, `Approve paper action`, and `Reject recommendation` controls.

Disable approval when required evidence or risk output is invalid. Report Writer appears only after approval or rejection and receives final decision state, never live proposal state.

## Background and orb choices

### Shader background

Use `@23rd/shader-gradient` for onboarding and empty or waiting states. Keep it behind content and set pointer interaction off when the relationship graph is active.

Suggested onboarding settings:

```tsx
<ShaderGradient
  colors={["#5E9CCB", "#73A99A", "#E5D6A8", "#ADB5D7"]}
  speed={0.08}
  blur={0.78}
  intensity={0.78}
  interactive
/>
```

On the dashboard, use a static CSS fallback or low-intensity header wash rather than a full-screen running shader.

### Primary sphere and Saloon orbs

Keep the faceless React Three Fiber sphere for the cinematic fund state. The Saloon reuses that visual language for the six agents around one meeting table.

Put the table and every agent orb in one React Three Fiber canvas. Share geometry and materials where practical. Do not render six separate WebGL canvases. The fund orb can remain visually distinct through scale, material, or placement when it appears in the same scene.

### Minimal orb fallback

`@23rd/live-orb` remains a fallback for onboarding or a single host state if the custom sphere costs too much time. Its eyes change the tone and should not become the default model for all six Saloon agents. If the full 3D room misses the performance budget, keep the single-table composition with cheaper geometry and materials before replacing it with a collection of independent Live Orb instances.

## Registry adaptation checklist

### `@7ovr/activity-1`

- Replace static `Event` data with typed `AgentActivity` records.
- Use it inside the selected-agent panel and the non-WebGL roster fallback, not as a permanent left column.
- Replace remote `i.pravatar.cc` images with local orb marks.
- Preserve `AvatarFallback`.
- Link every activity row to a source, graph edge, or receipt.

### `@7ovr/chat-4`

- Do not use it as the primary Saloon composition.
- Reuse its accessible input and scrolling structure only for the optional question view or selected-agent activity list.
- Replace local seed state with the shared event store.
- Keep human questions separate from system-generated material events.
- Confirm the added Bubble, Message, and Message Scroller components match the Base UI preset before adapting any part of the block.

### `@abui/animated-chart`

- Inspect the dry run because its registry metadata references Motion 12 while the current technical reference observed a newer Motion package.
- Keep one installed Motion version.
- Add reduced-motion behavior.
- Use stable agent IDs rather than array indexes as React keys.

### `@abui/text-gradient`

- Render one instance for the current phase.
- Move the keyframes to global CSS if several instances are ever required.
- Disable the shifting gradient for reduced motion.
- Use semantic color variables.

### `@23rd/shader-gradient`

- Keep the CSS fallback.
- Turn off pointer response when graph interaction needs focus.
- Pause or unmount it after onboarding.
- Test WebGL failure and reduced motion.

### `@23rd/live-orb`

- Use one instance at most.
- Decide whether the eye treatment matches the fund's tone.
- Set `interactive={false}` during scripted demo steps if pointer tracking distracts.

## Navigation

Keep the installed collapsible application-shell sidebar after onboarding:

- Dashboard
- Saloon
- Decisions
- Mandate

Let the Saloon open with the sidebar collapsed or visually quiet so the 3D room remains the focus. Preserve the responsive trigger and keyboard navigation from the application shell.

## Acceptance test for the UI

A first-time viewer should understand this sequence without explanation:

1. the fund has a mandate;
2. specialized committee agents work in separate domains around one table;
3. the bell reports a new source-backed material event from the bounded run;
4. Cala supplies relationship evidence;
5. Portfolio Manager weighs research and deterministic risk;
6. Bear/Critic challenges the recommendation before human approval;
7. every approved paper action has a receipt and post-decision report.

If the screen communicates only "many agents are typing," the Saloon has failed.
