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
# Alpaca paper-trading verification

- Source type: official Alpaca documentation
- Retrieved: 2026-08-29
- URLs:
  - https://docs.alpaca.markets/us/docs/paper-trading
  - https://docs.alpaca.markets/us/v1.1/docs/authentication-1
  - https://docs.alpaca.markets/us/reference/getaccount-1
  - https://docs.alpaca.markets/us/reference/getallopenpositions
  - https://docs.alpaca.markets/us/reference/postorder
  - https://docs.alpaca.markets/us/docs/account-plans

## Observed official capabilities

- Alpaca documents free Paper Trading for all users and says anyone globally can create a Paper Only Account.
- Paper trading uses separate credentials and the fixed paper API domain `https://paper-api.alpaca.markets`.
- Trading API v2 uses `APCA-API-KEY-ID` and `APCA-API-SECRET-KEY` headers.
- Paper account endpoints include `GET /v2/account`, `GET /v2/positions`, and `POST /v2/orders`.
- Paper trading simulates order fills using real-time quotes; orders are not routed to a live exchange.
- Default paper account balance is documented as $100,000 and can be reset or recreated from the dashboard.
- Alpaca documents current trading support as listed U.S. stocks and select cryptocurrencies. This does not cover Sonar's existing EU-listed candidate symbols.

## Sonar decision

Alpaca is the sole brokerage adapter. Sonar uses a Paper Only Account, fixed paper endpoint, separate paper credentials, and human approval before order submission. Live endpoint, live credentials, transfers, and withdrawals are outside scope.

## Verification status

Paper availability and endpoint behavior are verified from official docs. A sanitized account, positions, and order response still require a team-owned Paper Only Account. No credential is stored here.
