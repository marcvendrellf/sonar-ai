# `lib/server` — the Sonar AI agent backend

This directory is the **agents & data lane** (Josep + Axel). It holds everything
that runs on the server: the committee orchestrator, the agents, the tool layer,
the Cala and Alpaca adapters, and the OpenAI client. The browser never imports
anything here.

Read this before opening a file. The cross-lane contract lives in
[`@sonar-ai/core`](../../../../packages/core); the deterministic risk math lives
in [`@sonar-ai/risk-engine`](../../../../packages/risk-engine). This layer wires
them to the model and the outside world.

## The committee, in code

```
portfolio + mandate + scenario
              │
      AnalysisOrchestrator            analysis/orchestrator.ts
        ├─ Fundamental Analyst  ┐     analysis/agents/fundamental-analyst.ts
        ├─ Market Context       ┘     analysis/agents/market-context.ts   (parallel)
        → Portfolio Manager proposal  analysis/agents/portfolio-manager.ts
        ├─ Risk Officer               analysis/agents/risk-officer.ts  → risk-engine
        → Bear / Critic               analysis/agents/bear-critic.ts   (no veto)
        → Portfolio Manager revision
        → human approve / reject      ← gate before any ledger mutation
        → paper ledger  +  Report Writer (after decision only)
```

## Directory map

| Path | Responsibility | Status |
| --- | --- | --- |
| `env.ts` | Validated, server-only environment (`getServerEnv`, `isOffline`). | ✅ ready |
| `analysis/orchestrator.ts` | Runs the committee, owns phase transitions + the three gates. | ☐ Phase 3 |
| `analysis/context.ts` | Builds the **isolated** context pack per stage. | ☐ Phase 3 |
| `analysis/gates.ts` | Evidence-validation gate · risk gate · human-approval gate. | ☐ Phase 3 |
| `analysis/trader.ts` | Deterministic paper-ledger mutation (not an agent, not a broker). | ☐ Phase 3 |
| `analysis/runner/types.ts` | `AgentRunner` / `AgentDef` — the stub↔OpenAI seam. | ✅ ready |
| `analysis/runner/stub-runner.ts` | Deterministic runner returning canned fixture outputs. | ✅ ready |
| `analysis/runner/openai-runner.ts` | Real OpenAI structured-output runner. | ☐ Phase 5 |
| `analysis/agents/*.ts` | One `AgentDef` per committee stage. | ☐ Phase 3/5 |
| `tools/types.ts` | The closed `ToolName` set + `Tool` / `ToolRegistry`. | ✅ ready |
| `tools/*.ts` | One file per tool; resolves to risk-engine / Cala / Alpaca / fixture. | ☐ Phase 4 |
| `llm/openai-client.ts` | Thin OpenAI wrapper (bounded tokens + retries). | ☐ Phase 5 |
| `llm/structured-output.ts` | Zod → JSON schema · call · parse · validate. | ☐ Phase 5 |
| `cala/*.ts` | The only Cala client; normalize + evidence-validate; fixture fallback. | ☐ Phase 4 |
| `alpaca/*.ts` | The only Alpaca client — **Paper-only**; normalize; fixture fallback. | ✅ portfolio slice |

Fixtures live in [`apps/web/fixtures`](../../fixtures). Route handlers live in
`apps/web/app/api/*` and stay thin — they invoke one committee run and nothing more.

## Non-negotiable conventions

1. **Agents are data, runners are behavior.** An agent is an `AgentDef`
   (stage + instructions + output schema + `buildInput`). The orchestrator
   constructs one `AgentRunner` — `StubAgentRunner` in Phase 3,
   `OpenAIAgentRunner` in Phase 5. Nothing else changes when we go live.
2. **The tool list is closed.** Only the names in `tools/types.ts` are callable.
   No tool submits an order or touches an account. No agent calls another agent —
   the orchestrator is the only sequencer.
3. **Isolated context.** Each agent receives only its slice of state
   (`analysis/context.ts`), never one giant prompt and never another agent's raw output.
4. **Every output is validated.** A model output is invalid until its Zod schema
   passes AND every material claim resolves to a known evidence id
   (`findDanglingEvidenceIds` from `@sonar-ai/core`). Invalid → one bounded retry → fixture fallback.
5. **The three gates, enforced in code (not prompts):**
   evidence gate → risk gate (`evaluateProposal`) → human-approval gate.
   `userDecision` must be `approved` before the trader mutates the ledger.
6. **Alpaca is Paper-only.** Its module uses a fixed Paper endpoint; live
   credentials and live endpoints are rejected.
7. **Secrets stay here.** Never prefix a server var with `NEXT_PUBLIC_`; never
   import `env.ts` from a client component. The browser receives typed records
   only — never prompts, credentials, or hidden reasoning.
8. **Offline by default.** `isOffline()` forces the fixture path so the full demo
   runs with the network off.

## How to add an agent

1. Add its output schema to `packages/core/src/agents.ts` (if not already there).
2. Create `analysis/agents/<name>.ts` exporting an `AgentDef` (stage, instructions,
   `outputSchema`, `buildInput`).
3. Add its isolated context slice in `analysis/context.ts`.
4. Register it in the orchestrator's stage order.
5. Provide a canned output in the fixture so `StubAgentRunner` can drive it.

## How to add a tool

1. Add the name to `TOOL_NAMES` in `tools/types.ts`.
2. Create `tools/<name>.ts` implementing `Tool<In, Out>` with Zod input/output schemas.
3. Resolve to risk-engine / Cala / Alpaca / fixture inside `execute`, honoring `ctx.offline`.
4. Register it in the tool registry the orchestrator builds.

## Build order (this lane)

Phase 3 orchestrator + stub agents → Phase 4 tools + adapters → Phase 5 real
OpenAI agents (one at a time) → Phase 6 API routes. See the repository plan and
`llm-wiki/team-workflow.md` for ownership and branch rules.
