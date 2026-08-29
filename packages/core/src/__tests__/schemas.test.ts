import { describe, expect, it } from "vitest";
import {
  AnalysisSchema,
  InvestmentCommitteeStateSchema,
} from "../analysis";
import { DecisionReceiptSchema } from "../receipts";
import { goldenState } from "../__fixtures__/golden-state";

describe("golden committee state", () => {
  it("parses against InvestmentCommitteeStateSchema", () => {
    const result = InvestmentCommitteeStateSchema.safeParse(goldenState);
    if (!result.success) {
      throw new Error(JSON.stringify(result.error.issues, null, 2));
    }
    expect(result.success).toBe(true);
  });

  it("parses against the browser-facing AnalysisSchema", () => {
    expect(AnalysisSchema.safeParse(goldenState).success).toBe(true);
  });

  it("has a fully-formed decision receipt", () => {
    const result = DecisionReceiptSchema.safeParse(goldenState.receipt);
    expect(result.success).toBe(true);
  });

  it("starts from the €1,000 all-cash baseline", () => {
    expect(goldenState.portfolioSnapshot.positions).toHaveLength(0);
    expect(goldenState.portfolioSnapshot.cash.amount).toBe(1000);
    expect(goldenState.portfolioSnapshot.nav.amount).toBe(1000);
  });

  it("demonstrates a deterministic risk resize on a position-limit breach", () => {
    const resized = goldenState.riskChecks.find((c) => c.result === "resize");
    expect(resized?.breachCode).toBe("POSITION_LIMIT_BREACH");
    expect(resized?.resizedAmount?.amount).toBe(300);
  });

  it("requires an approved decision before any applied order", () => {
    expect(goldenState.userDecision?.decision).toBe("approved");
    expect(goldenState.appliedOrders.length).toBeGreaterThan(0);
  });

  it("surfaces the current value of all four mandate limits in risk metrics", () => {
    const m = goldenState.riskReport!.metrics;
    expect(m.concentration).toBe(0.3); // position limit
    expect(m.sectorExposure.Semiconductors).toBe(0.3); // sector limit
    expect(m.cashRatio).toBe(0.5); // cash floor
    expect(m.turnover).toBe(0); // turnover limit (sell-side; all-cash deploy)
  });

  it("keeps the phase invariant: applied orders imply an approved decision", () => {
    // The schema permits progressive enrichment (partial states validate), so
    // this invariant is enforced by the orchestrator. We assert the reference
    // fixture upholds it so the guarantee lives with the contract.
    if (goldenState.appliedOrders.length > 0) {
      expect(goldenState.userDecision?.decision).toBe("approved");
    }
  });
});
