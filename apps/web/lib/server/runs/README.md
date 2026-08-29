# `runs` — record & replay for the demo

A live committee run makes several GPT-5 calls and can exceed the two-minute
demo window. So we **record a real run once, ahead of time**, and **replay it**
during the demo — never running live in front of the audience.

A recording captures both halves of "what each agent did":

- **what** — every agent's structured output (the draft), and the full final
  `InvestmentCommitteeState`;
- **the conversation** — the exact instructions + prompt each agent was sent,
  plus token usage and timing per turn.

## Record a real run

From `apps/web`, with a key in the environment:

```bash
SONAR_OFFLINE=false OPENAI_API_KEY=sk-... SONAR_AGENT_MODEL=gpt-5 pnpm record:run
```

This fires one real run (research → PM proposal → risk → bear → PM revision →
auto-approval → report), then writes the transcript + final state to
`apps/web/fixtures/runs/<runId>.json`. Commit that JSON — it is the demo
artifact the whole team replays.

Nothing secret is stored: API keys never appear in a prompt, and the inputs are
the (synthetic, labeled) scenario evidence. The Risk Officer is deterministic,
so it has no model turn in the transcript.

## Replay a recording (offline, no key)

```ts
import { loadRecording, replayRecording } from "@/lib/server/runs/record";

const recording = await loadRecording("fixtures/runs/<runId>.json");
const state = await replayRecording(recording); // === recording.state, reproduced offline
```

`replayRecording` feeds the recorded outputs back through the `StubAgentRunner`,
so the orchestrator reproduces the exact same state deterministically — no
network, no model. The stored `instrumentStats` / `stressScenarios` make the
replay fully self-contained. For a pure display, the frontend can also read
`recording.state` directly.

## Pieces

| File | Role |
| --- | --- |
| `recording.ts` | `RunRecording` / `AgentTurn` schemas, the `RecordingAgentRunner` wrapper, `recordingToStubOutputs`, `resetToIdle`. |
| `record.ts` | `recordCommitteeRun`, `replayRecording`, `saveRecording`, `loadRecording`. |
| `../../../scripts/record-run.ts` | the `pnpm record:run` entrypoint. |

The `RecordingAgentRunner` wraps any `AgentRunner` without changing its
behavior, so the same recorder captures a real OpenAI run or a stub run.
