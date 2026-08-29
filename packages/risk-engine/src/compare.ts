import type {
  Currency,
  PortfolioComparison,
  PortfolioSnapshot,
} from "@sonar-ai/core";
import { currentWeights, investedWeight, type WeightMap } from "./weights";

/** Round to cents to keep money math free of float dust. */
function money(amount: number, currency: Currency) {
  return { amount: Math.round(amount * 100) / 100, currency };
}

/**
 * Deterministic current-versus-proposed comparison. For the MVP baseline this
 * compares the all-cash portfolio against the proposed allocation and the cash
 * it retains.
 */
export function comparePortfolios(
  current: PortfolioSnapshot,
  proposed: WeightMap,
): PortfolioComparison {
  const nav = current.nav.amount;
  const currency = current.baseCurrency;
  const invested = investedWeight(proposed);

  const cur = currentWeights(current);
  const instrumentIds = new Set<string>([...cur.keys(), ...proposed.keys()]);

  const deltas = [...instrumentIds]
    .map((instrumentId) => ({
      instrumentId,
      currentWeight: cur.get(instrumentId) ?? 0,
      proposedWeight: proposed.get(instrumentId) ?? 0,
    }))
    .filter((d) => d.currentWeight !== 0 || d.proposedWeight !== 0)
    .sort((a, b) => a.instrumentId.localeCompare(b.instrumentId));

  return {
    currentNav: money(nav, currency),
    proposedInvested: money(invested * nav, currency),
    proposedCash: money((1 - invested) * nav, currency),
    deltas,
  };
}
