import type {
  Instrument,
  Mandate,
  PortfolioSnapshot,
  ProposedAction,
} from "@sonar-ai/core";
import { DEMO_RISK_LIMITS, RiskReportSchema } from "@sonar-ai/core";
import { describe, expect, it } from "vitest";
import { evaluateProposal } from "../engine";

const INSTRUMENTS: Instrument[] = [
  { id: "inst_nvidia", symbol: "NVDA", name: "Nvidia", sector: "Semiconductors", assetClass: "equity", currency: "EUR" },
  { id: "inst_asml", symbol: "ASML", name: "ASML", sector: "Semiconductors", assetClass: "equity", currency: "EUR" },
  { id: "inst_siemens", symbol: "SIEGY", name: "Siemens Energy", sector: "Energy", assetClass: "equity", currency: "EUR" },
  { id: "inst_vestas", symbol: "VWS", name: "Vestas", sector: "Utilities", assetClass: "equity", currency: "EUR" },
];

function allCashPortfolio(): PortfolioSnapshot {
  return {
    id: "pf_before",
    asOf: "2026-08-29T14:00:00Z",
    baseCurrency: "EUR",
    cash: { amount: 1000, currency: "EUR" },
    nav: { amount: 1000, currency: "EUR" },
    positions: [],
    label: "synthetic",
  };
}

function demoMandate(): Mandate {
  return {
    id: "mnd_demo1",
    baseCurrency: "EUR",
    initialCash: { amount: 1000, currency: "EUR" },
    limits: DEMO_RISK_LIMITS,
  };
}

function buy(id: string, instrumentId: string, weight: number): ProposedAction {
  return {
    id,
    instrumentId,
    side: "buy",
    targetWeight: weight,
    amount: { amount: weight * 1000, currency: "EUR" },
    evidenceIds: [],
  };
}

