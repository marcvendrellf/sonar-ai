# Open questions

Only unresolved implementation and event questions remain. Concept selection is closed.

## Must close before agent implementation

| Question | Next action | Closure condition |
| --- | --- | --- |
| Which deterministic portfolio metrics are required for first demo? | Implement volatility, beta, sector exposure, concentration, stress test, and current-versus-proposed comparison against one fixture. | Risk Officer can explain one hard block with reproducible numbers. |

## Must close before live Cala demo

| Question | Next action | Closure condition |
| --- | --- | --- |
| What entities, relationships, timestamps, and source fields does Cala return? | Run one public-company query with the event credential. | Save a sanitized request, response fixture, and normalized field map. |
| Can Cala connect one prepared event to a second-order public company or paper position? | Test a historical or synthetic event and inspect every edge. | Preserve one useful event-to-entity-to-company path with evidence IDs. |
| How fresh is each Cala source? | Inspect observation times and source cadence. | Label the demo as live, historical replay, or synthetic without ambiguity. |
| Can research support Portfolio Manager proposal and Bear/Critic challenge from one fixture? | Ask Fundamental, Market Context, Portfolio Manager, and Bear/Critic to use shared evidence IDs. | Proposal and critique cite evidence and state what would invalidate them. |

## Must close before Alpaca integration

| Question | Next action | Closure condition |
| --- | --- | --- |
| Which Alpaca Trading API interface should Sonar use? | Use the regular Trading API with a Paper Only account. | Server adapter uses separate paper credentials and fixed `paper-api.alpaca.markets` endpoint. ✅ |
| Which instruments fit Alpaca's supported universe? | Select U.S.-listed equities or supported crypto and validate with the assets endpoint. | Initial fixture has three tradable symbols with stable wire shapes; expand to final demo universe after live Paper validation. |
| How should paper-account resets work during trials? | Reset by creating/deleting paper accounts in the Alpaca dashboard; add a local Sonar reset separately. | No reset action can reach a live account or silently delete broker state. |
| Can any code path reach live trading? | Add an architectural test around the fixed Paper client and environment guard. | No live endpoint, live credential, deposit, withdrawal, or account-control path exists. |
| Is Alpaca Paper available from Spain? | Use official Alpaca paper-trading documentation. | **Closed 2026-08-29:** Alpaca documents Paper Only accounts globally; paper endpoint and credentials are separate from live. |
| Which assets can Alpaca Paper trade? | Choose five U.S.-listed or supported crypto candidates. | Official docs state listed U.S. stocks and select crypto; current EU tickers need replacement. |
| Can Alpaca Paper reflect account, positions, and orders? | Run one sanitized paper test. | Save account, positions, order response, and normalized field map. |
| Can any code path reach live trading? | Fix base URL and require paper config. | Client has no live base URL; config rejects `ALPACA_PAPER_TRADE !== true`; add architectural test. |

## Must close before UI implementation

| Question | Next action | Closure condition |
| --- | --- | --- |
| How will ongoing searches deliver new findings? | Define the typed finding record and compare bounded polling with server-sent events behind the server boundary. | The bell receives deduplicated evidence-linked records with stable IDs and data-mode labels, and the same flow works from an offline fixture. |

## Must close before demo lock

| Question | Next action | Closure condition |
| --- | --- | --- |
| Which five-asset candidate universe and material event produce a clear allocation reveal? | Test candidate fixtures against Cala coverage and reputational risk. | Freeze one €1,000 all-cash baseline, five candidates, and one sourced relationship path. |
| What official judging criteria and demo duration apply? | Ask an organizer or check the event Discord. | Record the exact wording and adjust the three-minute script. |
| How should Josep and Axel split the agent and data lane, and who owns shared areas? | Assign one person to each agent issue plus Cala, Alpaca, `packages/core`, risk engine, fixtures, deployment, and pitch. | Every implementation area and open issue has one named owner. |
| Does the entire demo work without network access? | Run the production build in fixture mode. | Complete onboarding through decision receipt offline. |

## Closed questions

