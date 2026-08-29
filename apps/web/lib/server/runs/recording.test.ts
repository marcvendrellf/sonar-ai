import type { InvestmentCommitteeState, UserDecision } from "@sonar-ai/core";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { goldenState } from "../../../../../packages/core/src/__fixtures__/golden-state";
import { StubAgentRunner } from "../analysis/runner/stub-runner";
import {
  loadRecording,
  recordCommitteeRun,
  replayRecording,
  saveRecording,
} from "./record";
import { resetToIdle } from "./recording";

const DECISION: UserDecision = {
  decision: "approved",
  decidedAt: "2026-08-29T14:05:20Z",
  note: "Approved the resized allocation.",
};

function goldenStubRunner(): StubAgentRunner {
  const bearCase = structuredClone(goldenState.bearCase!);
  bearCase.targetRecommendationId = goldenState.proposal!.id;
  return new StubAgentRunner({
    fundamental_analyst: goldenState.fundamentalReports,
    market_context: goldenState.marketContext!,
    portfolio_manager: [goldenState.proposal!, goldenState.finalRecommendation!],
    bear_critic: bearCase,
    report_writer: goldenState.report!,
  });
}

function counterClock() {
  let n = 0;
  return () => `2026-08-29T15:00:${String(n++).padStart(2, "0")}Z`;
}

async function record(): Promise<Awaited<ReturnType<typeof recordCommitteeRun>>> {
  return recordCommitteeRun({
    state: resetToIdle(goldenState as InvestmentCommitteeState),
    selectedInstrumentIds: ["inst_nvidia", "inst_siemens"],
    userDecision: DECISION,
    runner: goldenStubRunner(),
    model: "stub",
    instrumentStats: {
      inst_nvidia: { volatility: 0.2, beta: 1.4 },
      inst_siemens: { volatility: 0.1, beta: 0.9 },
    },
    stressScenarios: [{ name: "AI capex slowdown", marketShock: -0.2 }],
    clock: counterClock(),
  });
}

describe("run recording + replay", () => {
  it("captures a turn per agent call (research, PM twice, bear, writer)", async () => {
    const recording = await record();
    expect(recording.state.phase).toBe("complete");

    const stages = recording.turns.map((t) => t.stage);
    // Two fundamentals (per instrument), one market, PM proposal + revision,
    // bear, writer. Risk Officer is deterministic — no model turn.
    expect(stages).toEqual([
      "fundamental_analyst",
      "fundamental_analyst",
      "market_context",
      "portfolio_manager",
      "bear_critic",
      "portfolio_manager",
      "report_writer",
    ]);
    // The Portfolio Manager's two calls are indexed 0 (proposal) and 1 (revision).
    const pm = recording.turns.filter((t) => t.stage === "portfolio_manager");
    expect(pm.map((t) => t.callIndex)).toEqual([0, 1]);
  });

  it("captures the conversation: instructions + prompt for every turn", async () => {
    const recording = await record();
    for (const turn of recording.turns) {
      expect(turn.instructions.length).toBeGreaterThan(0);
      expect(turn.input.length).toBeGreaterThan(0);
      expect(turn.output).toBeDefined();
    }
  });

  it("round-trips through disk unchanged", async () => {
    const recording = await record();
    const dir = await mkdtemp(join(tmpdir(), "sonar-runs-"));
    const path = await saveRecording(recording, dir);
    expect(path.endsWith(`${recording.runId}.json`)).toBe(true);
    const loaded = await loadRecording(path);
    expect(loaded).toEqual(recording);
  });

  it("replays offline to the exact recorded state", async () => {
    const recording = await record();
    const replayed = await replayRecording(recording);
    expect(replayed).toEqual(recording.state);
  });
});