/** A €1,000 book already holding one position at `weight` of NAV. */
function portfolioWithPosition(
  instrumentId: string,
  weight: number,
): PortfolioSnapshot {
  const invested = weight * 1000;
  return {
    id: "pf_reb",
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

describe("evaluateProposal — happy path with a position-limit resize", () => {
  const report = evaluateProposal({
    portfolio: allCashPortfolio(),
    mandate: demoMandate(),
    instruments: INSTRUMENTS,
    actions: [
      buy("acn_sie_v0", "inst_siemens", 0.2),
      buy("acn_nvda_v0", "inst_nvidia", 0.35),
    ],
  });

  it("passes the in-limit action", () => {
    const sie = report.checks.find((c) => c.actionId === "acn_sie_v0");
    expect(sie?.result).toBe("pass");
  });

  it("resizes the over-limit action to the 30% position limit", () => {
    const nvda = report.checks.find((c) => c.actionId === "acn_nvda_v0");
    expect(nvda?.result).toBe("resize");
    expect(nvda?.breachCode).toBe("POSITION_LIMIT_BREACH");
    expect(nvda?.resizedAmount?.amount).toBe(300);
    expect(nvda?.numbers.resizedWeight).toBe(0.3);
  });

  it("does not hard-block — a resize keeps the run going", () => {
    expect(report.hardBlocks).toEqual([]);
  });

  it("reports the current-vs-proposed comparison against the all-cash baseline", () => {
    expect(report.comparison.proposedInvested.amount).toBe(500);
    expect(report.comparison.proposedCash.amount).toBe(500);
  });

  it("surfaces cashRatio and turnover in the metrics", () => {
    expect(report.metrics.cashRatio).toBeCloseTo(0.5, 10);
    expect(report.metrics.turnover).toBe(0); // all-cash deploy → no sell-side churn
    expect(report.metrics.concentration).toBe(0.3);
  });

  it("produces a RiskReport that satisfies the core schema", () => {
    expect(RiskReportSchema.safeParse(report).success).toBe(true);
  });

  it("is deterministic — identical input yields identical output", () => {
    const again = evaluateProposal({
      portfolio: allCashPortfolio(),
      mandate: demoMandate(),
      instruments: INSTRUMENTS,
      actions: [
        buy("acn_sie_v0", "inst_siemens", 0.2),
        buy("acn_nvda_v0", "inst_nvidia", 0.35),
      ],
    });
    expect(again).toEqual(report);
  });
});

describe("evaluateProposal — deterministic hard blocks", () => {
  it("hard-blocks a sector breach with a reproducible number", () => {
    const report = evaluateProposal({
      portfolio: allCashPortfolio(),
      mandate: demoMandate(),
      instruments: INSTRUMENTS,
      // Two semiconductors at 0.30 + 0.20 = 0.50 > the 0.45 sector limit,
      // while each is within the 0.30 position limit.
      actions: [
        buy("acn_nvda", "inst_nvidia", 0.3),
        buy("acn_asml", "inst_asml", 0.2),
      ],
    });

    expect(report.hardBlocks).toContain("RISK_MANDATE_BREACH");
    const breach = report.checks.find((c) => c.id === "rsk_sector_Semiconductors");
    expect(breach?.result).toBe("reject");
    expect(breach?.numbers.sectorExposure).toBeCloseTo(0.5, 10);
    expect(breach?.numbers.sectorLimit).toBe(0.45);
  });

  it("hard-blocks and excludes a DATA_INVALID action (amount/weight mismatch)", () => {
    const report = evaluateProposal({
      portfolio: allCashPortfolio(),
      mandate: demoMandate(),
      instruments: INSTRUMENTS,
      actions: [
        {
          id: "acn_bad",
          instrumentId: "inst_siemens",
          side: "buy",
          targetWeight: 0.2,
          amount: { amount: 999, currency: "EUR" }, // should be ~200
          evidenceIds: [],
        },
      ],
    });

    const bad = report.checks.find((c) => c.actionId === "acn_bad");
    expect(bad?.result).toBe("reject");
    expect(bad?.breachCode).toBe("DATA_INVALID");
    expect(report.hardBlocks).toContain("DATA_INVALID");
    // Excluded from the proposed portfolio → nothing deployed.
    expect(report.comparison.proposedInvested.amount).toBe(0);
  });

  it("hard-blocks a cash-floor breach", () => {
    const report = evaluateProposal({
      portfolio: allCashPortfolio(),
      mandate: demoMandate(),
      instruments: INSTRUMENTS,
      // 0.30 + 0.30 + 0.30 + 0.10 = 1.00 invested → 0% cash < 10% floor.
      actions: [
        buy("a", "inst_nvidia", 0.3),
        buy("b", "inst_siemens", 0.3),
        buy("c", "inst_vestas", 0.3),
        buy("d", "inst_asml", 0.1),
      ],
    });
    const cash = report.checks.find((c) => c.id === "rsk_cash_floor");
    expect(cash?.breachCode).toBe("RISK_MANDATE_BREACH");
    expect(cash?.numbers.cashRatio).toBeCloseTo(0, 10);
  });

  it("reports a negative cashRatio on an over-invested proposal and still round-trips the schema", () => {
    const report = evaluateProposal({
      portfolio: allCashPortfolio(),
      mandate: demoMandate(),
      instruments: INSTRUMENTS,
      // 0.30 × 4 = 120% invested → cash ratio -0.20.
      actions: [
        buy("a", "inst_nvidia", 0.3),
        buy("b", "inst_siemens", 0.3),
        buy("c", "inst_vestas", 0.3),
        buy("d", "inst_asml", 0.3),
      ],
    });
    expect(report.metrics.cashRatio).toBeCloseTo(-0.2, 10);
    // The exact path that should yield a clean hard-block report must validate.
    expect(RiskReportSchema.safeParse(report).success).toBe(true);
    expect(report.checks.find((c) => c.id === "rsk_cash_floor")?.breachCode).toBe(
      "RISK_MANDATE_BREACH",
    );
  });

  it("is deterministic on a hard-block path", () => {
    const input = {
      portfolio: allCashPortfolio(),
      mandate: demoMandate(),
      instruments: INSTRUMENTS,
      actions: [buy("acn_nvda", "inst_nvidia", 0.3), buy("acn_asml", "inst_asml", 0.2)],
    };
    expect(evaluateProposal(input)).toEqual(evaluateProposal(input));
  });
});

describe("evaluateProposal — turnover is churn, not resulting size", () => {
  it("counts only the reduction when trimming an existing position", () => {
    // Hold 40% Nvidia, trim to 30%: churn is 10% of NAV, not the 30% target.
    const report = evaluateProposal({
      portfolio: portfolioWithPosition("inst_nvidia", 0.4),
      mandate: demoMandate(),
      instruments: INSTRUMENTS,
      actions: [
        {
          id: "acn_trim",
          instrumentId: "inst_nvidia",
          side: "sell",
          targetWeight: 0.3,
          amount: { amount: 300, currency: "EUR" },
          evidenceIds: [],
        },
      ],
    });
    expect(report.metrics.turnover).toBeCloseTo(0.1, 10);
    expect(report.hardBlocks).toEqual([]); // 10% < 20% turnover limit
  });

  it("hard-blocks when the reduction exceeds the turnover limit", () => {
    // Hold 40% Nvidia, cut to 10%: churn is 30% of NAV > the 20% limit.
    const report = evaluateProposal({
      portfolio: portfolioWithPosition("inst_nvidia", 0.4),
      mandate: demoMandate(),
      instruments: INSTRUMENTS,
      actions: [
        {
          id: "acn_cut",
          instrumentId: "inst_nvidia",
          side: "sell",
          targetWeight: 0.1,
          amount: { amount: 100, currency: "EUR" },
          evidenceIds: [],
        },
      ],
    });
    expect(report.metrics.turnover).toBeCloseTo(0.3, 10);
    expect(report.checks.find((c) => c.id === "rsk_turnover")?.breachCode).toBe(
      "RISK_MANDATE_BREACH",
    );
  });
});
