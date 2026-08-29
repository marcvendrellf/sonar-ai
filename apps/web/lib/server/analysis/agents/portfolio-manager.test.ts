import {
  RecommendationSchema,
  type BearCase,
  type Evidence,
  type FundamentalReport,
  type Instrument,
  type Mandate,
  type MarketContextReport,
  type PortfolioSnapshot,
  type RiskReport,
} from "@sonar-ai/core";
import { evaluateProposal } from "@sonar-ai/risk-engine";
import { describe, expect, it } from "vitest";
import { StubAgentRunner } from "../runner/stub-runner";
import {
  portfolioManager,
  RecommendationDraftSchema,
  type PortfolioManagerContext,
  type RecommendationDraft,
} from "./portfolio-manager";

const INSTRUMENTS: Instrument[] = [
  { id: "inst_nvidia", symbol: "NVDA", name: "Nvidia", sector: "Semiconductors", assetClass: "equity", currency: "EUR" },
  { id: "inst_siemens", symbol: "SIEGY", name: "Siemens Energy", sector: "Energy", assetClass: "equity", currency: "EUR" },
];

const PORTFOLIO: PortfolioSnapshot = {
  id: "pf_before",
  asOf: "2026-08-29T14:00:00Z",
  baseCurrency: "EUR",
  cash: { amount: 1000, currency: "EUR" },
  nav: { amount: 1000, currency: "EUR" },
  positions: [],
  label: "synthetic",
};

const MANDATE: Mandate = {
  id: "mnd_demo1",
  baseCurrency: "EUR",
  initialCash: { amount: 1000, currency: "EUR" },
  limits: { maxGrossExposurePerPosition: 0.3, maxSectorExposure: 0.45, minCashRatio: 0.1, maxTurnoverPerEvent: 0.2 },
};

const EVIDENCE: Evidence[] = [
  { id: "ev_nvda_fund", kind: "filing", title: "Nvidia data-center revenue", sourceName: "filing", observedAt: "2026-08-01T00:00:00Z", label: "synthetic" },
  { id: "ev_power_demand", kind: "cala", title: "Datacenter grid demand", sourceName: "Cala", observedAt: "2026-08-10T00:00:00Z", label: "synthetic" },
];

const FUNDAMENTALS: FundamentalReport[] = [
  { id: "frp_inst_nvidia", instrumentId: "inst_nvidia", quality: "dominant", valuation: "rich", financialStrength: "strong", catalysts: [], risks: [], claims: [{ id: "c", statement: "growth", stance: "bull", evidenceIds: ["ev_nvda_fund"] }] },
];

const MARKET: MarketContextReport = {
  id: "mrp_main", summary: "AI capex drives demand", drivers: [], sectorView: "extended", macroView: "stable", claims: [],
};

const PROPOSAL_CONTEXT: PortfolioManagerContext = {
  portfolio: PORTFOLIO,
  mandate: MANDATE,
  instruments: INSTRUMENTS,
  fundamentalReports: FUNDAMENTALS,
  marketContext: MARKET,
  evidence: EVIDENCE,
};

const DRAFT: RecommendationDraft = {
  actions: [
    { instrumentId: "inst_nvidia", side: "buy", targetWeight: 0.3, evidenceIds: ["ev_nvda_fund"] },
    { instrumentId: "inst_siemens", side: "buy", targetWeight: 0.2, evidenceIds: ["ev_power_demand"] },
  ],
  bull: [{ statement: "Nvidia benefits from capex", stance: "bull", evidenceIds: ["ev_nvda_fund"] }],
  context: [{ statement: "Grid demand backdrop", stance: "context", evidenceIds: ["ev_power_demand"] }],
  bear: [{ statement: "Priced for growth", stance: "bear", evidenceIds: ["ev_nvda_fund"] }],
  confidence: 0.62,
  invalidationConditions: ["Capex is delayed"],
};

