import { describe, expect, it } from "vitest";
import { FixtureAlpacaPaperProvider } from "./fixture-provider";

describe("FixtureAlpacaPaperProvider", () => {
  it("returns validated USD paper account and positions snapshot", async () => {
    const snapshot = await new FixtureAlpacaPaperProvider().getPortfolioSnapshot();
    expect(snapshot.source).toBe("fixture");
    expect(snapshot.environment).toBe("paper");
    expect(snapshot.accountCurrency).toBe("USD");
    expect(snapshot.positions).toEqual([]);
  });

  it("exposes only tradable assets to candidate discovery", async () => {
    const assets = await new FixtureAlpacaPaperProvider().listTradableAssets();
    expect(assets.map((asset) => asset.symbol)).toEqual(["NVDA", "ASML", "SIEGY"]);
    expect(assets.every((asset) => asset.tradable)).toBe(true);
  });

  it("returns deterministic accepted Paper order with caller correlation id", async () => {
    const order = await new FixtureAlpacaPaperProvider().submitPaperOrder({
      symbol: "NVDA",
      notional: 100,
      side: "buy",
      type: "market",
      time_in_force: "day",
      client_order_id: "acn_nvda_r1",
    });
    expect(order.status).toBe("accepted");
    expect(order.client_order_id).toBe("acn_nvda_r1");
    expect(order.symbol).toBe("NVDA");
  });

  it("rejects non-tradable symbols before any broker mutation", async () => {
    await expect(new FixtureAlpacaPaperProvider().submitPaperOrder({
      symbol: "HALT",
      notional: 100,
      side: "buy",
      type: "market",
      time_in_force: "day",
      client_order_id: "blocked",
    })).rejects.toThrow("not tradable");
  });
});
