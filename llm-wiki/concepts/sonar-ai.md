# Sonar AI

**Decision.** This is the selected and locked hackathon concept. See [final decision capture](../../raw-sources/final-decision-2026-08-28.md), the [naming and monorepo decision](../../raw-sources/naming-monorepo-decision-2026-08-29.md), the [MVP agent-structure direction](../../raw-sources/agent-structure-mvp-direction-2026-08-29.md), and the [cash-only MVP direction](../../raw-sources/cash-only-mvp-direction-2026-08-29.md).

The product name is **Sonar AI**. The concept was codenamed "Agent Fund" during selection; earlier captures, log entries, and the supplied visual asset keep that name.

Implementation guides: [interface plan](../interface-plan.md) and [technical reference pack](../technical-reference-pack.md)

## One-line pitch

A paper hedge fund that reads an event, traces its second-order company relationships through Cala, and proposes explainable allocations for human approval.

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
- An Alpaca paper adapter supplies market, portfolio, and order data through its fixed paper endpoint.
- A Portfolio Manager agent owns capital allocation and proposal revision.
- Fundamental Analyst and Market Context Analyst own separate research domains.
- Risk Officer calls deterministic analytics and can hard-block mandate violations.
- Bear/Critic attacks surviving proposals but cannot veto them.
- Communications/Report Writer runs after human decision and cannot influence allocation.
- A deterministic risk engine enforces exposure, concentration, turnover, and cash limits.
- The interface behaves like a living object rather than a Bloomberg-style grid.

## Safe product boundary

The hackathon version uses paper money only. It submits approved orders only to Alpaca's paper environment. It does not accept customer funds, promise returns, or give personalized investment advice.

Agents propose; human approves. No agent can override written mandate. Every paper order must pass deterministic checks and cite evidence path behind thesis. Alpaca live endpoints and live credentials are forbidden.

## The memorable reveal

A portfolio review enters screen. Sphere changes from idle pearl to deep blue. It begins to pulse while research stages inspect relevant relationships.

A graph grows from the event:

`event -> company -> supplier or owner -> related issuer -> current position`

Research finds a second-order exposure that is not obvious in portfolio view. Risk comparison and Bear/Critic challenge proposal. After human approval, affected position contracts, another expands, and sphere returns to calm state. Receipt shows thesis, counter-thesis, Cala sources, risk checks, and approval.

## Three-minute demo

### 0:00 to 0:25

Show a €1,000 paper portfolio held entirely in cash, mandate, and a small candidate universe. The interface is quiet. One sphere represents fund state.

### 0:25 to 0:45

Ask: `I have €1,000 to invest. What should I do?` Sphere wakes and portfolio review appears.

### 0:45 to 1:20

Portfolio Manager selects candidates. Fundamental and Market Context agents inspect assets and Cala relationships. Highlight one sourced relationship that changes portfolio context.

### 1:20 to 1:45

Risk Officer compares current and proposed portfolio. Show concentration, beta, volatility, and stress result. Hard-block one invalid action.

### 1:45 to 2:10

Bear/Critic attacks strongest remaining recommendation. Portfolio Manager revises allocation with evidence, confidence, and failure conditions.

### 2:10 to 2:35

Open current-versus-proposed comparison. Show two paper allocation actions and remaining cash. Human approves or rejects recommendation.

### 2:35 to 3:00

Apply approved paper action, open decision receipt, and show Report Writer output. Close with: "The agent does not trade the headline. It trades the relationships behind it."

## Visual system

Reference: [user-supplied visual](../../raw-sources/assets/agent-fund-visual-reference.png)

### Layout

Use three tall rounded panels:

1. **Fund state** shows mandate, NAV, exposure, and the sphere.
2. **Reasoning scene** shows the event and animated relationship graph.
3. **Decision receipt** shows recommendation, risk checks, approval, paper actions, and report.

Avoid a dense terminal. Show only the information needed for the current state.

### Sphere states

| State | Appearance | Motion |
| --- | --- | --- |
| Idle | Pearl or iridescent white | Slow breathing scale |
| Observing | Pale blue | Soft surface ripple |
| Tracing | Deep blue gradient | Nodes orbit and emit edges |
| Challenging | Split cool and warm light | Two counter-rotating arcs |
| Awaiting approval | Deep blue with amber ring | Motion holds for human decision |
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

- one €1,000 paper portfolio initialized at 100% cash;
- one five-asset candidate universe for research;
- one written mandate with four deterministic limits;
- one prepared portfolio-review scenario and material event;
- one live Cala query if the required relationship data exists;
- one Alpaca paper portfolio query;
- cached Cala graph and Alpaca market-data fixtures as fallbacks;
- five decision agents: Portfolio Manager, Fundamental Analyst, Market Context Analyst, Risk Officer, and Bear/Critic;
- one post-decision Communications/Report Writer;
- one Portfolio Manager recommendation with structured bull/context/bear evidence;
- one current-versus-proposed portfolio comparison;
- one human approval step;
- two paper allocation actions;
- one rejected or resized action;
- one decision receipt;
- the sphere states needed for research, challenge, approval, block, and completion; only three need live-demo polish.

Do not build agent swarms, brokerage order integration, real-time P&L infrastructure, continuous autonomous operation, tax handling, customer accounts, backtesting, price forecasting, reinforcement learning, multiple MCP servers, distributed services, or an unconstrained trading model.

## Technical flow

1. Code-owned orchestrator loads portfolio, mandate, existing theses, and prepared scenario.
2. Fundamental Analyst researches selected assets using isolated company evidence and Cala relationship tools.
3. Market Context Analyst researches relevant news, sector, macro, competitors, regulation, and events.
4. Portfolio Manager proposes allocation from structured research and current portfolio state.
5. Risk Officer runs deterministic metrics and hard-blocks invalid actions.
6. Bear/Critic attacks surviving recommendation.
7. Portfolio Manager revises recommendation.
8. Human approves or rejects paper action.
9. Trader applies approved action internally; Report Writer generates narrative after decision.
10. Drive sphere, graph, and receipt from typed stage transitions.

For hackathon MVP, agents receive isolated context and structured state, not giant prompts or free-form transcripts. No autonomous loop, agent swarm, or live order tool exists. This preserves visible committee reasoning while keeping replay and debugging deterministic.

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
- Keep Alpaca fixed to paper trading and require human approval before every order.
- Label historical, synthetic, and live information clearly.
- Describe relationships as evidence, not proof of causation.
- Require sources for every graph edge and thesis claim.
- Present competing hypotheses before simulated execution.
- Keep the mandate and risk checks deterministic.
- Show what evidence would invalidate the thesis.

## Go or no-go test

Proceed only if Cala can return a useful, sourced relationship between the event entity and at least one company or current position. If Cala returns only isolated news summaries, the concept loses its reason to exist.
