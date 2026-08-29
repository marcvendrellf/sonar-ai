# Source capture: Cala product and finance pages

- Sources: https://cala.ai/ and https://cala.ai/industries/finance
- Retrieved: 2026-08-28
- Capture method: public server-rendered HTML
- Status: immutable capture

This file records Cala's own product claims. They need API testing before the team treats them as proven behavior.

## Product description

Cala describes its product as verified data organized into a knowledge graph for AI agents. The site says clients can query typed, sourced facts through API, CLI, or MCP.

The site lists these data properties:

- historical data;
- exhaustive queries;
- typed results;
- provenance and lineage;
- properties and validities;
- trustworthy data;
- connected entities.

## Finance coverage claimed by Cala

Cala says its finance data supports compliance, KYC, risk analysis, and investment use cases. The page lists:

- SEC and EDGAR filings, including 10-K, 10-Q, 8-K, proxy statements, and Form 4;
- delayed market feeds, CBOE data, FINRA TRACE bond data, and FRED releases;
- public issuer ratings and published bank or stress-test ratings;
- OFAC, EU, and UN sanctions lists plus FinCEN advisories;
- corporate registries and beneficial ownership data;
- court and litigation records;
- central-bank and regulatory filings, including ECB and BIS data;
- news, press releases, and regulatory announcements;
- PEP and government rosters.

The site says Cala covers public companies, small and medium businesses, and startups. It does not state complete geographic or entity coverage in the captured text.

## Integration options claimed by Cala

The site lists MCP, API, Claude Code, Claude Desktop, Cursor, and n8n. Its public MCP example uses:

- endpoint: `https://api.cala.ai/mcp/`
- authentication header: `X-API-KEY`

## Hackathon-relevant limits and unknowns

- The public page lists a free starter tier with 100 credits per month and 10 requests per minute. The event page separately says hackathon participants receive partner credits.
- One Cala query is described as one credit.
- The captured page does not expose exact query schemas, sample finance responses, entity-match behavior, citation formats, or coverage guarantees.
- The captured page marks triggers as "coming soon," so a live monitoring product should not assume native triggers exist.
