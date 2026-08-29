import type { AlpacaPaperPortfolioSnapshot, AlpacaQuote } from "@sonar-ai/core/alpaca";
import { describe, expect, it } from "vitest";
import { DEMO_UNIVERSE, assembleLiveScenario } from "./universe";

const account: AlpacaPaperPortfolioSnapshot = {
  provider: "alpaca",
  environment: "paper",
  source: "live",
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

const quote = (symbol: string, bid: number, ask: number): AlpacaQuote => ({
  symbol,
  bidPrice: bid,
  askPrice: ask,
  timestamp: "2026-08-29T10:00:00Z",
});

describe("DEMO_UNIVERSE", () => {
  it("is a broad, unique, USD watchlist with sectors", () => {
    expect(DEMO_UNIVERSE.length).toBeGreaterThan(20);
    expect(new Set(DEMO_UNIVERSE.map((i) => i.symbol)).size).toBe(DEMO_UNIVERSE.length);
    expect(DEMO_UNIVERSE.every((i) => i.currency === "USD" && i.sector.length > 0)).toBe(true);
    // Multiple sectors so the sector-exposure limit is meaningful.
    expect(new Set(DEMO_UNIVERSE.map((i) => i.sector)).size).toBeGreaterThan(4);
  });
});

describe("assembleLiveScenario", () => {
  it("keeps only quoted names and builds a valid idle USD scenario", () => {
    const state = assembleLiveScenario({
      account,
      quotes: [quote("NVDA", 200, 202), quote("VST", 100, 0), quote("ZZZ", 0, 0)],
      now: "2026-08-29T10:00:00Z",
    });
    expect(state.phase).toBe("idle");
    expect(state.mandate.baseCurrency).toBe("USD");
    // NVDA (mid 201) and VST (ask 0 -> falls back to bid 100) are priced; ZZZ is dropped.
    const symbols = state.candidateUniverse.map((i) => i.symbol).sort();
    expect(symbols).toEqual(["NVDA", "VST"]);
    const nvda = state.marketSnapshot!.quotes.find((q) => q.instrumentId === "inst_nvda");
    expect(nvda?.price).toBe(201);
    expect(state.portfolioSnapshot.cash.amount).toBe(100000);
    expect(state.evidence).toHaveLength(1);
    expect(state.materialEvents[0]!.evidenceIds).toContain(state.evidence[0]!.id);
  });

  it("throws when no symbol is priced", () => {
    expect(() => assembleLiveScenario({ account, quotes: [quote("ZZZ", 0, 0)], now: "2026-08-29T10:00:00Z" }))
      .toThrow(/usable Alpaca quote/);
  });
});
