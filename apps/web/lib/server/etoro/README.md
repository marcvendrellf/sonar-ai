# `etoro` — market data (READ-ONLY)

The **only** place eToro is called, and it is strictly read-only. This module
**must expose no order, deposit, withdrawal, or account-control method** — an
architectural test asserts this in Phase 4. Sonar simulates every order
internally; eToro is data in, never instructions out.

Planned files:

- `client.ts` — read-only fetch (`ETORO_API_BASE`, `ETORO_API_KEY`,
  `ETORO_TIMEOUT_MS`). Falls back to the fixture on timeout/error or when
  `isOffline()`.
- `normalize.ts` — raw eToro → core `MarketSnapshot` / `PriceHistory`, with a
  stable instrument id, currency, timestamp, and `live|historical|synthetic` label.

Status: the official eToro interface is **not yet verified** (see
`llm-wiki/open-questions.md`). Until it is, keep `SONAR_OFFLINE=true` and serve
the price fixture.