const RISK_REPORT: RiskReport = {
  id: "rrp_main",
  metrics: { volatility: 0.1, beta: 1, concentration: 0.3, sectorExposure: {}, cashRatio: 0.5, turnover: 0 },
  stress: [],
  checks: [{ id: "rsk_x", actionId: "acn_inst_nvidia_r0", result: "resize", breachCode: "POSITION_LIMIT_BREACH", detail: "trimmed", numbers: {} }],
  comparison: { currentNav: { amount: 1000, currency: "EUR" }, proposedInvested: { amount: 500, currency: "EUR" }, proposedCash: { amount: 500, currency: "EUR" }, deltas: [] },
  hardBlocks: [],
};

const BEAR_CASE: BearCase = {
  id: "bear_main", targetRecommendationId: "rec_proposal", weaknesses: ["consensus already positive"], failureScenarios: ["capex slowdown"], claims: [],
};

describe("portfolioManager", () => {
  it("accepts a well-formed draft (weights only, no IDs/amounts)", () => {
    expect(RecommendationDraftSchema.safeParse(DRAFT).success).toBe(true);
  });

  it("finalizes the PROPOSAL pass: revision 0, computed notionals and cash", () => {
    const rec = portfolioManager.finalize(DRAFT, PROPOSAL_CONTEXT);
    expect(RecommendationSchema.safeParse(rec).success).toBe(true);
    expect(rec.id).toBe("rec_proposal");
    expect(rec.revision).toBe(0);
    expect(rec.actions[0]!.id).toBe("acn_inst_nvidia_r0");
    expect(rec.actions[0]!.amount.amount).toBe(300); // 0.30 × 1000
    expect(rec.actions[1]!.amount.amount).toBe(200); // 0.20 × 1000
    expect(rec.expectedCashAfter.amount).toBe(500); // 1000 - 500 deployed
    expect(rec.bull[0]!.id).toBe("clm_rec_proposal_bull_0");
  });

  it("finalizes the REVISION pass when risk/bear are present: revision 1", () => {
    const rec = portfolioManager.finalize(DRAFT, {
      ...PROPOSAL_CONTEXT,
      riskReport: RISK_REPORT,
      bearCase: BEAR_CASE,
    });
    expect(rec.id).toBe("rec_final");
    expect(rec.revision).toBe(1);
    expect(rec.actions[0]!.id).toBe("acn_inst_nvidia_r1");
  });

  it("produces actions the risk engine accepts (amount ≈ weight × NAV)", () => {
    const rec = portfolioManager.finalize(DRAFT, PROPOSAL_CONTEXT);
    const report = evaluateProposal({
      portfolio: PORTFOLIO,
      mandate: MANDATE,
      instruments: INSTRUMENTS,
      actions: rec.actions,
    });
    // No action is rejected for inconsistent inputs.
    expect(report.checks.some((c) => c.breachCode === "DATA_INVALID")).toBe(false);
  });

  it("labels the pass and surfaces risk/bear in the revision prompt", () => {
    expect(portfolioManager.def.buildInput(PROPOSAL_CONTEXT)).toContain("PROPOSAL");
    const revisionPrompt = portfolioManager.def.buildInput({
      ...PROPOSAL_CONTEXT,
      riskReport: RISK_REPORT,
      bearCase: BEAR_CASE,
    });
    expect(revisionPrompt).toContain("REVISION");
    expect(revisionPrompt).toContain("Risk Officer report");
    expect(revisionPrompt).toContain("Bear/Critic case");
  });

  it("runs end-to-end through the StubAgentRunner", async () => {
    const runner = new StubAgentRunner({ portfolio_manager: DRAFT });
    const { output } = await runner.run(portfolioManager.def, PROPOSAL_CONTEXT);
    const rec = portfolioManager.finalize(output, PROPOSAL_CONTEXT);
    expect(RecommendationSchema.safeParse(rec).success).toBe(true);
  });
});
