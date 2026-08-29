import {
  BearCaseSchema,
  type Evidence,
  type Recommendation,
  type RiskReport,
} from "@sonar-ai/core";
import { describe, expect, it } from "vitest";
import { StubAgentRunner } from "../runner/stub-runner";
import {
  bearCritic,
  BearCaseDraftSchema,
  type BearCaseDraft,
  type BearCriticContext,
} from "./bear-critic";

const EVIDENCE: Evidence[] = [
  { id: "ev_nvda_fund", kind: "filing", title: "Nvidia data-center revenue", sourceName: "filing", observedAt: "2026-08-01T00:00:00Z", label: "synthetic" },
];

const RECOMMENDATION: Recommendation = {
  id: "rec_proposal",
  revision: 0,
  actions: [
    { id: "acn_inst_nvidia_r0", instrumentId: "inst_nvidia", side: "buy", targetWeight: 0.3, amount: { amount: 300, currency: "EUR" }, evidenceIds: ["ev_nvda_fund"] },
  ],
  bull: [{ id: "b0", statement: "Nvidia benefits from capex", stance: "bull", evidenceIds: ["ev_nvda_fund"] }],
  context: [],
  bear: [],
  confidence: 0.6,
  invalidationConditions: ["capex delayed"],
  expectedCashAfter: { amount: 700, currency: "EUR" },
};

const RISK_REPORT: RiskReport = {
  id: "rrp_main",
  metrics: { volatility: 0.1, beta: 1, concentration: 0.3, sectorExposure: {}, cashRatio: 0.7, turnover: 0 },
  stress: [],
  checks: [{ id: "rsk_x", actionId: "acn_inst_nvidia_r0", result: "pass", detail: "ok", numbers: {} }],
  comparison: { currentNav: { amount: 1000, currency: "EUR" }, proposedInvested: { amount: 300, currency: "EUR" }, proposedCash: { amount: 700, currency: "EUR" }, deltas: [] },
  hardBlocks: [],
};

const CONTEXT: BearCriticContext = {
  recommendation: RECOMMENDATION,
  fundamentalReports: [],
  marketContext: null,
  riskReport: RISK_REPORT,
  evidence: EVIDENCE,
};

const DRAFT: BearCaseDraft = {
  weaknesses: ["Consensus already assumes strong data-center growth"],
  failureScenarios: ["An AI capex slowdown compresses the multiple"],
  claims: [{ statement: "The bull case leans on one filing", stance: "bear", evidenceIds: ["ev_nvda_fund"] }],
};

describe("bearCritic", () => {
  it("accepts a well-formed draft (no IDs) against its output schema", () => {
    expect(BearCaseDraftSchema.safeParse(DRAFT).success).toBe(true);
  });

  it("builds a prompt exposing the recommendation, risk, and evidence IDs", () => {
    const prompt = bearCritic.def.buildInput(CONTEXT);
    expect(prompt).toContain("inst_nvidia");
    expect(prompt).toContain("Risk Officer report");
    expect(prompt).toContain("ev_nvda_fund");
  });

  it("finalizes into a schema-valid case bound to the target recommendation", () => {
    const bear = bearCritic.finalize(DRAFT, CONTEXT);
    expect(BearCaseSchema.safeParse(bear).success).toBe(true);
    expect(bear.id).toBe("bear_main");
    expect(bear.targetRecommendationId).toBe("rec_proposal");
    expect(bear.claims[0]!.id).toBe("clm_bear_0");
  });

  it("produces claims whose evidence all resolves to the provided pack", () => {
    const bear = bearCritic.finalize(DRAFT, CONTEXT);
    const known = new Set(EVIDENCE.map((e) => e.id));
    expect(bear.claims.flatMap((c) => c.evidenceIds).every((id) => known.has(id))).toBe(true);
  });

  it("runs end-to-end through the StubAgentRunner", async () => {
    const runner = new StubAgentRunner({ bear_critic: DRAFT });
    const { output } = await runner.run(bearCritic.def, CONTEXT);
    const bear = bearCritic.finalize(output, CONTEXT);
    expect(BearCaseSchema.safeParse(bear).success).toBe(true);
  });
});
