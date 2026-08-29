import { describe, expect, it } from "vitest";
import type { InvestmentCommitteeState } from "@sonar-ai/core";
import { goldenState } from "../../../../packages/core/src/__fixtures__/golden-state";
import { AnalysisOrchestrator } from "../../../../apps/web/lib/server/analysis/orchestrator";
import { StubAgentRunner } from "../../../../apps/web/lib/server/analysis/runner/stub-runner";
import type { AgentRunner } from "../../../../apps/web/lib/server/analysis/runner/types";

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
  return new AnalysisOrchestrator({
    runner: fixtureRunner(),
    stressScenarios: [{ name: "AI capex slowdown", marketShock: -0.2 }],
    instrumentStats: {
      inst_nvidia: { volatility: 0.2, beta: 1.4 },
      inst_siemens: { volatility: 0.1, beta: 0.9 },
    },
  });
}

function fixtureRunner(): AgentRunner {
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

const decision = {
  decision: "approved" as const,
  decidedAt: "2026-08-29T14:05:20Z",
  note: "Approved the resized allocation.",
};

describe("AnalysisOrchestrator", () => {
  it("stops at the human gate without applying actions", async () => {
    const state = await orchestrator().run({ state: initialState() });

    expect(state.phase).toBe("awaiting_approval");
    expect(state.appliedOrders).toEqual([]);
    expect(state.report).toBeNull();
    expect(state.stages.find((stage) => stage.stage === "report_writer")?.status).toBe("pending");
    expect(state.riskReport?.checks.find((check) => check.result === "resize")?.breachCode).toBe(
      "POSITION_LIMIT_BREACH",
    );
  });

  it("requires approval before applying deterministic paper orders and writing report", async () => {
    const pending = await orchestrator().run({ state: initialState() });
    const complete = await orchestrator().approve(pending, decision);

    expect(complete.phase).toBe("complete");
    expect(complete.appliedOrders).toHaveLength(2);
    // Order ids follow the agents' deterministic scheme: ord_<actionId>, where
    // the revised action id is acn_<instrumentId>_r1.
    expect(complete.appliedOrders.map((order) => order.id)).toEqual([
      "ord_acn_inst_siemens_r1",
      "ord_acn_inst_nvidia_r1",
    ]);
    expect(complete.portfolioAfter?.cash.amount).toBe(500);
    expect(complete.report?.id).toBe("rpt_main");
    expect(complete.receipt?.userDecision.decision).toBe("approved");
    expect(complete.stages.every((stage) => stage.status === "complete")).toBe(true);
  });

  it("replays identically with the same fixture and decision", async () => {
    const first = await orchestrator().run({ state: initialState(), userDecision: decision });
    const second = await orchestrator().run({ state: initialState(), userDecision: decision });

    expect(second).toEqual(first);
  });

  it("merges tool-discovered evidence before research gates", async () => {
    const baseRunner = fixtureRunner();
    const runner: AgentRunner = {
      async run(definition, context) {
        const result = await baseRunner.run(definition, context);
        return {
          ...result,
          evidence: [
            {
              id: "ev_cala_discovered",
              kind: "cala",
              title: "Tool-discovered Cala evidence",
              sourceName: "Cala fixture",
              sourceUrl: "https://docs.cala.ai/",
              observedAt: "2026-08-29T00:00:00Z",
              label: "synthetic",
              snippet: "Synthetic tool evidence.",
            },
          ],
          ...(definition.stage === "market_context"
            ? {
                graph: {
                  nodes: [
                    {
                      id: "cala_node_discovered",
                      type: "company" as const,
                      label: "Discovered Company",
                      evidenceIds: ["ev_cala_discovered"],
                    },
                  ],
                  edges: [],
                },
              }
            : {}),
        };
      },
    };
    const state = await new AnalysisOrchestrator({
      runner,
      stressScenarios: [{ name: "AI capex slowdown", marketShock: -0.2 }],
      instrumentStats: {
        inst_nvidia: { volatility: 0.2, beta: 1.4 },
        inst_siemens: { volatility: 0.1, beta: 0.9 },
      },
    }).run({
      state: initialState(),
    });

    expect(state.phase).toBe("awaiting_approval");
    expect(state.evidence.filter((item) => item.id === "ev_cala_discovered")).toHaveLength(1);
    expect(state.graph.nodes.some((item) => item.id === "cala_node_discovered")).toBe(true);
  });

  it("does not let a human decision override a deterministic hard block", async () => {
    const state = initialState();
    const proposal = structuredClone(goldenState.proposal!);
    proposal.actions = [
      { ...proposal.actions[0]!, id: "acn_nvda_block", instrumentId: "inst_nvidia", targetWeight: 0.3, amount: { amount: 300, currency: "EUR" } },
      { ...proposal.actions[1]!, id: "acn_asml_block", instrumentId: "inst_asml", targetWeight: 0.2, amount: { amount: 200, currency: "EUR" } },
    ];

    const marketContext = structuredClone(goldenState.marketContext!);
    marketContext.candidateOpportunities = [
      { symbol: "NVDA", name: "Nvidia", rationale: "test", evidenceIds: ["ev_nvda_fund"] },
      { symbol: "ASML", name: "ASML Holding", rationale: "test", evidenceIds: ["ev_asml_supplier"] },
    ];
    const blocked = await new AnalysisOrchestrator({
      runner: new StubAgentRunner({
        fundamental_analyst: goldenState.fundamentalReports,
        market_context: marketContext,
        portfolio_manager: proposal,
      }),
    }).run({ state });

    expect(blocked.phase).toBe("blocked");
    expect(blocked.riskReport?.hardBlocks).toContain("RISK_MANDATE_BREACH");
    expect(blocked.stages.find((stage) => stage.stage === "bear_critic")?.status).toBe("skipped");
    await expect(
      new AnalysisOrchestrator({ runner: new StubAgentRunner({}) }).approve(blocked, decision),
    ).rejects.toThrow("awaiting_approval");
  });
});
