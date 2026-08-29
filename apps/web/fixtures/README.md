# `fixtures` — the offline demo path

Sanitized, labeled fixtures that let the entire flow run with the network off.
`isOffline()` (default) forces every adapter here.

Planned contents:

- `scenario.json` — the frozen demo inputs: the €1,000 all-cash portfolio, the
  mandate, the five-asset candidate universe, and the material event.
- `cala/*.json` — sanitized Cala response(s) + the normalized field map.
- `alpaca-paper-account.json` — sanitized Alpaca Paper account and positions snapshot.
- `committee/golden-run.json` — a full recorded `InvestmentCommitteeState` that
  drives `StubAgentRunner` and integration tests.

The canonical reference committee run already exists in code as
[`@sonar-ai/core`'s golden fixture](../../../packages/core/src/__fixtures__/golden-state.ts);
the JSON fixtures here are its sanitized, on-disk counterparts.

Rules: never store real API keys, private attendee data, or personal financial
data. Everything is labeled `live`, `historical`, or `synthetic`.
