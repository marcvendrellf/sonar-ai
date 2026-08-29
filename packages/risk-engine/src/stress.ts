import type { Currency, StressResult } from "@sonar-ai/core";
import { portfolioBeta, type InstrumentStats } from "./metrics";
import type { WeightMap } from "./weights";

/**
 * A deterministic stress scenario. Either supply per-instrument return shocks
 * (fractions, e.g. -0.2 for -20%) or a broad `marketShock` applied through
 * portfolio beta. Per-instrument shocks take precedence where present.
 */
export interface StressScenario {
  name: string;
  shockByInstrument?: Record<string, number>;
  marketShock?: number;
}

/** Apply one stress scenario to a proposed weight map. */
export function runStressTest(
  weights: WeightMap,
  navAmount: number,
  currency: Currency,
  scenario: StressScenario,
  stats: InstrumentStats = {},
): StressResult {
  let pct = 0;
  const perInstrument = scenario.shockByInstrument ?? {};

  for (const [id, w] of weights) {
    if (id in perInstrument) {
      pct += w * (perInstrument[id] ?? 0);
    } else if (scenario.marketShock !== undefined) {
      pct += w * scenario.marketShock * (stats[id]?.beta ?? 1);
    }
  }

  const navImpact = pct * navAmount;
  return {
    scenario: scenario.name,
    navImpact: { amount: Math.round(navImpact * 100) / 100, currency },
    navImpactPct: pct,
  };
}
