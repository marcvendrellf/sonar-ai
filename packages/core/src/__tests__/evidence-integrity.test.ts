import { describe, expect, it } from "vitest";
import {
  findDanglingActionIds,
  findDanglingActionIdsInReceipt,
  findDanglingEvidenceIds,
  findDanglingEvidenceIdsInReceipt,
} from "../integrity";
import { goldenState } from "../__fixtures__/golden-state";

describe("evidence referential integrity", () => {
  it("has no dangling evidence references in the golden state", () => {
    expect(findDanglingEvidenceIds(goldenState)).toEqual([]);
  });

  it("detects an injected dangling evidence reference", () => {
    const broken = structuredClone(goldenState);
    broken.graph.edges[0]!.evidenceIds.push("ev_does_not_exist");
    expect(findDanglingEvidenceIds(broken)).toContain("ev_does_not_exist");
  });

  it("has no dangling evidence references inside the receipt", () => {
    expect(findDanglingEvidenceIdsInReceipt(goldenState.receipt!)).toEqual([]);
  });

  it("detects a dangling evidence reference inside the receipt", () => {
    const broken = structuredClone(goldenState);
    broken.receipt!.recommendation.bull[0]!.evidenceIds.push("ev_missing");
    expect(findDanglingEvidenceIdsInReceipt(broken.receipt!)).toContain(
      "ev_missing",
    );
  });
});

describe("action referential integrity", () => {
  it("resolves every risk-check actionId in the golden state", () => {
    // Checks reference the revision-0 proposal actions; those must be stored.
    expect(findDanglingActionIds(goldenState)).toEqual([]);
  });

  it("allows the portfolio-level sentinel actionId", () => {
    const withPortfolioCheck = structuredClone(goldenState);
    withPortfolioCheck.riskChecks.push({
      id: "rsk_sector_test",
      actionId: "portfolio",
      result: "reject",
      breachCode: "RISK_MANDATE_BREACH",
      detail: "sector breach",
      numbers: {},
    });
    expect(findDanglingActionIds(withPortfolioCheck)).toEqual([]);
  });

  it("detects a risk check pointing at an action that was revised away", () => {
    const broken = structuredClone(goldenState);
    broken.proposal = null; // the v0 actions the checks cite no longer resolve
    expect(findDanglingActionIds(broken)).toEqual(
      expect.arrayContaining(["acn_nvda_v0", "acn_sie_v0"]),
    );
  });

  it("resolves every risk-check actionId inside the receipt", () => {
    expect(findDanglingActionIdsInReceipt(goldenState.receipt!)).toEqual([]);
  });
});
