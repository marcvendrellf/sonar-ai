# `cala` — evidence knowledge graph (server-only)

The **only** place Cala is called. Turns Cala responses into `@sonar-ai/core`
`nodes` / `edges` / `evidence`, and validates that every material claim resolves
to an evidence id.

Planned files:

- `client.ts` — MCP client. Sends `X-API-KEY` (`CALA_API_KEY`), endpoint
  `CALA_MCP_ENDPOINT`, honors `CALA_TIMEOUT_MS`. Falls back to the fixture on
  timeout/error or when `isOffline()`.
- `normalize.ts` — raw Cala → core `GraphNode[]` / `GraphEdge[]` / `Evidence[]`.
  Every edge carries ≥1 evidence id (relationships are evidence, not proof).
- `evidence-validator.ts` — reject any claim whose evidence ids do not resolve.

Rules:

- Credentials never leave the server; the browser gets normalized records only.
- Treat Cala product-page claims as vendor claims until a fixture proves them.
- Save one sanitized request/response fixture — it closes the Cala go/no-go and
  is the offline demo path. Never commit a real API key.
