import {
  CommitteeReportSchema,
  type PortfolioComparison,
  type Recommendation,
  type UserDecision,
} from "@sonar-ai/core";
import { describe, expect, it } from "vitest";
import { StubAgentRunner } from "../runner/stub-runner";
import {
  reportWriter,
  CommitteeReportDraftSchema,
  type CommitteeReportDraft,
  type ReportWriterContext,
} from "./report-writer";

const RECOMMENDATION: Recommendation = {
  id: "rec_final",
  revision: 1,
  actions: [
    { id: "acn_inst_nvidia_r1", instrumentId: "inst_nvidia", side: "buy", targetWeight: 0.3, amount: { amount: 300, currency: "EUR" }, evidenceIds: ["ev_nvda_fund"] },
  ],
  bull: [],
  context: [],
  bear: [],
  confidence: 0.6,
  invalidationConditions: [],
  expectedCashAfter: { amount: 700, currency: "EUR" },
};

const DECISION: UserDecision = {
  decision: "approved",
  decidedAt: "2026-08-29T14:05:20Z",
  note: "Approved.",
};

const COMPARISON: PortfolioComparison = {
  currentNav: { amount: 1000, currency: "EUR" },
  proposedInvested: { amount: 300, currency: "EUR" },
  proposedCash: { amount: 700, currency: "EUR" },
  deltas: [],
};

const CONTEXT: ReportWriterContext = {
  recommendation: RECOMMENDATION,
  userDecision: DECISION,
  appliedOrders: [
    { id: "ord_x", actionId: "acn_inst_nvidia_r1", instrumentId: "inst_nvidia", side: "buy", quantity: 2.5, price: { amount: 120, currency: "EUR" }, notional: { amount: 300, currency: "EUR" }, appliedAt: "2026-08-29T14:05:25Z" },
  ],
  comparison: COMPARISON,
  event: null,
  evidence: [],
};

const DRAFT: CommitteeReportDraft = {
  narrative: "The committee bought Nvidia after the human approved the resized allocation.",
  decisionSummary: "Approved: buy Nvidia 30%; hold cash.",
  disclaimers: [],
};

describe("reportWriter", () => {
  it("accepts a well-formed draft against its output schema", () => {
    expect(CommitteeReportDraftSchema.safeParse(DRAFT).success).toBe(true);
  });

  it("builds a prompt that states the decision and the applied orders", () => {
    const prompt = reportWriter.def.buildInput(CONTEXT);
    expect(prompt).toContain("APPROVED");
    expect(prompt).toContain("inst_nvidia");
  });

  it("injects mandatory compliance disclaimers even when the model omits them", () => {
    const report = reportWriter.finalize(DRAFT, CONTEXT);
    expect(CommitteeReportSchema.safeParse(report).success).toBe(true);
    expect(report.id).toBe("rpt_main");
    expect(report.disclaimers).toContain("Paper trading only.");
    expect(report.disclaimers).toContain("Not investment advice.");
  });

  it("preserves scenario-specific disclaimers without duplicating the mandatory ones", () => {
    const report = reportWriter.finalize(
      { ...DRAFT, disclaimers: ["Synthetic scenario.", "Paper trading only."] },
      CONTEXT,
    );
    expect(report.disclaimers.filter((d) => d === "Paper trading only.")).toHaveLength(1);
    expect(report.disclaimers).toContain("Synthetic scenario.");
  });

  it("runs end-to-end through the StubAgentRunner", async () => {
    const runner = new StubAgentRunner({ report_writer: DRAFT });
    const { output } = await runner.run(reportWriter.def, CONTEXT);
    const report = reportWriter.finalize(output, CONTEXT);
    expect(CommitteeReportSchema.safeParse(report).success).toBe(true);
  });
});
