import type { InvestmentCommitteeState } from "@sonar-ai/core";
import type { AlpacaPaperPortfolioSnapshot } from "@sonar-ai/core/alpaca";
import { describe, expect, it } from "vitest";
 
import { goldenState } from "../../../../../packages/core/src/__fixtures__/golden-state";
import {
  RISK_PRESET_LIMITS,
  alpacaSnapshotToPortfolio,
  buildIdleState,
  resolveRiskLimits,
} from "./build-state";

const scenario = goldenState as InvestmentCommitteeState;

describe("resolveRiskLimits", () => {
  it("returns the preset when no overrides are given", () => {
    expect(resolveRiskLimits({ riskTolerance: "aggressive" })).toEqual(
      RISK_PRESET_LIMITS.aggressive,
    );
  });

  it("lets overrides tighten but never widen the preset", () => {
    const limits = resolveRiskLimits({
      riskTolerance: "balanced",
      limits: {
        maxGrossExposurePerPosition: 0.9, // wider than preset -> clamped down
        minCashRatio: 0.5, // higher floor -> allowed
      },
    });
    expect(limits.maxGrossExposurePerPosition).toBe(
      RISK_PRESET_LIMITS.balanced.maxGrossExposurePerPosition,
    );
    expect(limits.minCashRatio).toBe(0.5);
  });
});

describe("buildIdleState", () => {
  it("assembles a valid idle state with a fresh id and preset-derived mandate", () => {
    const state = buildIdleState({
      scenario,
      riskPreferences: { riskTolerance: "conservative" },
      now: "2026-08-29T15:00:00Z",
      runId: "run_test1",
    });
    expect(state.phase).toBe("idle");
    expect(state.run.id).toBe("run_test1");
    expect(state.run.completedAt).toBeNull();
    expect(state.mandate.limits).toEqual(RISK_PRESET_LIMITS.conservative);
    // Scenario inputs are preserved.
    expect(state.candidateUniverse).toEqual(scenario.candidateUniverse);
    // Outputs are cleared.
    expect(state.finalRecommendation).toBeNull();
    expect(state.stages).toEqual([]);
  });

  it("keeps the scenario portfolio when the Alpaca currency doesn't match", () => {
    const usdSnapshot: AlpacaPaperPortfolioSnapshot = {
      provider: "alpaca",
      environment: "paper",
      source: "fixture",
      observedAt: "2026-08-29T10:00:00Z",
      accountCurrency: "USD",
      cashUsd: 100000,
      equityUsd: 100000,
      portfolioValueUsd: 100000,
      buyingPowerUsd: 100000,
      unrealizedPnlUsd: 0,
      tradingBlocked: false,
      accountBlocked: false,
      tradeSuspendedByUser: false,
      positions: [],
    };
    const state = buildIdleState({
      scenario, // EUR
      riskPreferences: { riskTolerance: "balanced" },
      alpacaSnapshot: usdSnapshot,
    });
    // EUR scenario kept, USD snapshot ignored (reconciliation is data-lane).
    expect(state.portfolioSnapshot.baseCurrency).toBe("EUR");
  });
});

describe("alpacaSnapshotToPortfolio", () => {
  const base = {
    provider: "alpaca" as const,
    environment: "paper" as const,
    source: "fixture" as const,
    observedAt: "2026-08-29T10:00:00Z",
    accountCurrency: "USD" as const,
    cashUsd: 100000,
    equityUsd: 100000,
    portfolioValueUsd: 100000,
    buyingPowerUsd: 100000,
    unrealizedPnlUsd: 0,
    tradingBlocked: false,
    accountBlocked: false,
    tradeSuspendedByUser: false,
  };

  it("maps an empty book to a cash-only USD portfolio", () => {
    const pf = alpacaSnapshotToPortfolio(
      { ...base, positions: [] },
      scenario.candidateUniverse,
    );
    expect(pf.baseCurrency).toBe("USD");
    expect(pf.cash.amount).toBe(100000);
    expect(pf.positions).toEqual([]);
  });

  it("throws on a held symbol outside the tradable universe", () => {
    expect(() =>
      alpacaSnapshotToPortfolio(
        {
          ...base,
          positions: [
            {
              assetId: "a1",
              symbol: "TSLA",
              quantity: 10,
              averageEntryPriceUsd: 200,
              marketValueUsd: 2200,
              costBasisUsd: 2000,
              unrealizedPnlUsd: 200,
              unrealizedPnlPct: 0.1,
              currentPriceUsd: 220,
            },
          ],
        },
        scenario.candidateUniverse,
      ),
    ).toThrow(/not in the tradable universe/);
  });
});
