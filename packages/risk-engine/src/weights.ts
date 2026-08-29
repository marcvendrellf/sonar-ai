import type { PortfolioSnapshot, ProposedAction } from "@sonar-ai/core";

/**
 * Risk math runs in weight-space (fractions of NAV), independent of prices.
 * A `ProposedAction.targetWeight` is the resulting weight for that instrument
 * after the action, so the proposed portfolio is the current position weights
 * overridden by any action targets.
 */
export type WeightMap = Map<string, number>;

/** Current weights per instrument from a portfolio snapshot. */
export function currentWeights(portfolio: PortfolioSnapshot): WeightMap {
  const map: WeightMap = new Map();
  for (const p of portfolio.positions) map.set(p.instrumentId, p.weight);
  return map;
}

/**
 * Proposed weights = current weights with each action's `targetWeight` applied
 * as the new absolute weight for its instrument. `overrides` lets the engine
 * substitute post-resize weights for specific actions.
 */
export function proposedWeights(
  portfolio: PortfolioSnapshot,
  actions: readonly ProposedAction[],
  overrides?: ReadonlyMap<string, number>,
): WeightMap {
  const map = currentWeights(portfolio);
  for (const a of actions) {
    const w = overrides?.get(a.id) ?? a.targetWeight;
    map.set(a.instrumentId, w);
  }
  return map;
}

/** Total invested weight (sum of all position weights). */
export function investedWeight(weights: WeightMap): number {
  let sum = 0;
  for (const w of weights.values()) sum += w;
  return sum;
}
