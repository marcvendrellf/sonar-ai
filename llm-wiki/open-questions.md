# Open questions

Only unresolved implementation and event questions remain. Concept selection is closed.

## Must close before Cala integration

| Question | Next action | Closure condition |
| --- | --- | --- |
| What entities, relationships, timestamps, and source fields does Cala return? | Run one public-company query with the event credential. | Save a sanitized request, response fixture, and normalized field map. |
| Can Cala connect one prepared event to a second-order public company or paper position? | Test a historical or synthetic event and inspect every edge. | Preserve one useful event-to-entity-to-company path with evidence IDs. |
| How fresh is each Cala source? | Inspect observation times and source cadence. | Label the demo as live, historical replay, or synthetic without ambiguity. |
| Can the same claim support both a bull and bear interpretation? | Ask Analyst and Skeptic to reason from one fixture. | Both cases cite evidence and state what would invalidate them. |

## Must close before eToro integration

| Question | Next action | Closure condition |
| --- | --- | --- |
| Which official eToro interface can the event project use? | Review official documentation or event instructions before coding. | Record the supported authentication, endpoints, limits, and permitted use. |
| Does eToro expose market data, virtual-portfolio data, or a paper-order API? | Run one sanitized read-only test. | Save a response fixture and state exactly which capability is verified. |
| How do eToro instruments map to the five paper positions? | Normalize one small symbol set in `packages/core`. | Every demo position has a stable instrument ID, currency, timestamp, and fixture price. |
| Can any code path submit or prepare a live order? | Review the adapter and add an architectural test. | The eToro client exposes no order, deposit, withdrawal, or account-control method. |

## Must close before UI implementation

| Question | Next action | Closure condition |
| --- | --- | --- |
| Primary faceless sphere or minimal Live Orb? | Prototype the three required states on the presentation laptop. | Pick the option that stays smooth beside Shader Gradient and React Flow. |

## Must close before demo lock

| Question | Next action | Closure condition |
| --- | --- | --- |
| Which event and five paper positions produce a clear relationship reveal? | Test candidate fixtures against Cala coverage and reputational risk. | Freeze one event, five positions, and one second-order exposure. |
| What official judging criteria and demo duration apply? | Ask an organizer or check the event Discord. | Record the exact wording and adjust the three-minute script. |
| How should Josep and Axel split the agent and data lane, and who owns shared areas? | Assign one person to each agent issue plus Cala, eToro, `packages/core`, risk engine, fixtures, deployment, and pitch. | Every implementation area and open issue has one named owner. |
| Does the entire demo work without network access? | Run the production build in fixture mode. | Complete onboarding through decision receipt offline. |

## Closed questions

- **What is the final fund name?** Closed 2026-08-29: the product is named Sonar AI (see the [naming and monorepo decision](../raw-sources/naming-monorepo-decision-2026-08-29.md)). Applying the name to onboarding copy and page metadata is part of scaffold work.
- **Is trading real or simulated?** Closed 2026-08-29: paper money only. eToro is read-only unless an official paper-trading interface is verified. Sonar never submits real-money orders.
- **What are the primary team lanes?** Closed 2026-08-29: Marc owns frontend work; Josep and Axel focus mainly on agents and data.
- **Does Base UI `base-nova` work with the selected registries?** Closed 2026-08-29: the scaffold, application-shell block, selected third-party registry items, and required primitives compile with the Base UI preset.
- **Will `@abui/animated-chart` force an incompatible Motion version?** Closed 2026-08-29: the workspace has one Motion 12 dependency, the adapted chart supports reduced motion and stable agent IDs, and the production build passes.

## Current blockers

- No Cala credential or API fixture exists.
- No verified event-to-company graph exists.
- No final event or asset universe is recorded.
- No official eToro capability or sanitized market-data fixture is recorded.
- The Josep and Axel issue split and owners for Cala, eToro, contracts, risk, fixtures, deployment, and pitch are not recorded.
- No organizer-provided judging rubric is recorded.
