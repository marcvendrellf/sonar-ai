import type { PortfolioSnapshot } from "@sonar-ai/core";
import { describe, expect, it } from "vitest";
import { comparePortfolios } from "../compare";
import { proposedWeights } from "../weights";

function bookWith(instrumentId: string, weight: number): PortfolioSnapshot {
  const invested = weight * 1000;
  return {
    id: "pf",
    asOf: "2026-08-29T14:00:00Z",
    baseCurrency: "EUR",
    cash: { amount: 1000 - invested, currency: "EUR" },
    nav: { amount: 1000, currency: "EUR" },
    positions: [
      {
        instrumentId,
        quantity: 1,
        avgPrice: { amount: invested, currency: "EUR" },
        marketValue: { amount: invested, currency: "EUR" },
        weight,
      },
    ],
    label: "synthetic",
  };
}

describe("comparePortfolios with a non-empty starting book", () => {
  const current = bookWith("inst_nvidia", 0.4);
  const proposed = proposedWeights(current, [
    {
      id: "acn_add",
      instrumentId: "inst_siemens",
      side: "buy",
      targetWeight: 0.2,
      amount: { amount: 200, currency: "EUR" },
      evidenceIds: [],
    },
  ]);
  const comparison = comparePortfolios(current, proposed);

  it("adds the new position to the carried-over holding", () => {
    // 0.40 Nvidia (carried) + 0.20 Siemens (new) = 0.60 invested.
    expect(comparison.proposedInvested.amount).toBe(600);
    expect(comparison.proposedCash.amount).toBe(400);
  });

  it("emits a delta for both the held and the new instrument, sorted by id", () => {
    expect(comparison.deltas).toEqual([
      { instrumentId: "inst_nvidia", currentWeight: 0.4, proposedWeight: 0.4 },
      { instrumentId: "inst_siemens", currentWeight: 0, proposedWeight: 0.2 },
    ]);
  });
});
