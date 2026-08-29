import { describe, expect, it } from "vitest";
import type { InvestmentCommitteeState } from "@sonar-ai/core";
import { goldenState } from "../../../../packages/core/src/__fixtures__/golden-state";
import { AnalysisOrchestrator } from "../../../../apps/web/lib/server/analysis/orchestrator";
import { StubAgentRunner } from "../../../../apps/web/lib/server/analysis/runner/stub-runner";

function initialState(): InvestmentCommitteeState {
  const state = structuredClone(goldenState);
  state.phase = "idle";
  state.run.completedAt = null;
  state.stages = [];
  state.fundamentalReports = [];
  state.marketContext = null;
  state.riskReport = null;
  state.proposal = null;
  state.finalRecommendation = null;
  state.bearCase = null;
  state.proposedActions = [];
  state.riskChecks = [];
  state.userDecision = null;
  state.appliedOrders = [];
  state.portfolioAfter = null;
  state.report = null;
  state.activities = [];
  state.receipt = null;
  return state;
}

function orchestrator(): AnalysisOrchestrator {
  const bearCase = structuredClone(goldenState.bearCase!);
  bearCase.targetRecommendationId = goldenState.proposal!.id;
  return new AnalysisOrchestrator({
    runner: new StubAgentRunner({
      fundamental_analyst: goldenState.fundamentalReports,
      market_context: goldenState.marketContext!,
      portfolio_manager: [goldenState.proposal!, goldenState.finalRecommendation!],
      bear_critic: bearCase,
      report_writer: goldenState.report!,
    }),
    stressScenarios: [{ name: "AI capex slowdown", marketShock: -0.2 }],
    instrumentStats: {
      inst_nvidia: { volatility: 0.2, beta: 1.4 },
      inst_siemens: { volatility: 0.1, beta: 0.9 },
    },
  });
}

const decision = {
  decision: "approved" as const,
  decidedAt: "2026-08-29T14:05:20Z",
  note: "Approved the resized allocation.",
};

describe("AnalysisOrchestrator", () => {
  it("stops at the human gate without applying actions", async () => {
    const state = await orchestrator().run({
      state: initialState(),
      selectedInstrumentIds: ["inst_nvidia", "inst_siemens"],
    });

    expect(state.phase).toBe("awaiting_approval");
    expect(state.appliedOrders).toEqual([]);
    expect(state.report).toBeNull();
    expect(state.stages.find((stage) => stage.stage === "report_writer")?.status).toBe("pending");
    expect(state.riskReport?.checks.find((check) => check.result === "resize")?.breachCode).toBe(
      "POSITION_LIMIT_BREACH",
    );
  });

  it("requires approval before applying deterministic paper orders and writing report", async () => {
    const pending = await orchestrator().run({
      state: initialState(),
      selectedInstrumentIds: ["inst_nvidia", "inst_siemens"],
    });
    const complete = await orchestrator().approve(pending, decision);

    expect(complete.phase).toBe("complete");
    expect(complete.appliedOrders).toHaveLength(2);
    expect(complete.appliedOrders.map((order) => order.id)).toEqual([
      "ord_acn_sie_final",
      "ord_acn_nvda_final",
    ]);
    expect(complete.portfolioAfter?.cash.amount).toBe(500);
    expect(complete.report?.id).toBe("rpt_main");
    expect(complete.receipt?.userDecision.decision).toBe("approved");
    expect(complete.stages.every((stage) => stage.status === "complete")).toBe(true);
  });

  it("replays identically with the same fixture and decision", async () => {
    const input = {
      selectedInstrumentIds: ["inst_nvidia", "inst_siemens"],
    } as const;
    const first = await orchestrator().run({ state: initialState(), ...input, userDecision: decision });
    const second = await orchestrator().run({ state: initialState(), ...input, userDecision: decision });

    expect(second).toEqual(first);
  });

  it("does not let a human decision override a deterministic hard block", async () => {
    const state = initialState();
    const proposal = structuredClone(goldenState.proposal!);
    proposal.actions = [
      { ...proposal.actions[0]!, id: "acn_nvda_block", instrumentId: "inst_nvidia", targetWeight: 0.3, amount: { amount: 300, currency: "EUR" } },
      { ...proposal.actions[1]!, id: "acn_asml_block", instrumentId: "inst_asml", targetWeight: 0.2, amount: { amount: 200, currency: "EUR" } },
    ];

    const blocked = await new AnalysisOrchestrator({
      runner: new StubAgentRunner({
        fundamental_analyst: goldenState.fundamentalReports,
        market_context: goldenState.marketContext!,
        portfolio_manager: proposal,
      }),
    }).run({ state, selectedInstrumentIds: ["inst_nvidia", "inst_asml"] });

    expect(blocked.phase).toBe("blocked");
    expect(blocked.riskReport?.hardBlocks).toContain("RISK_MANDATE_BREACH");
    expect(blocked.stages.find((stage) => stage.stage === "bear_critic")?.status).toBe("skipped");
    await expect(
      new AnalysisOrchestrator({ runner: new StubAgentRunner({}) }).approve(blocked, decision),
    ).rejects.toThrow("awaiting_approval");
  });
});
