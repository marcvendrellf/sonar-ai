import type { Instrument } from "@sonar-ai/core";
import { describe, expect, it } from "vitest";
import { computeMetrics, concentration } from "../metrics";

const INSTRUMENTS: Instrument[] = [
  { id: "a", symbol: "A", name: "A", sector: "Tech", assetClass: "equity", currency: "EUR" },
  { id: "b", symbol: "B", name: "B", sector: "Tech", assetClass: "equity", currency: "EUR" },
  { id: "c", symbol: "C", name: "C", sector: "Energy", assetClass: "equity", currency: "EUR" },
];

describe("metrics", () => {
  it("aggregates sector exposure across instruments", () => {
    const weights = new Map([
      ["a", 0.2],
      ["b", 0.1],
      ["c", 0.25],
    ]);
    const m = computeMetrics(weights, INSTRUMENTS);
    expect(m.sectorExposure.Tech).toBeCloseTo(0.3, 10);
    expect(m.sectorExposure.Energy).toBeCloseTo(0.25, 10);
  });

  it("reports concentration as the largest single-position weight", () => {
    expect(concentration(new Map([["a", 0.2], ["c", 0.25]]))).toBe(0.25);
    expect(concentration(new Map())).toBe(0);
  });

  it("computes weight-weighted beta and volatility from instrument stats", () => {
    const weights = new Map([
      ["a", 0.5],
      ["c", 0.25],
    ]);
    const m = computeMetrics(weights, INSTRUMENTS, {
      a: { volatility: 0.4, beta: 2 },
      c: { volatility: 0.2, beta: 1 },
    });
    // beta = 0.5*2 + 0.25*1 = 1.25 ; vol = 0.5*0.4 + 0.25*0.2 = 0.25
    expect(m.beta).toBeCloseTo(1.25, 10);
    expect(m.volatility).toBeCloseTo(0.25, 10);
  });
});
