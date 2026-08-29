# Interface plan

Sources:

- [User-selected UI components](../raw-sources/user-selected-ui-components-2026-08-28.md)
- [Alpaca paper-trading verification](../raw-sources/alpaca-paper-trading-verification-2026-08-29.md)

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

### Scene 1: The fund wakes

Use `@23rd/shader-gradient` behind a nearly empty full-screen composition.

Copy:

- Eyebrow: `An agentic paper fund`
- Headline: `It does not trade the headline.`
- Reveal: `It trades the relationships behind it.`
- Primary action: `Initialize the fund`

Use `@abui/text-gradient` for one short status such as `Establishing mandate...`. Do not apply it to the headline or body copy.

### Scene 2: Set the mandate

Use shadcn Cards and radio or toggle controls for demonstration policies:

- initial paper NAV;
- starting allocation: €1,000 cash and 0% invested exposure;
- maximum position exposure;
- maximum sector exposure;
- minimum cash;
- maximum turnover per event.

Provide one recommended demo preset. Avoid consumer labels such as conservative, balanced, and aggressive because they sound like personalized investment advice.

### Scene 3: Meet the agents

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

### Scene 4: Enter the Saloon

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

### Purpose

The Saloon makes staged analysis legible. It answers:

- Who is working?
- What are they doing?
- What evidence did they find?
- Where do they disagree?
- What is blocked?

### Desktop layout

```text
┌──────────────────┬───────────────────────────┬──────────────────┐
│ Agent roster     │ Agent conversation        │ Current evidence │
│ status and task  │ and decision checkpoints  │ graph and sources│
└──────────────────┴───────────────────────────┴──────────────────┘
```

- Left: adapted `@7ovr/activity-1`.
- Center: adapted `@7ovr/chat-4`.
- Right: current relationship path, source cards, and risk-check status.
- Mobile: move evidence into a shadcn Sheet and roster into Tabs.

### Chat behavior

The Saloon chat is an execution trace with human-readable messages. It is not autonomous agents generating filler. One orchestrator emits messages only when a stage produces an observable typed result.

Only add a message when an observable event occurs:

- a source was read;
- a relationship was added;
- a thesis claim was created;
- a contradiction was found;
- a risk check blocked or resized an action;
- Bear/Critic identified a failure scenario;
- human approval was recorded;
- a paper allocation was applied.

Every material message has a source badge or a system badge. Clicking a source badge opens a Sheet with publisher, URL, observation time, and the graph edge it supports.

The user can ask a question such as `Why did you reduce this position?` The system responds from the decision receipt, not from unbounded chat history.

### Agent states

Use semantic Badge variants backed by CSS variables:

- idle;
- reading;
- tracing;
- debating;
- checking risk;
- awaiting approval;
- executing;
- blocked;
- complete.

Do not use raw Tailwind green or red classes in components.

## 3. Dashboard

### Top row

Use shadcn Cards for:

- paper NAV;
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

Place the adapted activity feed beside recent decisions. A click opens the relevant Saloon message or decision receipt.

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

### Primary sphere

Keep the faceless React Three Fiber sphere for the cinematic fund state if time permits. It matches the supplied reference and can express tracing, challenging, blocked, and execution states without looking like a mascot.

### Minimal orb option

Use `@23rd/live-orb` if the primary sphere costs too much time. Its eyes make it friendly and agent-like, so it fits onboarding or a Saloon host better than an institutional fund object.

Do not render one WebGL Live Orb per agent. Use one live orb and static Avatar components for the roster. The shader gradient and live orb already create separate animation loops.

## Registry adaptation checklist

### `@7ovr/activity-1`

- Replace static `Event` data with typed `AgentActivity` records.
- Replace remote `i.pravatar.cc` images with local marks.
- Preserve `AvatarFallback`.
- Link every activity row to a source, graph edge, or receipt.

### `@7ovr/chat-4`

- Replace local seed state with the shared event store.
- Replace people with agent identities.
- Preserve Message Scroller behavior and accessible input labeling.
- Keep human questions separate from system-generated trace messages.
- Confirm the added Bubble, Message, and Message Scroller components match the Base UI preset.

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

Use a compact top navigation after onboarding:

- Dashboard
- Saloon
- Decisions
- Mandate

Do not expose a long sidebar in the first version. The three-panel composition already carries enough structure.

## Acceptance test for the UI

A first-time viewer should understand this sequence without explanation:

1. the fund has a mandate;
2. specialized committee agents work in separate domains;
3. Cala supplies relationship evidence;
4. Portfolio Manager weighs research and risk;
5. Bear/Critic challenges recommendation;
6. human approval precedes paper action;
7. every decision has a receipt and report.

If the screen communicates only "many agents are typing," the Saloon has failed.
