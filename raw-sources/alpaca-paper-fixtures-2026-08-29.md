# Alpaca Paper fixture capture

- Retrieval date: 2026-08-29
- Source: sanitized offline fixture, based on Alpaca Paper Trading wire shapes
- Endpoint shapes: `GET /v2/account`, `GET /v2/positions`, `GET /v2/assets?status=active&tradable=true`, `POST /v2/orders`

Fixture covers USD account, empty positions, three tradable assets (`NVDA`, `ASML`, `SIEGY`), one non-tradable asset, latest bid/ask quotes, two daily closes per symbol, accepted market-notional order, and rejected/non-tradable order behavior. No credential, account identifier, or personal financial data included.

Implementation: `apps/web/fixtures/alpaca-paper-account.json`, validated by `@sonar-ai/core/alpaca` and `FixtureAlpacaPaperProvider`.
