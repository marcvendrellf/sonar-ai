# `analysis/agents` — committee agent definitions

One file per committee stage, each exporting an `AgentDef` (see
[`../runner/types.ts`](../runner/types.ts)). An agent is **data**: a stage id,
instructions, an output schema from `@sonar-ai/core`, and a `buildInput` that
turns its isolated context pack into a model input. The `AgentRunner` executes
it — stubbed in Phase 3, real OpenAI in Phase 5.

| File | Stage | Output schema | Authority |
| --- | --- | --- | --- |
| `fundamental-analyst.ts` | `fundamental_analyst` | `FundamentalReport` | Evaluate asset quality/valuation. Cannot set sizing. |
| `market-context.ts` | `market_context` | `MarketContextReport` | Explain external context. Cannot turn one fact into a trade. |
| `risk-officer.ts` | `risk_officer` | `RiskReport` | Deterministic — drives `@sonar-ai/risk-engine`; can hard-block. |
| `portfolio-manager.ts` | `portfolio_manager` | `Recommendation` | Propose + revise allocation. Cannot override Risk Officer. |
| `bear-critic.ts` | `bear_critic` | `BearCase` | Flag weaknesses/failure scenarios. **No veto.** |
| `report-writer.ts` | `report_writer` | `CommitteeReport` | Runs **after** the human decision. Cannot influence allocation. |

Rules:

- Each agent receives only its slice of state (`../context.ts`) — never one giant
  prompt, never another agent's raw output.
- The Risk Officer is deterministic-first: it calls the pure engine and reports
  reproducible numbers. A model layer over it is optional and comes last.
- Report Writer must never run before `userDecision` is set.
