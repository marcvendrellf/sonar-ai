import "server-only";

import { normalizeAlpacaPaperPortfolio, type AlpacaPaperPortfolioSnapshot } from "@sonar-ai/core/alpaca";
import type { InvestmentCommitteeState } from "@sonar-ai/core";
import type { InstrumentStats, StressScenario } from "@sonar-ai/risk-engine";

import alpacaFixture from "@/fixtures/alpaca-paper-account.json";
// The golden fixture stands in as the discovery SCENARIO (universe + evidence +
// graph + market snapshot) until live Cala discovery + the Alpaca asset universe
// are wired in. See `build-state.ts`.
import { goldenState } from "../../../../../packages/core/src/__fixtures__/golden-state";
import type { ServerEnv } from "../env";
import { AlpacaPaperClient } from "../alpaca/client";
import { getAlpacaPaperConfig } from "../alpaca/config";
import { loadLatestRecording } from "../runs/record";
import { recordingToStubOutputs } from "../runs/recording";
import { createOpenAIAgentRunner } from "./runner/openai-runner";
import { StubAgentRunner } from "./runner/stub-runner";
import type { AgentRunner } from "./runner/types";
import type { AlpacaExecutor } from "./service";

/** Demo risk stats for the golden universe. Not real market data. */
export const DEMO_INSTRUMENT_STATS: InstrumentStats = {
  inst_nvidia: { volatility: 0.2, beta: 1.4 },
  inst_asml: { volatility: 0.18, beta: 1.3 },
  inst_siemens: { volatility: 0.1, beta: 0.9 },
  inst_vestas: { volatility: 0.22, beta: 1.1 },
  inst_sp500: { volatility: 0.08, beta: 1.0 },
};

export const DEMO_STRESS_SCENARIOS: readonly StressScenario[] = [
  { name: "AI capex slowdown", marketShock: -0.2 },
];

/**
 * Raised when a real run is requested offline but no recording exists to drive
 * the committee. Routes map this to 503 — record a run first, or go live.
 */
export class NoRecordingError extends Error {
  constructor() {
    super(
      "Offline mode needs a recorded run to drive the committee, but none was found. " +
        "Record one (`pnpm record:run` with a key) or set SONAR_OFFLINE=false.",
    );
    this.name = "NoRecordingError";
  }
}

export interface RunPlan {
  runner: AgentRunner;
  scenario: InvestmentCommitteeState;
  instrumentStats?: InstrumentStats;
  stressScenarios?: readonly StressScenario[];
  label: InvestmentCommitteeState["run"]["label"];
}

/**
 * Choose how a run executes from the environment:
 *  - LIVE (`SONAR_OFFLINE=false`): the real OpenAI committee over the discovery
 *    scenario, with the demo risk stats.
 *  - OFFLINE: a deterministic stub runner driven by the most recent recording —
 *    the committee still runs through every gate, but the agent outputs are the
 *    recorded ones, so it needs no API key. The recording's own state is the
 *    scenario, so discovery/research stay consistent with the recorded outputs.
 */
export async function resolveRunPlan(env: ServerEnv): Promise<RunPlan> {
  if (!env.SONAR_OFFLINE) {
    return {
      runner: createOpenAIAgentRunner(env),
      scenario: goldenState as InvestmentCommitteeState,
      instrumentStats: DEMO_INSTRUMENT_STATS,
      stressScenarios: DEMO_STRESS_SCENARIOS,
      label: "live",
    };
  }

  const recording = await loadLatestRecording();
  if (!recording) throw new NoRecordingError();
  return {
    runner: new StubAgentRunner(recordingToStubOutputs(recording)),
    scenario: recording.state,
    ...(recording.instrumentStats ? { instrumentStats: recording.instrumentStats } : {}),
    ...(recording.stressScenarios ? { stressScenarios: recording.stressScenarios } : {}),
    label: "historical",
  };
}

/**
 * Load the Alpaca Paper account + positions: the fixture snapshot offline, the
 * live paper account when online. Never touches live trading — read-only.
 */
export async function loadAlpacaSnapshot(env: ServerEnv): Promise<AlpacaPaperPortfolioSnapshot> {
  if (env.SONAR_OFFLINE) {
    return normalizeAlpacaPaperPortfolio(alpacaFixture.account, alpacaFixture.positions, {
      source: "fixture",
      observedAt: "2026-08-29T10:00:00Z",
    });
  }
  return new AlpacaPaperClient(getAlpacaPaperConfig()).getPortfolioSnapshot();
}

/**
 * The Alpaca order executor used at approval, or `undefined` offline (the
 * internal deterministic paper ledger applies actions instead).
 */
export function resolveAlpacaExecutor(env: ServerEnv): AlpacaExecutor | undefined {
  if (env.SONAR_OFFLINE) return undefined;
  return new AlpacaPaperClient(getAlpacaPaperConfig());
}
