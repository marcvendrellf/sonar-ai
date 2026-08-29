import { describe, expect, it } from "vitest";
import { runStressTest } from "../stress";
import type { WeightMap } from "../weights";

const WEIGHTS: WeightMap = new Map([
  ["inst_nvidia", 0.3],
  ["inst_siemens", 0.2],
]);

describe("runStressTest", () => {
  it("applies per-instrument shocks weighted by position size", () => {
    const result = runStressTest(WEIGHTS, 1000, "EUR", {
      name: "NVDA -20%",
      shockByInstrument: { inst_nvidia: -0.2 },
    });
    // 0.30 × -0.20 = -0.06 ; -0.06 × 1000 = -60
    expect(result.navImpactPct).toBeCloseTo(-0.06, 10);
    expect(result.navImpact.amount).toBeCloseTo(-60, 10);
    expect(result.scenario).toBe("NVDA -20%");
  });

  it("applies a broad market shock through instrument beta", () => {
    const result = runStressTest(
      WEIGHTS,
      1000,
      "EUR",
      { name: "Market -10%", marketShock: -0.1 },
      {
        inst_nvidia: { volatility: 0, beta: 1.5 },
        inst_siemens: { volatility: 0, beta: 0.8 },
      },
    );
    // 0.30×-0.1×1.5 + 0.20×-0.1×0.8 = -0.045 - 0.016 = -0.061
    expect(result.navImpactPct).toBeCloseTo(-0.061, 10);
    expect(result.navImpact.amount).toBeCloseTo(-61, 10);
  });

  it("prefers a per-instrument shock over the market shock where both apply", () => {
    const result = runStressTest(
      WEIGHTS,
      1000,
      "EUR",
      { name: "mixed", marketShock: -0.1, shockByInstrument: { inst_nvidia: -0.5 } },
      { inst_siemens: { volatility: 0, beta: 1 } },
    );
    // Nvidia uses -0.5 explicitly; Siemens falls back to market×beta.
    // 0.30×-0.5 + 0.20×-0.1×1 = -0.15 - 0.02 = -0.17
    expect(result.navImpactPct).toBeCloseTo(-0.17, 10);
  });
});
