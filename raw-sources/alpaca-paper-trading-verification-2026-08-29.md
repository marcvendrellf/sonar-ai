# Alpaca Paper Trading verification

- Source type: official Alpaca documentation
- Retrieved: 2026-08-29
- Scope: Paper Trading account access, authentication, portfolio reads, and order endpoint

## Sources

- https://docs.alpaca.markets/us/docs/getting-started-with-trading-api
- https://docs.alpaca.markets/us/v1.1/docs/authentication-1
- https://docs.alpaca.markets/us/docs/paper-trading
- https://docs.alpaca.markets/us/reference/getaccount-1
- https://docs.alpaca.markets/us/reference/getallopenpositions
- https://docs.alpaca.markets/us/reference/postorder

## Verified facts

- Alpaca Paper Only accounts are globally available.
- Paper accounts use separate credentials and the `https://paper-api.alpaca.markets` endpoint.
- Trading API requests use `APCA-API-KEY-ID` and `APCA-API-SECRET-KEY` headers.
- Account and open-position reads use `/v2/account` and `/v2/positions`.
- Paper orders use `/v2/orders` and are simulated against market data.
- The dashboard currently resets by creating a new paper account and deleting the old one; new accounts require new API keys.
- Paper trading is a simulation and does not reproduce every live-market condition.

## Sonar decision

Use Alpaca Trading API with Paper credentials for the single Sonar portfolio. Keep credentials server-only. Hard-code the Paper endpoint in the adapter. Require evidence validation, deterministic risk checks, and explicit human approval before any paper order. Keep a sanitized offline fixture path.

## Unverified or open

- Final Alpaca-supported five-asset candidate universe.
- Sanitized live-shaped order response fixture.
- Local Sonar reset behavior that clears internal run state without deleting the Alpaca account.

No credentials or personal account data are stored in this capture.
