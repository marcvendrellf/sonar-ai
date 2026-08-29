# Cala API and MCP reference capture

Retrieved: 2026-08-29

Official sources:

- <https://docs.cala.ai/llms.txt>
- <https://docs.cala.ai/integrations/mcp>
- <https://docs.cala.ai/api-reference/query>
- <https://docs.cala.ai/api-reference/search>
- <https://docs.cala.ai/api-reference/search-entities>
- <https://docs.cala.ai/api-reference/entity-introspection>
- <https://docs.cala.ai/api-reference/entities>

## Verified public contract

- REST base is `https://api.cala.ai/v1`; authentication uses `X-API-KEY`.
- `POST /knowledge/query` returns dynamic structured rows plus resolved entities.
- `POST /knowledge/search` returns sourced content, context, entities, and explainability.
- `GET /entities` resolves names and entity types.
- `GET /entities/{id}/introspection` discovers available properties, incoming/outgoing relationship types, and numerical-observation definitions.
- `POST /entities/{id}` retrieves selected properties, bounded relationships, and numerical observations. Numerical-observation requests group introspected metric IDs by type (for example `FinancialMetric: [id]`). Relationship provenance and validity fields are nested under each related entity's `properties` object.
- Official MCP exposes equivalent search/query/entity tools at `https://api.cala.ai/mcp/`.
- Cala documents its MCP schemas as dynamic and incompatible with strict function schemas. Sonar therefore uses server-side REST and wraps it in stable strict tools.

## Still unverified

This capture verifies documentation, not event-account behavior. No event credential was used. Coverage, freshness, exact live response variants, useful event-to-public-company paths, and rate limits still require one sanitized live experiment.
