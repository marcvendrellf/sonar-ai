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
import { AlpacaPaperClient } from "../lib/server/alpaca/client";
import { getAlpacaPaperConfig } from "../lib/server/alpaca/config";
import { createOpenAIAgentRunner } from "../lib/server/analysis/runner/openai-runner";
import { DEMO_UNIVERSE, assembleLiveScenario } from "../lib/server/analysis/universe";
import { getServerEnv } from "../lib/server/env";
import { recordCommitteeRun, saveRecording } from "../lib/server/runs/record";

async function main(): Promise<void> {
  // A standalone `tsx` process does NOT auto-load .env the way `next dev` does,
  // so load it here before reading the environment. Node >= 20.12 built-in; no
  // dependency. Missing file is fine — fall back to the real environment.
  try {
    process.loadEnvFile();
  } catch {
    // No .env in cwd; rely on already-exported environment variables.
  }

  const env = getServerEnv();
  if (env.SONAR_OFFLINE) {
    console.error(
      "SONAR_OFFLINE=true — a real run is disabled. Set SONAR_OFFLINE=false and OPENAI_API_KEY, then re-run.",
    );
    process.exit(1);
  }

  // Build a live USD scenario: the watchlist filtered to names Alpaca prices,
  // a market snapshot from live quotes, and the USD paper portfolio. The Market
  // Context analyst then SELECTS its candidates from this broad watchlist.
  const client = new AlpacaPaperClient(getAlpacaPaperConfig());
  const [account, quotes] = await Promise.all([
    client.getPortfolioSnapshot(),
    client.getLatestQuotes(DEMO_UNIVERSE.map((instrument) => instrument.symbol)),
  ]);
  const state = assembleLiveScenario({ account, quotes, now: new Date().toISOString() });

  const runner = createOpenAIAgentRunner(env);
  console.error(
    `Recording a live run with model "${env.SONAR_AGENT_MODEL}"... ` +
      `watchlist=${state.candidateUniverse.length}/${DEMO_UNIVERSE.length} tradable, cash=$${account.cashUsd}`,
  );

  const recording = await recordCommitteeRun({
    state,
    userDecision: {
      decision: "approved",
      decidedAt: new Date().toISOString(),
      note: "Recorded demo run.",
    },
    runner,
    model: env.SONAR_AGENT_MODEL,
    stressScenarios: [{ name: "AI capex slowdown", marketShock: -0.2 }],
  });

  const inputTokens = recording.turns.reduce((n, t) => n + (t.usage?.inputTokens ?? 0), 0);
  const outputTokens = recording.turns.reduce((n, t) => n + (t.usage?.outputTokens ?? 0), 0);

  // Never save a blocked/empty run: it would poison the offline replay path
  // (an empty stub blocks every future offline run). Report the failure instead.
  if (recording.state.phase === "blocked" || recording.turns.length === 0) {
    const failed = recording.state.stages.find((stage) => stage.status === "failed");
    console.error(
      `Run BLOCKED — not saved. ${recording.turns.length} turns, tokens in/out=${inputTokens}/${outputTokens}.\n` +
        `Cause: ${failed?.note ?? "see the [OpenAIAgentRunner]/[CalaClient] logs above."}`,
    );
    process.exit(1);
  }

  const path = await saveRecording(recording);
  console.error(
    `Saved ${recording.turns.length} agent turns to ${path}\n` +
      `phase=${recording.state.phase}  tokens in/out=${inputTokens}/${outputTokens}`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
