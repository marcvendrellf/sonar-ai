# UI consolidation and parallel branch decision

Date: 2026-08-29

Source: user direction after the onboarding, dashboard, and Saloon agents stopped.

## User direction

Checkpoint the onboarding, dashboard, and Saloon work together, organize the shared code, push the unified state to GitHub, and then create three feature branches so separate agents can improve each area in parallel.

## Decision

- The current onboarding, dashboard, Saloon, shared application shell, assets, and maintained wiki become one common UI baseline on `main`.
- The public routes are `/` and `/onboarding` for onboarding, `/dashboard` for the dashboard, and `/saloon` for the Saloon.
- Follow-up work starts from the same baseline on three branches:
  - `feat/onboarding-polish`
  - `feat/dashboard-polish`
  - `feat/saloon-polish`
- Each branch has one writer. Agents must not edit another feature's folder.
- Shared files such as `apps/web/app/globals.css`, `apps/web/app/layout.tsx`, `apps/web/components/application-shell1.tsx`, `apps/web/package.json`, `pnpm-lock.yaml`, and the maintained wiki require explicit coordination.
- The checkpoint does not claim that any of the three surfaces is finished. Each still needs visual, responsive, accessibility, contract, and presentation-laptop review.
