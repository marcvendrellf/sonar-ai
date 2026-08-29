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

## [2026-08-29] decision | Sonar reconfirmed with read-only eToro data

The user reconfirmed the Sonar AI hedge-fund direction. The maintained wiki now gives new clones one active product path.

Added eToro as a read-only market or reference-data integration, subject to official capability verification. Paper money remains mandatory. Sonar simulates orders internally and cannot submit real-money orders, deposits, withdrawals, or brokerage-account instructions. Recorded the event's broad message: `Build whatever you want, you might just leave with the MVP from your next startup and some cool prizes!`

## [2026-08-29] implementation | App shell and first dashboard built

Scaffolded the pnpm workspace with a Next.js app in `apps/web` and reserved `packages/core` and `packages/risk-engine`. Initialized shadcn with the Base UI `base-nova` preset, previewed the registry changes, and installed the application-shell block, the selected third-party components, and the required shadcn primitives.

Adapted the shell to the compact navigation required by the interface plan. Built a fixture-driven dashboard with paper-fund metrics, a Recharts NAV series, positions, a sourced relationship path, agent activity, the categorical agent-work chart, risk results, and a decision-receipt Sheet. The registry chart now uses stable agent IDs and respects reduced motion. Typecheck, lint, and the production build pass.

## [2026-08-29] correction | Application-shell sidebar restored

Restored the collapsible sidebar, inset header, sidebar rail, and responsive trigger from `@shadcnblocks/application-shell1` after the first adaptation replaced the block with top navigation. Fixed the shadcn font token so Geist renders through `--font-geist-sans`.