- **What is the final fund name?** Closed 2026-08-29: the product is named Sonar AI (see the [naming and monorepo decision](../raw-sources/naming-monorepo-decision-2026-08-29.md)). Applying the name to onboarding copy and page metadata is part of scaffold work.
- **Is trading real or simulated?** Closed 2026-08-29: paper money only. Alpaca is restricted to its Paper endpoint. Sonar never submits real-money orders.
- **What are the primary team lanes?** Closed 2026-08-29: Marc owns frontend work; Josep and Axel focus mainly on agents and data.
- **What is MVP agent topology?** Closed 2026-08-29 from the supplied architecture recommendation: one code-owned orchestrator, five decision agents (Portfolio Manager, Fundamental Analyst, Market Context Analyst, Risk Officer, Bear/Critic), human approval, then post-decision Communications/Report Writer. Cala relationship tracing is a research capability; Trader is deterministic paper-ledger code.
- **Which model runtime and structured-output method do agents use?** Closed 2026-08-29: official OpenAI TypeScript SDK with Responses API `responses.parse()` and Zod-derived structured formats. `SONAR_AGENT_MODEL` selects the deployed model. Timeout, token cap, exact runner-owned retry count, stage-local tool allowlists, and total tool calls are bounded; SDK retries and model-controlled routing remain disabled.
- **Should Sonar expose Cala MCP directly?** Closed 2026-08-29: no. Official Cala MCP capabilities are useful, but its dynamic schemas conflict with strict function tools. Sonar uses the fixed server-side REST API and exposes strict entity, query, search, profile, fundamentals, and bounded-traversal tools.
- **Is trading real or simulated?** Closed 2026-08-29: Alpaca Paper only. Sonar never submits real-money orders.
- **What are the primary team lanes?** Closed 2026-08-29: Marc owns frontend work; Josep and Axel focus mainly on agents and data.
- **What is MVP agent topology?** Closed 2026-08-29 from the supplied architecture recommendation: one code-owned orchestrator, five decision agents (Portfolio Manager, Fundamental Analyst, Market Context Analyst, Risk Officer, Bear/Critic), human approval, then post-decision Communications/Report Writer. Cala relationship tracing is a research capability; Trader is deterministic paper-ledger code.
- **How will the three UI surfaces continue in parallel?** Closed 2026-08-29: checkpoint the unified UI on `main`, then use `feat/onboarding-polish`, `feat/dashboard-polish`, and `feat/saloon-polish` with one writer and explicit shared-file coordination.
- **Does Base UI `base-nova` work with the selected registries?** Closed 2026-08-29: the scaffold, application-shell block, selected third-party registry items, and required primitives compile with the Base UI preset.
- **Which local clay-style shell and soft-light configuration meet the Saloon reference?** Closed 2026-08-29: the room is one original `saloon-shell.glb` of cutaway clay architecture with four flat matte materials, one broad warm key, a weak hemisphere fill, one subdued local environment, and a shadow accumulated over 60 frames. It loads offline, keeps all six orbs selectable in both camera modes, and passes the production build. Presentation-laptop confirmation is still outstanding. See the [asset provenance](../raw-sources/saloon-asset-provenance-2026-08-29.md).
- **Custom faceless spheres or Live Orb for the Saloon?** Closed 2026-08-29: retain the six custom shared-canvas agent orbs and their current state behavior. Replace the room shell and lighting instead. Live Orb remains limited to a single onboarding fallback.
- **Will `@abui/animated-chart` force an incompatible Motion version?** Closed 2026-08-29: the workspace has one Motion 12 dependency, the adapted chart supports reduced motion and stable agent IDs, and the production build passes.

## Current blockers

- No Cala event credential or sanitized live API fixture exists; current fallback is synthetic.
- No verified live event-to-company graph exists; current second-order path is synthetic.
- No final event or asset universe is recorded.
- No final Alpaca-supported five-asset universe or sanitized order fixture is recorded.
- Alpaca Paper execution requires USD portfolio currency; live route now rejects missing/non-USD mandates. Account/position-to-core mapping remains open.
- No sanitized Alpaca account, positions, or order fixture is recorded.
- The Josep and Axel issue split and owners for Cala, Alpaca, contracts, risk, fixtures, deployment, and pitch are not recorded.
- No organizer-provided judging rubric is recorded.
- The clay Saloon room has not been judged on the presentation laptop.
