# User-selected UI components

- Source: user message and linked component documentation
- Captured: 2026-08-28
- Status: immutable capture

## Product requirements

- Use shadcn/ui as the component system.
- Build a cinematic onboarding flow.
- Build a modern "Saloon" where the agent roster, current work, and agent conversation are visible.
- Build a modern dashboard for recent paper trades, prices, portfolio data, and agent activity.
- Keep the supplied futuristic white-panel and animated-sphere visual direction.

## Selected registry components

### 23rd.dev

- Shader Gradient: https://23rd.dev/docs/components/shader-gradient
- Registry item: `@23rd/shader-gradient`
- Intended use: onboarding and atmospheric backgrounds.
- Live Orb: https://23rd.dev/docs/components/live-orb
- Registry item: `@23rd/live-orb`
- Intended use: minimal orb option.

### 7ovr

- Activity feed: `@7ovr/activity-1`
- Intended use: recent agent actions and current work.
- Group chat: `@7ovr/chat-4`
- Intended use: the Saloon conversation.

### abui

- Animated chart: `@abui/animated-chart`
- Intended use: most active agents.
- Text gradient: `@abui/text-gradient`
- Intended use: thinking and processing labels.

### Core shadcn/ui

Use regular shadcn components for buttons and the rest of the application shell.

## Registry inspection notes

The components were inspected with `shadcn view` before installation.

- `@7ovr/activity-1` is a static recent-activity card. It depends on Base UI plus shadcn Avatar and Card. Replace its seed users and remote avatar URLs with typed agent data and local agent marks.
- `@7ovr/chat-4` is a client-side group chat panel. It depends on Base UI and registry components for Bubble, Message, and Message Scroller. Replace its local seed state with the shared agent event stream.
- `@abui/animated-chart` is a Motion-based animated column chart. It fits agent work counts, not time-series prices.
- `@abui/text-gradient` is a lightweight animated text effect. Use it for one current thinking label. Its animation must stop under reduced-motion preferences.
- `@23rd/shader-gradient` runs a WebGL canvas with a CSS fallback, theme support, pointer interaction, and reduced-motion handling.
- `@23rd/live-orb` runs a separate WebGL canvas and includes two eyes. It is more personable than the glossy faceless sphere in the primary visual reference.

## Package-manager decision

Use pnpm consistently. Do not mix `npx` and `pnpm dlx` commands in the project workflow.
