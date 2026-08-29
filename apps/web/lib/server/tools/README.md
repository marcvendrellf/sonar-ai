# `tools` — the closed capability set

The only capabilities an agent may reach. The name set is fixed in
[`types.ts`](types.ts); nothing outside it is callable. No tool submits an
order, moves funds, or touches a brokerage account, and no agent calls another
agent — the orchestrator is the only sequencer.

| Tool | Resolves to | Notes |
| --- | --- | --- |
| `get_portfolio_snapshot` | internal state | current paper portfolio |
| `get_price_history` | Alpaca Market Data / fixture | read-only |
| `get_company_fundamentals` | Cala / fixture | |
| `search_company_information` | Cala / fixture | sourced open-ended research |
| `query_financial_knowledge` | Cala / fixture | dynamic structured finance rows |
| `find_cala_entities` | Cala / fixture | resolve stable entity IDs |
| `inspect_cala_entity` | Cala / fixture | discover fields/types; metric catalog paged ≤100 |
| `get_cala_entity_profile` | Cala / fixture | retrieve selected fields and metrics |
| `traverse_cala_relationships` | Cala / fixture | bounded source-linked BFS |
| `calculate_portfolio_metrics` | `@sonar-ai/risk-engine` | deterministic |
| `calculate_asset_exposure` | `@sonar-ai/risk-engine` | deterministic |
| `run_stress_test` | `@sonar-ai/risk-engine` | deterministic |
| `compare_portfolio_scenarios` | `@sonar-ai/risk-engine` | deterministic |
| `get_existing_thesis` | internal state | |
| `save_recommendation` | internal state | writes state only — never an order |

Each tool implements `Tool<In, Out>` with Zod input/output schemas and honors
`ctx.offline` (fixture path when true). Add one by following "How to add a tool"
in [`../README.md`](../README.md).

Fundamental Analyst gets entity, fundamentals, query, and search tools. Market
Context gets entity, query/search, and graph traversal tools. Search/query and
entity discovery are non-citable discovery tools. Profile, fundamentals, and
traversal return underlying-source evidence; runner merges evidence plus
normalized traversal graph artifacts into committee state before evidence gates.
Other agents do not receive raw research tools.
Runner permits sequential calls only, defaults to eight calls per stage, keeps
one total output-token budget, and rejects any tool result over 60,000 characters.
