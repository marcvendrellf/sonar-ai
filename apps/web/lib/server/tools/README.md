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
| `search_company_information` | Cala / fixture | relationship tracing lives here |
| `calculate_portfolio_metrics` | `@sonar-ai/risk-engine` | deterministic |
| `calculate_asset_exposure` | `@sonar-ai/risk-engine` | deterministic |
| `run_stress_test` | `@sonar-ai/risk-engine` | deterministic |
| `compare_portfolio_scenarios` | `@sonar-ai/risk-engine` | deterministic |
| `get_existing_thesis` | internal state | |
| `save_recommendation` | internal state | writes state only — never an order |

Each tool implements `Tool<In, Out>` with Zod input/output schemas and honors
`ctx.offline` (fixture path when true). Add one by following "How to add a tool"
in [`../README.md`](../README.md).
