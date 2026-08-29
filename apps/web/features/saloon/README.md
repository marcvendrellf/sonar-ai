# Saloon

This branch serves the shadcn-only 2D Saloon backup at `/saloon`. It started from the same consolidated checkpoint as the primary `feat/saloon-polish` branch and exists in case the 3D room misses its reliability or presentation target.

The branch follows the [2D backup decision](../../../../raw-sources/saloon-2d-backup-decision-2026-08-29.md) and the later [simplification decision](../../../../raw-sources/saloon-2d-simplification-decision-2026-08-29.md). The 3D files and local assets remain in the tree for comparison, but `/saloon` does not import or initialize WebGL on this branch.

## Default view

The agents own the screen. Six large selectable cards show only an identity mark, name, short role, and current state. The visible cast matches the reviewed committee: Market Context, Fundamental Analyst, Portfolio Manager, Bear / Critic, Risk Officer, and Report Writer.

The default view has no event panel, evidence path, activity feed, progress bar, timeline, or persistent inspector. Selecting an agent opens a Sheet with its current task and latest material work. Source records, findings, and the decision receipt remain available as secondary overlays.

## Files

| File | Owns |
| --- | --- |
| `run-fixture.ts` | The 20-entry fixture run, reviewed committee display mapping, sources, checks, receipt, and receipt-bound answers |
| `use-saloon-run.ts` | Playback and the deterministic fold over the visible trace prefix |
| `saloon.tsx` | Minimal header, agent selection, playback controls, findings, and source/receipt Sheets |
| `saloon-2d-board.tsx` | Six-agent grid and selected-agent details |
| `receipt-qa.tsx` | Questions answered from receipt SR-042 only |
| `saloon-sheets.tsx` | Source and decision-receipt Sheets |
| `saloon.css` | Scoped semantic agent, state, and result tokens shared with the baseline |

The remaining scene, shell, and orb files belong to the primary 3D implementation and are intentionally unused here.

## Component rules

- Every interactive control uses the installed shadcn/Base UI Button, Tooltip, or Sheet primitives.
- Every agent and detail panel uses Card composition. Agent identities use Avatar and AvatarFallback. State labels use Badge.
- Scroll Area and Separator structure secondary details. The branch adds no UI package.
- The findings Sheet follows the dry-run-inspected `@7ovr/notifications-1` pattern without installing its static demo block.
- Selection lives in `?agent=<id>` and clears with Escape.
- State always has a written label and icon. Color never carries status alone.
- The run is fixture data. Nothing here places a real-money order.

## Validation

Run from the repository root:

```bash
pnpm --filter web typecheck
pnpm --filter web lint
pnpm --filter web build
```

The branch is checked at 1280 by 720 and 390 by 844. The remaining decision is a side-by-side presentation-laptop comparison with `feat/saloon-polish`.
