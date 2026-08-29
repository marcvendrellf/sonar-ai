# Naming and monorepo decision

- **Type:** Decision (user choice)
- **Date:** 2026-08-29
- **Captured by:** agent, from user instruction in the implementation session

## Decision

1. The product is named **Sonar AI**. "Agent Fund" becomes the internal codename used in earlier captures and history; it is no longer the product name.
2. The code lives in the private GitHub repository `github.com/marcvendrellf/sonar-ai` (account `marcvendrellf`), branch `main`.
3. The repository is a **monorepo**: one pnpm workspace containing the Next.js application plus shared packages, rather than a single-directory application.

## Consequences

- Wiki pages, repository contract, and onboarding copy should say Sonar AI. Historical captures and log entries keep "Agent Fund" as written.
- The technical reference pack's file layout becomes a pnpm workspace layout (`apps/web`, `packages/*`).
- The open question "What is the final fund name?" in `llm-wiki/open-questions.md` is closed by this decision. Applying the name to onboarding copy and page metadata remains part of scaffold work.

## Raw provenance

User instruction in the coding session on 2026-08-29. No external web source is involved.
