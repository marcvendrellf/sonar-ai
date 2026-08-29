import type { Instrument, RiskMetrics } from "@sonar-ai/core";
import type { WeightMap } from "./weights";

/**
 * The weight-derived subset of {@link RiskMetrics}. `cashRatio` and `turnover`
 * are mandate-compliance figures the engine adds once it knows the invested
 * total and sell-side notional, so `computeMetrics` returns everything else.
 */
export type PortfolioRiskMetrics = Omit<RiskMetrics, "cashRatio" | "turnover">;

/**
 * Optional per-instrument risk statistics. Absent an entry, an instrument is
 * treated as beta 1.0, volatility 0. These feed simplified portfolio metrics.
 */
export type InstrumentStats = Record<
  string,
  { volatility: number; beta: number }
>;

function sectorOf(instrumentId: string, instruments: readonly Instrument[]): string {
  return instruments.find((i) => i.id === instrumentId)?.sector ?? "Unknown";
}

/** Exposure by sector name, each a fraction of NAV. */
export function sectorExposure(
  weights: WeightMap,
  instruments: readonly Instrument[],
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [instrumentId, w] of weights) {
    if (w === 0) continue;
    const sector = sectorOf(instrumentId, instruments);
    out[sector] = (out[sector] ?? 0) + w;
  }
  return out;
}

/** Concentration = the largest single-position weight (0 for an empty book). */
export function concentration(weights: WeightMap): number {
  let max = 0;
  for (const w of weights.values()) max = Math.max(max, w);
  return max;
}

/**
 * Simplified portfolio beta: the weight-weighted average of instrument betas.
 * MVP metric — it is not a covariance model, and it is labeled as such in docs.
 */
export function portfolioBeta(weights: WeightMap, stats: InstrumentStats): number {
  let beta = 0;
  for (const [id, w] of weights) beta += w * (stats[id]?.beta ?? 1);
  return beta;
}

/**
 * Simplified portfolio volatility: the weight-weighted average of instrument
 * volatilities. MVP metric, not a covariance-based figure.
 */
export function portfolioVolatility(
  weights: WeightMap,
  stats: InstrumentStats,
): number {
  let vol = 0;
  for (const [id, w] of weights) vol += w * (stats[id]?.volatility ?? 0);
  return vol;
}

/**
 * Compute the weight-derived metrics for a proposed weight map. The engine
 * augments the result with `cashRatio` and `turnover` to form a full
 * {@link RiskMetrics}.
 */
export function computeMetrics(
  weights: WeightMap,
  instruments: readonly Instrument[],
  stats: InstrumentStats = {},
): PortfolioRiskMetrics {
  return {
    volatility: portfolioVolatility(weights, stats),
    beta: portfolioBeta(weights, stats),
    concentration: concentration(weights),
    sectorExposure: sectorExposure(weights, instruments),
  };
}
