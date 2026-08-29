# `/api/analysis` — run & approve

Two POST endpoints drive one committee run. The human supplies **risk
preferences only**; the committee discovers the companies. Nothing is ever
traded without an explicit human approval in a **separate** call.

```
POST /api/analysis/run            -> runs to the approval gate, returns runId
POST /api/analysis/:runId/approve -> human decides; applies to Alpaca Paper
```

## 1. `POST /api/analysis/run`

Start a run. Body (all optional — defaults to `balanced`):

```jsonc
{
  "riskTolerance": "conservative" | "balanced" | "aggressive",
  // optional per-limit overrides; may only TIGHTEN the preset, never widen it
  "limits": {
    "maxGrossExposurePerPosition": 0.2,
    "maxSectorExposure": 0.3,
    "minCashRatio": 0.2,
    "maxTurnoverPerEvent": 0.1
  }
}
```

What it does, in order:

1. Loads the Alpaca Paper account + positions.
2. Assembles the idle committee state: risk preferences → mandate, the tradable
   universe + discovered evidence/graph + market snapshot from the scenario.
3. Runs **discovery → fundamentals → allocation → deterministic risk → critique
   → revision**, then **stops at the human-approval gate**. No ledger mutation.

Responses:

| Status | Meaning | Body |
| --- | --- | --- |
| `201` | Awaiting approval | `{ runId, phase: "awaiting_approval", state }` |
| `422` | A deterministic gate blocked the run | `{ runId, phase: "blocked", state }` |
| `400` | Invalid risk preferences | `{ error, issues }` |
| `503` | Offline with no recording to replay | `{ error }` |
| `500` | Unexpected failure | `{ error }` |

`state` is the full `InvestmentCommitteeState` (same shape the UI renders).

## 2. `POST /api/analysis/:runId/approve`

Apply a human decision to a pending run. Body:

```jsonc
{ "decision": "approved" | "rejected", "decidedBy": "axel", "note": "…" }
```

What it does:

1. Looks up the pending run by `runId`.
2. **Re-runs the deterministic risk checks** on the exact actions being
   approved. A hard block here refuses the approval (`409`).
3. On `approved`, submits the orders to **Alpaca Paper** (live) or the internal
   deterministic ledger (offline), writes the report, and returns the decision
   receipt with any Alpaca order ids. On `rejected`, nothing is applied.

Responses:

| Status | Meaning | Body |
| --- | --- | --- |
| `200` | Decision applied | `{ runId, phase: "complete", decision, appliedOrders, receipt, state }` |
| `400` | Invalid body | `{ error, issues }` |
| `404` | No such run | `{ error }` |
| `409` | Run not awaiting approval, or risk re-check hard-blocked | `{ error }` |
| `500` | Unexpected failure | `{ error }` |

## Live vs offline

Controlled by `SONAR_OFFLINE` (see `.env.example`).

- **Live (`false`):** real OpenAI committee; live Alpaca Paper read + order
  submission. Needs `OPENAI_API_KEY` and `ALPACA_*`.
- **Offline (`true`, default):** the committee is driven by the most recent
  recorded run (`fixtures/runs/*.json`, see `lib/server/runs/README.md`); orders
  apply to the internal paper ledger. No keys, no network. If no recording
  exists yet, `/run` returns `503` — record one with `pnpm record:run`.

## Known seams (data lane)

- The tradable universe, discovered evidence/graph, and market snapshot come
  from the scenario fixture. Wiring live **Cala discovery** + the **Alpaca asset
  universe** here is the remaining data-lane work.
- A live Alpaca portfolio (USD) is used only when its currency matches the
  scenario; USD-vs-EUR reconciliation is deferred to the data lane.
- The run store is **in-memory** (single process) — it bridges the two calls of
  one demo session, not a durable store.
