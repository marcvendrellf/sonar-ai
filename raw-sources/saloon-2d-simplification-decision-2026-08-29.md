# Saloon 2D simplification decision

Date: 2026-08-29
Source: user feedback in the active 2D Saloon implementation thread

## Direction

The first 2D backup still showed too much interface and explanatory text. Simplify it much further. The agents are the important part and should dominate the screen.

## Implementation consequence

- The default `/saloon` view shows only the six agent cards plus a minimal header and findings control.
- Remove the central event card, evidence-path panel, visible activity inspector, progress bar, and timeline scrubber from the default view.
- Each agent card shows one large identity mark, name, short role, and state.
- Agent task and material-event details move into a Sheet opened by selecting an agent.
- The source Sheet, receipt Sheet, bounded findings Sheet, URL-backed selection, and deterministic fixture playback remain available without competing with the agent grid.
- Because the agents now carry the entire composition, map their visible identities to the reviewed committee: Market Context, Fundamental Analyst, Portfolio Manager, Bear / Critic, Risk Officer, and Report Writer.
