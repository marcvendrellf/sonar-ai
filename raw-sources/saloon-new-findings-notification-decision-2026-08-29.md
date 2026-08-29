# Saloon new-findings notification decision

- Date: 2026-08-29
- Source: direct user decision in the project session
- Status: current frontend and agent-behavior direction

## Decision

The Saloon has one notification bell at the bottom-right of the agent scene. It reports the newest findings from agents as they continue searching.

The bell is a global control for the Saloon, not one bell per agent. It opens a newest-first list of findings. Each finding must identify the agent, source, observation time, and the evidence, relationship, thesis, or risk state it changes.

Continuous searching must not create filler notifications. A search attempt is not a finding. The system notifies the user only when an agent adds source-backed information or changes a material state.

## Hackathon boundary

The product direction supports continuous search. The hackathon demo may replay bounded, source-linked fixture findings instead of running an uncontrolled background loop. Live, historical, synthetic, and fixture findings must remain labeled.

A new finding never bypasses the deterministic mandate or submits a real order. It can trigger another analysis and paper-trading decision cycle.
