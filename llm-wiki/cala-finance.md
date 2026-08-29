# Cala for finance

Sources: [Cala finance capture](../raw-sources/cala-finance-2026-08-28.md), [official API/MCP reference capture](../raw-sources/cala-api-reference-2026-08-29.md)

## What Cala appears useful for

Cala claims to return typed, source-linked facts from a knowledge graph through MCP or API. For this project, the most useful claimed data groups are:

| Data group | Possible product job |
| --- | --- |
| Company registries and beneficial owners | Resolve a business and map ownership |
| Sanctions and PEP lists | Screen counterparties and connected people |
| Court and litigation records | Flag legal exposure |
| Credit ratings and stress tests | Add external risk evidence |
| SEC filings and Form 4 | Compare reported performance, disclosures, and insider activity |
| Regulatory and central-bank data | Add macro or supervisory context |
| News and press releases | Explain recent changes |
| Provenance and validity | Let the user inspect why a claim appears |

## Product principle

Cala should provide the evidence graph, not a single decorative metric. The user should be able to open each risk flag, inspect the source, and see when the fact was valid. The LLM can explain and assemble the decision memo, but it should not invent the underlying finance facts.

## Strong fits

- Counterparty and KYB review
- Sanctions and ownership exposure
- Filing change analysis
- Insider-activity explanation
- Credit and distress evidence gathering

## Weak fits

- A budgeting app based only on user-entered transactions
- A generic finance chatbot
- A stock recommender with no inspectable evidence chain
- A payment app where Cala is not involved in the core transaction

## Integration stance

Use Cala REST server-side and wrap it in strict Sonar tools. Official Cala MCP exposes equivalent capabilities, but Cala documents its schemas as dynamic and incompatible with strict tool mode. REST preserves dynamic data access while Sonar controls inputs, limits, validation, provenance, and fixture parity.

Implemented capabilities are entity search, paged/filterable introspection, selective profile retrieval by metric ID, structured knowledge query, sourced knowledge search, and bounded incoming/outgoing graph traversal. “All data points” means agents can inspect Cala's current field catalog across bounded calls; Sonar does not hard-code or falsely claim a complete metric list.

For MVP, Cala is a research capability used by Fundamental Analyst and Market Context Analyst through typed tools. It is not a standalone conversational agent and does not decide allocation. Search/query outputs guide discovery but cannot support claims by themselves. Normalize profile/traversal sources, evidence, nodes, and edges into shared `InvestmentCommitteeState`; never pass uncited Cala prose into Portfolio Manager.

## Unverified points

Cala's public page does not confirm:

- which European registries are currently queryable;
- how entity disambiguation works;
- how complete beneficial-owner and PEP links are;
- freshness by source;
- exact event-account response variants;
- whether one query can join several finance data groups;
- whether hackathon credits differ from the public starter limits.

Test these before the team commits to a concept.
