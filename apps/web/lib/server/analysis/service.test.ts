import type { InvestmentCommitteeState } from "@sonar-ai/core";
import { describe, expect, it } from "vitest";

import { goldenState } from "../../../../../packages/core/src/__fixtures__/golden-state";
import { InMemoryRunStore } from "../runs/run-store";
import { StubAgentRunner } from "./runner/stub-runner";
import {
  RunConflictError,
  RunNotFoundError,
  approveAnalysisRun,
  startAnalysisRun,
} from "./service";

const INSTRUMENT_STATS = {
  inst_nvidia: { volatility: 0.2, beta: 1.4 },
  inst_siemens: { volatility: 0.1, beta: 0.9 },
};
const STRESS = [{ name: "AI capex slowdown", marketShock: -0.2 }] as const;

/** A stub whose canned outputs are the golden run — drives the full committee. */
function goldenRunner(): StubAgentRunner {
  return new StubAgentRunner({
    fundamental_analyst: goldenState.fundamentalReports,
    market_context: goldenState.marketContext!,
    portfolio_manager: [goldenState.proposal!, goldenState.finalRecommendation!],
    bear_critic: goldenState.bearCase!,
    report_writer: goldenState.report!,
  });
}

async function start(store: InMemoryRunStore, runner = goldenRunner()) {
  return startAnalysisRun({
    riskPreferences: { riskTolerance: "balanced" },
    runner,
    scenario: goldenState as InvestmentCommitteeState,
    instrumentStats: INSTRUMENT_STATS,
    stressScenarios: STRESS,
    store,
    now: "2026-08-29T15:00:00Z",
  });
}

describe("startAnalysisRun", () => {
  it("runs the committee to the human-approval gate and stores it", async () => {
    const store = new InMemoryRunStore();
    const state = await start(store);

    expect(state.phase).toBe("awaiting_approval");
    expect(state.finalRecommendation).not.toBeNull();
    expect(state.riskReport).not.toBeNull();
    // Nothing applied before approval.
    expect(state.userDecision).toBeNull();
    expect(state.appliedOrders).toEqual([]);
    expect(state.receipt).toBeNull();

    const stored = store.get(state.run.id);
    expect(stored?.state.phase).toBe("awaiting_approval");
    expect(stored?.instrumentStats).toEqual(INSTRUMENT_STATS);
  });

  it("mints a fresh run id and derives the mandate from risk preferences", async () => {
    const store = new InMemoryRunStore();
    const state = await start(store);
    expect(state.run.id).not.toBe(goldenState.run.id);
    // balanced preset == demo limits
    expect(state.mandate.limits.minCashRatio).toBe(0.1);
    expect(state.mandate.limits.maxGrossExposurePerPosition).toBe(0.3);
  });
});

describe("approveAnalysisRun", () => {
  it("applies actions on approval and produces a receipt", async () => {
    const store = new InMemoryRunStore();
    const runner = goldenRunner();
    const run = await start(store, runner);

    const approved = await approveAnalysisRun({
      runId: run.run.id,
      decision: { decision: "approved", decidedBy: "axel", note: "looks good" },
      runner,
      store,
      now: "2026-08-29T15:10:00Z",
    });

    expect(approved.phase).toBe("complete");
    expect(approved.userDecision?.decision).toBe("approved");
    expect(approved.appliedOrders.length).toBeGreaterThan(0);
    expect(approved.receipt).not.toBeNull();
    expect(approved.receipt?.runId).toBe(run.run.id);
    // Store reflects the completed run.
    expect(store.get(run.run.id)?.state.phase).toBe("complete");
  });

  it("records a rejection without applying any orders", async () => {
    const store = new InMemoryRunStore();
    const runner = goldenRunner();
    const run = await start(store, runner);

    const rejected = await approveAnalysisRun({
      runId: run.run.id,
      decision: { decision: "rejected" },
      runner,
      store,
      now: "2026-08-29T15:10:00Z",
    });

    expect(rejected.phase).toBe("complete");
    expect(rejected.userDecision?.decision).toBe("rejected");
    expect(rejected.appliedOrders).toEqual([]);
  });

  it("404s for an unknown run", async () => {
    const store = new InMemoryRunStore();
    await expect(
      approveAnalysisRun({
        runId: "run_nope",
        decision: { decision: "approved" },
        runner: goldenRunner(),
        store,
      }),
    ).rejects.toBeInstanceOf(RunNotFoundError);
  });

  it("409s when the run is not awaiting approval", async () => {
    const store = new InMemoryRunStore();
    const runner = goldenRunner();
    const run = await start(store, runner);
    await approveAnalysisRun({
      runId: run.run.id,
      decision: { decision: "approved" },
      runner,
      store,
      now: "2026-08-29T15:10:00Z",
    });
    // Second approval — already complete.
    await expect(
      approveAnalysisRun({
        runId: run.run.id,
        decision: { decision: "approved" },
        runner: goldenRunner(),
        store,
      }),
    ).rejects.toBeInstanceOf(RunConflictError);
  });
});
