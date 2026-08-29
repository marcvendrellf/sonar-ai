# Saloon

This branch serves the shadcn-only 2D Saloon backup at `/saloon`. It started from the same consolidated checkpoint as the primary `feat/saloon-polish` branch and exists in case the 3D room misses its reliability or presentation target.

The branch follows the [2D backup decision](../../../../raw-sources/saloon-2d-backup-decision-2026-08-29.md) and the fallback section in [the interface plan](../../../../llm-wiki/interface-plan.md). The 3D files and local assets remain in the tree for comparison, but `/saloon` does not import or initialize WebGL on this branch.

## What it does

One prepared event, EV-104, runs from 09:42:04 to 09:43:12. Six selectable agent seats surround a central committee card. The card reveals the event-to-position evidence path, latest material event, run progress, and receipt gate. A persistent desktop inspector or responsive Sheet shows agent work and evidence-linked activity.

The bottom-right findings Sheet lists only material records. Source reads, relationship changes, claims, contradictions, deterministic risk results, and paper actions may create findings. Stable trace IDs track read state.

## Files

| File | Owns |
| --- | --- |
| `run-fixture.ts` | The 20-entry fixture run, sources, checks, receipt, and receipt-bound answers |
| `use-saloon-run.ts` | Playback and the deterministic fold over the visible trace prefix |
| `saloon.tsx` | 2D page controller, URL selection, controls, scrubber, responsive details, findings, and source/receipt Sheets |
| `saloon-2d-board.tsx` | shadcn committee board, seats, evidence path, activity feed, selected-agent inspector, and receipt question tab |
| `receipt-qa.tsx` | Questions answered from receipt SR-042 only |
| `saloon-sheets.tsx` | Source and decision-receipt Sheets |
| `saloon.css` | Scoped semantic agent, state, and result tokens shared with the baseline |

The remaining scene, shell, and orb files belong to the primary 3D implementation and are intentionally unused here.

## Component rules

- Every interactive control uses the installed shadcn/Base UI Button, Tabs, Tooltip, or Sheet primitives.
- Every panel uses Card composition. Agent identities use Avatar and AvatarFallback. State and record labels use Badge.
- Progress, Scroll Area, and Separator provide the remaining structure. The branch adds no new UI package.
- The activity presentation adapts the installed `@7ovr/activity-1` pattern.
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

The branch has also been checked at 1280 by 720 and 390 by 844. The remaining decision is a side-by-side presentation-laptop comparison with `feat/saloon-polish`.
