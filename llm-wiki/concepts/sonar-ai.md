# Sonar AI

**Decision.** This is the selected and locked hackathon concept. See [final decision capture](../../raw-sources/final-decision-2026-08-28.md) and the [naming and monorepo decision](../../raw-sources/naming-monorepo-decision-2026-08-29.md).

The product name is **Sonar AI**. The concept was codenamed "Agent Fund" during selection; earlier captures, log entries, and the supplied visual asset keep that name.

Implementation guides: [interface plan](../interface-plan.md) and [technical reference pack](../technical-reference-pack.md)

## One-line pitch

A paper hedge fund that reads an event, traces its second-order company relationships through Cala, and reallocates itself in public.

## Why this could be the WOW concept

Most finance demos stop at "summarize this news." Sonar AI shows a complete loop:

1. observe an event;
2. trace who is connected;
3. form competing investment hypotheses;
4. test them against evidence and a risk mandate;
5. rebalance a paper portfolio;
6. publish the decision and its sources.

The memorable reveal is not the trade. It is watching one headline expand into a relationship graph and then seeing the portfolio react.

## Product fusion

- A hedge fund supplies the mandate, positions, and risk budget.
- Cala supplies source-linked news, companies, ownership, filings, ratings, and relationships where available.
- An agent supplies hypothesis generation and portfolio proposals.
- A deterministic risk engine enforces exposure, concentration, turnover, and cash limits.
- The interface behaves like a living object rather than a Bloomberg-style grid.

## Safe product boundary

The hackathon version uses paper money only. It does not connect to a broker, accept customer funds, promise returns, or give personalized investment advice.

The agent may control the simulated portfolio, but it cannot override the written mandate. Every simulated order must pass deterministic checks and cite the evidence path behind the thesis.

## The memorable reveal

A breaking-news card enters the screen. The sphere changes from idle pearl to deep blue. It begins to pulse while the words "Tracing relationships" appear.

A graph grows from the event:

`event -> company -> supplier or owner -> related issuer -> current position`

The agent finds a second-order exposure that is not named in the headline. The portfolio card tilts, the affected position contracts, another expands, and the sphere returns to a calm state. The trade ticket opens to show the thesis, counter-thesis, Cala sources, and risk checks.

## Three-minute demo

### 0:00 to 0:25

Show a €1 million paper fund with a short written mandate and five positions. The interface is quiet. One sphere represents the fund's current state.

### 0:25 to 0:50

Inject a prepared historical or synthetic news event. The sphere wakes and the event card appears.

### 0:50 to 1:25

Cala relationships unfold around the event. Highlight one company connection that is not obvious from the headline. Open the source behind the edge.

### 1:25 to 1:55

The agent presents a bull thesis, a bear thesis, confidence limits, and missing evidence. It proposes two paper orders.

### 1:55 to 2:20

The deterministic risk engine rejects or resizes one order because it violates the mandate. The accepted order animates into the portfolio.

### 2:20 to 2:45

Open the decision receipt. It contains the event, relationship path, evidence, policy checks, simulated orders, and what would invalidate the thesis.

### 2:45 to 3:00

Close with: "The agent does not trade the headline. It trades the relationships behind it."

## Visual system

Reference: [user-supplied visual](../../raw-sources/assets/agent-fund-visual-reference.png)

### Layout

Use three tall rounded panels:

1. **Fund state** shows mandate, NAV, exposure, and the sphere.
2. **Reasoning scene** shows the event and animated relationship graph.
3. **Decision receipt** shows the thesis, risk checks, and simulated orders.

Avoid a dense terminal. Show only the information needed for the current state.

### Sphere states

| State | Appearance | Motion |
| --- | --- | --- |
| Idle | Pearl or iridescent white | Slow breathing scale |
| Observing | Pale blue | Soft surface ripple |
| Tracing | Deep blue gradient | Nodes orbit and emit edges |
| Challenging | Split cool and warm light | Two counter-rotating arcs |
| Executing | Bright narrow ring | One decisive pulse |
| Blocked | Muted gray with red seam | Motion stops |
| Complete | Calm dark blue | Ring settles into position |

Animation must carry meaning. Do not add particles that do not represent an event, relationship, uncertainty, or state change.

### Typography and color

- Black and soft gray text on warm white.
- Deep navy and cyan only when the fund is active.
- Amber for review or uncertainty.
- Red only for a rejected risk check, never for ordinary market movement.
- Large editorial text for the current question or decision.

## One-day MVP

Build only:

- one paper portfolio with five prepared positions;
- one written mandate with four deterministic limits;
- one prepared news event;
- one live Cala query if the required relationship data exists;
- one cached relationship graph as fallback;
- one agent decision with bull and bear cases;
- two simulated orders;
- one rejected or resized order;
- one decision receipt;
- the seven sphere states, with only three needed in the live demo.

Do not build brokerage integration, real-time P&L infrastructure, continuous autonomous operation, tax handling, customer accounts, backtesting, or an unconstrained trading model.

## Technical flow

1. Ingest a prepared event.
2. Ask Cala for the named entity and connected companies, owners, filings, ratings, or news facts that the API actually supports.
3. Normalize facts into nodes, edges, evidence IDs, and observation dates.
4. Ask the model for bull and bear hypotheses using only those evidence IDs.
5. Convert the chosen hypothesis into target exposure changes.
6. Run the proposed orders through deterministic risk rules.
7. Update the paper portfolio and produce a decision receipt.
8. Drive the sphere and graph animations from real state transitions.

## Risk mandate for the demo

Example limits:

- maximum 30% gross exposure per position;
- maximum 45% exposure per sector;
- minimum 10% cash;
- maximum 20% turnover per event.

These are demonstration parameters, not investment recommendations.

## Failure modes

- Cala does not expose the relationship needed for the prepared event.
- The graph looks impressive but the investment link is weak.
- The model fabricates causal certainty from a simple association.
- The audience focuses on whether the trade made money rather than how it was reasoned.
- Too much animation hides the evidence.
- "Autonomous hedge fund" creates legal or safety concerns despite paper trading.

## Guardrails

- Use paper trading only.
- Label historical, synthetic, and live information clearly.
- Describe relationships as evidence, not proof of causation.
- Require sources for every graph edge and thesis claim.
- Present competing hypotheses before simulated execution.
- Keep the mandate and risk checks deterministic.
- Show what evidence would invalidate the thesis.

## Go or no-go test

Proceed only if Cala can return a useful, sourced relationship between the event entity and at least one company or current position. If Cala returns only isolated news summaries, the concept loses its reason to exist.
