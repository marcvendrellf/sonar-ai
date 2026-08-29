/**
 * Record one real committee run for the demo.
 *
 * The live flow makes several GPT-5 calls and can exceed the two-minute demo
 * window, so we capture a run ahead of time and replay it during the demo. This
 * script fires ONE real run and writes the transcript + final state to
 * apps/web/fixtures/runs/<runId>.json.
 *
 * Prerequisites (see apps/web/lib/server/runs/README.md):
 *   SONAR_OFFLINE=false  OPENAI_API_KEY=sk-...  [SONAR_AGENT_MODEL=gpt-5]
 *
 * Run from apps/web:  pnpm record:run
 */
import type { InvestmentCommitteeState } from "@sonar-ai/core";
// Demo input scenario. Swap for a dedicated fixtures/scenario once one exists;
// for now the core golden fixture supplies a realistic idle state + evidence.
import { goldenState } from "../../../packages/core/src/__fixtures__/golden-state";
import { createOpenAIAgentRunner } from "../lib/server/analysis/runner/openai-runner";
import { getServerEnv } from "../lib/server/env";
import { recordCommitteeRun, saveRecording } from "../lib/server/runs/record";
import { resetToIdle } from "../lib/server/runs/recording";

async function main(): Promise<void> {
  const env = getServerEnv();
  if (env.SONAR_OFFLINE) {
    console.error(
      "SONAR_OFFLINE=true — a real run is disabled. Set SONAR_OFFLINE=false and OPENAI_API_KEY, then re-run.",
    );
    process.exit(1);
  }

  const runner = createOpenAIAgentRunner(env);
  console.error(`Recording a live run with model "${env.SONAR_AGENT_MODEL}"...`);

  const recording = await recordCommitteeRun({
    state: resetToIdle(goldenState as InvestmentCommitteeState),
    userDecision: {
      decision: "approved",
      decidedAt: new Date().toISOString(),
      note: "Recorded demo run.",
    },
    runner,
    model: env.SONAR_AGENT_MODEL,
    instrumentStats: {
      inst_nvidia: { volatility: 0.2, beta: 1.4 },
      inst_siemens: { volatility: 0.1, beta: 0.9 },
    },
    stressScenarios: [{ name: "AI capex slowdown", marketShock: -0.2 }],
  });

  const path = await saveRecording(recording);
  const inputTokens = recording.turns.reduce((n, t) => n + (t.usage?.inputTokens ?? 0), 0);
  const outputTokens = recording.turns.reduce((n, t) => n + (t.usage?.outputTokens ?? 0), 0);
  console.error(
    `Saved ${recording.turns.length} agent turns to ${path}\n` +
      `phase=${recording.state.phase}  tokens in/out=${inputTokens}/${outputTokens}`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
