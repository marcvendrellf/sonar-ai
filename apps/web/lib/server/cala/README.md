# `cala` — evidence knowledge graph (server-only)

The **only** place Cala is called. Uses Cala's fixed server-side REST API and
turns dynamic responses into validated, source-linked tool results. Raw Cala MCP
tools are not model-facing because their dynamic schemas cannot satisfy strict
function-tool contracts.

Implemented files:

- `client.ts` — REST client fixed to `https://api.cala.ai/v1`. Sends
  `X-API-KEY`, honors `CALA_TIMEOUT_MS`, validates every response with Zod, and
  sanitizes errors.
- `schemas.ts` — tolerant validation for Cala's dynamic entities, properties,
  relationships, numerical observations, query rows, and search responses.
- `traversal.ts` — bounded breadth-first traversal: depth ≤3, nodes ≤50,
  per-relationship results ≤20. Every returned edge carries evidence IDs.
- `fixture-provider.ts` — deterministic synthetic provider with a second-order
  supplier/event path. Used whenever `SONAR_OFFLINE=true`.

Rules:

- Credentials never leave the server; the browser gets normalized records only.
- Treat Cala product-page claims as vendor claims until a fixture proves them.
- Synthetic fixture proves adapter behavior only. Save one sanitized live
  request/response capture before claiming coverage or freshness.
