import type {
  Instrument,
  Mandate,
  PortfolioSnapshot,
  ProposedAction,
  RiskBreachCode,
  RiskCheck,
  RiskReport,
} from "@sonar-ai/core";
import { comparePortfolios } from "./compare";
import { computeMetrics, type InstrumentStats } from "./metrics";
import { applyPositionLimit } from "./rules/position-limit";
import {
  checkCashFloor,
  checkSectorLimits,
  checkTurnover,
} from "./rules/portfolio-limits";
import { validateAction } from "./rules/validate";
import { runStressTest, type StressScenario } from "./stress";
import { investedWeight, proposedWeights } from "./weights";

export interface EvaluateInput {
  portfolio: PortfolioSnapshot;
  mandate: Mandate;
  actions: readonly ProposedAction[];
  instruments: readonly Instrument[];
  instrumentStats?: InstrumentStats;
  stressScenarios?: readonly StressScenario[];
  /** Stable id for the produced report (the Risk Officer stage assigns one). */
  reportId?: string;
}

/**
 * The deterministic Risk Officer. Pure: no IO, no clock, no randomness — the
 * same input always yields the same {@link RiskReport}.
 *
 * Enforcement model:
 * - DATA_INVALID  → the action is rejected and excluded; a hard block.
 * - POSITION_LIMIT_BREACH → the action is resized to the limit (soft, the run
 *   continues).
 * - RISK_MANDATE_BREACH (sector / cash floor / turnover) → a hard block that
 *   stops the proposal for Portfolio Manager revision.
 *
 * `numbers` on every check carries the reproducible figures behind the verdict.
 */
export function evaluateProposal(input: EvaluateInput): RiskReport {
  const {
    portfolio,
    mandate,
    actions,
    instruments,
    instrumentStats = {},
    stressScenarios = [],
    reportId = "risk_report",
  } = input;

  const nav = portfolio.nav.amount;
  const currency = portfolio.baseCurrency;

  const checks: RiskCheck[] = [];
  const hardBlocks = new Set<RiskBreachCode>();
  const overrides = new Map<string, number>();
  const appliedActions: ProposedAction[] = [];
  let sellNotional = 0;

  // ── Per-action checks ──────────────────────────────────────────────────────
  for (const action of actions) {
    const check: RiskCheck = {
      id: `rsk_${action.id}`,
      actionId: action.id,
      result: "pass",
      detail: "",
      numbers: {},
    };

    const validation = validateAction(action, mandate, nav);
    if (!validation.ok) {
      check.result = "reject";
      check.breachCode = "DATA_INVALID";
      check.detail = validation.detail;
      check.numbers = validation.numbers;
      hardBlocks.add("DATA_INVALID");
      checks.push(check);
      continue; // excluded from the proposed portfolio
    }

    const pl = applyPositionLimit(action, mandate, nav);
    if (pl.resized) {
      check.result = "resize";
      check.breachCode = "POSITION_LIMIT_BREACH";
      check.detail = `${action.instrumentId} ${pct(pl.numbers.proposedWeight)} exceeds the ${pct(
        pl.numbers.positionLimit,
      )} max-position limit; resized to ${pct(pl.numbers.resizedWeight)}.`;
      check.numbers = pl.numbers;
      check.resizedAmount = { amount: pl.amount, currency };
      overrides.set(action.id, pl.weight);
    } else {
      check.result = "pass";
      check.detail = `${action.instrumentId} ${pct(action.targetWeight)} within limits.`;
      check.numbers = pl.numbers;
    }

    if (action.side === "sell") sellNotional += pl.amount;
    appliedActions.push(action);
    checks.push(check);
  }

  // ── Portfolio-level view (post-resize, valid actions only) ─────────────────
  const proposed = proposedWeights(portfolio, appliedActions, overrides);
  const metrics = computeMetrics(proposed, instruments, instrumentStats);
  const comparison = comparePortfolios(portfolio, proposed);
  const invested = investedWeight(proposed);

  for (const breach of checkSectorLimits(metrics.sectorExposure, mandate)) {
    checks.push({
      id: `rsk_sector_${breach.sector}`,
      actionId: "portfolio",
      result: "reject",
      breachCode: "RISK_MANDATE_BREACH",
      detail: `Sector ${breach.sector} exposure ${pct(breach.exposure)} exceeds the ${pct(
        breach.limit,
      )} sector limit.`,
      numbers: { sectorExposure: breach.exposure, sectorLimit: breach.limit },
    });
    hardBlocks.add("RISK_MANDATE_BREACH");
  }

  const cash = checkCashFloor(invested, mandate);
  if (!cash.ok) {
    checks.push({
      id: "rsk_cash_floor",
      actionId: "portfolio",
      result: "reject",
      breachCode: "RISK_MANDATE_BREACH",
      detail: `Cash ratio ${pct(cash.cashRatio)} is below the ${pct(cash.minCashRatio)} floor.`,
      numbers: { cashRatio: cash.cashRatio, minCashRatio: cash.minCashRatio },
    });
    hardBlocks.add("RISK_MANDATE_BREACH");
  }

  const turnover = checkTurnover(sellNotional, nav, mandate);
  if (!turnover.ok) {
    checks.push({
      id: "rsk_turnover",
      actionId: "portfolio",
      result: "reject",
      breachCode: "RISK_MANDATE_BREACH",
      detail: `Turnover ${pct(turnover.turnover)} exceeds the ${pct(turnover.maxTurnover)} per-event limit.`,
      numbers: { turnover: turnover.turnover, maxTurnover: turnover.maxTurnover },
    });
    hardBlocks.add("RISK_MANDATE_BREACH");
  }

  const stress = stressScenarios.map((s) =>
    runStressTest(proposed, nav, currency, s, instrumentStats),
  );

  return {
    id: reportId,
    metrics,
    stress,
    checks,
    comparison,
    hardBlocks: [...hardBlocks],
  };
}

/** Format a ratio as a whole-percent string for human-readable detail lines. */
function pct(ratio: number | undefined): string {
  return `${Math.round((ratio ?? 0) * 100)}%`;
}
