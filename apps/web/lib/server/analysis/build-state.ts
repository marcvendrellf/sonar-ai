import { randomUUID } from "node:crypto";
import {
  DEMO_RISK_LIMITS,
  InvestmentCommitteeStateSchema,
  RiskLimitsSchema,
  type InvestmentCommitteeState,
  type PortfolioSnapshot,
  type RiskLimits,
} from "@sonar-ai/core";
import type { AlpacaPaperPortfolioSnapshot } from "@sonar-ai/core/alpaca";
import { z } from "zod";
import { resetToIdle } from "../runs/recording";

/**
 * The ONLY thing the human supplies to start a run: their risk appetite. The
 * committee chooses the companies (Cala discovery) — the user never picks
 * tickers. A preset maps to the four deterministic mandate limits; `limits`
 * lets an advanced caller override individual limits, but it can only make the
 * mandate tighter or equal, never wider than the preset — a request can't widen
 * risk beyond what the preset allows.
 */
export const RiskPreferencesSchema = z.object({
  riskTolerance: z
    .enum(["conservative", "balanced", "aggressive"])
    .default("balanced"),
  /** Optional per-limit overrides. Clamped to be no wider than the preset. */
  limits: RiskLimitsSchema.partial().optional(),
});
export type RiskPreferences = z.infer<typeof RiskPreferencesSchema>;

/**
 * Risk presets. `conservative` tightens every limit; `aggressive` loosens the
 * exposure/turnover ceilings and drops the cash floor. `balanced` is the demo
 * preset. None of these is investment advice — they are demo risk parameters.
 */
export const RISK_PRESET_LIMITS: Record<RiskPreferences["riskTolerance"], RiskLimits> = {
  conservative: {
    maxGrossExposurePerPosition: 0.15,
    maxSectorExposure: 0.3,
    minCashRatio: 0.25,
    maxTurnoverPerEvent: 0.1,
  },
  balanced: DEMO_RISK_LIMITS,
  aggressive: {
    maxGrossExposurePerPosition: 0.45,
    maxSectorExposure: 0.6,
    minCashRatio: 0.05,
    maxTurnoverPerEvent: 0.35,
  },
};

/**
 * Resolve the effective mandate limits. Overrides may only TIGHTEN the preset:
 * exposure/turnover ceilings are capped at the preset (min), and the cash floor
 * is raised to at least the preset (max). This guarantees a caller can never
 * use `limits` to widen risk past the preset it selected.
 */
export function resolveRiskLimits(prefs: RiskPreferences): RiskLimits {
  const preset = RISK_PRESET_LIMITS[prefs.riskTolerance];
  const o = prefs.limits;
  if (!o) return preset;
  return RiskLimitsSchema.parse({
    maxGrossExposurePerPosition: Math.min(
      preset.maxGrossExposurePerPosition,
      o.maxGrossExposurePerPosition ?? preset.maxGrossExposurePerPosition,
    ),
    maxSectorExposure: Math.min(
      preset.maxSectorExposure,
      o.maxSectorExposure ?? preset.maxSectorExposure,
    ),
    minCashRatio: Math.max(preset.minCashRatio, o.minCashRatio ?? preset.minCashRatio),
    maxTurnoverPerEvent: Math.min(
      preset.maxTurnoverPerEvent,
      o.maxTurnoverPerEvent ?? preset.maxTurnoverPerEvent,
    ),
  });
}

/**
 * Map a live Alpaca Paper snapshot (USD) to the core `PortfolioSnapshot` the
 * committee reasons over. Positions are resolved to core instrument ids via the
 * scenario universe (symbol match). An empty book — the demo starting state —
 * maps trivially. A held symbol that is not in the tradable universe is a hard
 * error: the committee must never reason over a position it can't identify.
 */
export function alpacaSnapshotToPortfolio(
  snapshot: AlpacaPaperPortfolioSnapshot,
  universe: InvestmentCommitteeState["candidateUniverse"],
): PortfolioSnapshot {
  const bySymbol = new Map(universe.map((i) => [i.symbol.toUpperCase(), i]));
  const nav = snapshot.portfolioValueUsd;
  const positions = snapshot.positions.map((position) => {
    const instrument = bySymbol.get(position.symbol.toUpperCase());
    if (!instrument) {
      throw new Error(
        `Alpaca holds "${position.symbol}", which is not in the tradable universe.`,
      );
    }
    return {
      instrumentId: instrument.id,
      quantity: position.quantity,
      avgPrice: { amount: position.averageEntryPriceUsd, currency: "USD" as const },
      marketValue: { amount: position.marketValueUsd, currency: "USD" as const },
      weight: nav > 0 ? position.marketValueUsd / nav : 0,
    };
  });
  return {
    id: `pf_alpaca_${snapshot.observedAt}`,
    asOf: snapshot.observedAt,
    baseCurrency: "USD",
    cash: { amount: snapshot.cashUsd, currency: "USD" },
    nav: { amount: nav, currency: "USD" },
    positions,
    label: snapshot.source === "live" ? "live" : "synthetic",
  };
}

export interface BuildIdleStateInput {
  /**
   * A validated committee state used as the analysis SCENARIO: it supplies the
   * tradable universe, market snapshot, discovered evidence and relationship
   * graph, and material events. Any phase is accepted — it is reset to idle.
   * (For the live path this is where Cala discovery + the Alpaca asset universe
   * are wired in; today the golden fixture stands in.)
   */
  scenario: InvestmentCommitteeState;
  riskPreferences: RiskPreferences;
  /**
   * A live/loaded Alpaca portfolio to run against. Used only when its currency
   * matches the scenario base currency; otherwise the scenario portfolio is
   * kept (USD-vs-EUR reconciliation is data-lane work, not decided here).
   */
  alpacaSnapshot?: AlpacaPaperPortfolioSnapshot;
  /** Run provenance label. Defaults to "synthetic". */
  label?: InvestmentCommitteeState["run"]["label"];
  /** Injectable clock/id for deterministic tests. */
  now?: string;
  runId?: string;
}

/**
 * Assemble a fresh, idle `InvestmentCommitteeState` ready for the orchestrator:
 * scenario inputs + a mandate derived from the user's risk preferences + the
 * portfolio to trade. The result is schema-validated, so a malformed scenario
 * or portfolio fails here rather than mid-run.
 */
export function buildIdleState(input: BuildIdleStateInput): InvestmentCommitteeState {
  const base = resetToIdle(input.scenario);
  const now = input.now ?? new Date().toISOString();
  const runId = input.runId ?? `run_${randomUUID()}`;

  const scenarioCurrency = base.portfolioSnapshot.baseCurrency;
  const useAlpaca =
    input.alpacaSnapshot !== undefined &&
    input.alpacaSnapshot.accountCurrency === scenarioCurrency;
  const portfolio = useAlpaca
    ? alpacaSnapshotToPortfolio(input.alpacaSnapshot!, base.candidateUniverse)
    : base.portfolioSnapshot;

  const limits = resolveRiskLimits(input.riskPreferences);

  const state: InvestmentCommitteeState = {
    ...base,
    run: {
      id: runId,
      scenarioId: base.run.scenarioId,
      startedAt: now,
      completedAt: null,
      label: input.label ?? "synthetic",
    },
    phase: "idle",
    portfolioSnapshot: portfolio,
    mandate: {
      ...base.mandate,
      id: `mnd_${runId}`,
      baseCurrency: portfolio.baseCurrency,
      initialCash: portfolio.cash,
      limits,
    },
  };

  return InvestmentCommitteeStateSchema.parse(state);
}
