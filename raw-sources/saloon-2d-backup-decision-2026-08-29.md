# Saloon 2D backup decision

Date: 2026-08-29
Source: user direction in the active implementation thread

## Direction

Build a simpler 2D version of the Saloon in parallel with the 3D branch. Keep it on its own branch so the team has a working backup if the 3D room does not work out.

The user made shadcn components and shadcn-compatible libraries mandatory for the 2D version. They asked the implementation to research the shadcn directory and similar registries, and to inspect the earlier Cala hackathon repository for reusable dashboard components.

## Implementation consequence

- Branch: `feat/saloon-2d-backup`
- Worktree: isolated from the dirty dashboard checkout and the active 3D Saloon worktree
- Route when this branch is used: `/saloon`
- The 2D version preserves the fixture playback, selectable agents, URL-backed selection, source and receipt inspection, deterministic run folding, responsive details Sheet, and material-findings bell.
- The room uses installed shadcn/Base UI primitives for cards, buttons, avatars, badges, progress, tabs, tooltips, scroll areas, separators, and sheets.
- The activity panel adapts the already-installed `@7ovr/activity-1` pattern. The findings Sheet follows the inspected `@7ovr/notifications-1` pattern without installing another block.

## Registry research

Retrieved 2026-08-29.

- [shadcn registry directory](https://ui.shadcn.com/docs/registry/registry-index)
- [7ovr documentation](https://7ovr.com/docs)
- [7ovr license](https://7ovr.com/license)
- `pnpm dlx shadcn@latest search` found relevant `@7ovr` activity, timeline, notification, kanban, and application-shell blocks.
- A dry run of `@7ovr/notifications-1` would add one block file and reuse the already-installed Button, Scroll Area, Separator, and Sheet primitives.
- Viewing `@7ovr/activity-1` confirmed that the local adapted copy already replaces remote avatar data with typed fixture activity.

The earlier Cala hackathon repository contains a custom sprite canvas and React Flow agent workspace. Those ideas were inspected but not copied. The sprite canvas is not shadcn-based, and the React Flow node layer is coupled to another UI stack. The simpler shadcn card-and-table composition is a better backup because it adds no runtime dependency and keeps keyboard access native.
