import { describe, expect, it, vi } from "vitest";
import { AlpacaPaperClient } from "./client";

const config = { apiKey: "fixture-key", secretKey: "fixture-secret", timeoutMs: 1000 };

function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

describe("AlpacaPaperClient", () => {
  it("reads account and positions from fixed Paper endpoint", async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(response({ id: "acct", status: "ACTIVE", currency: "USD", cash: "1000", equity: "1000", portfolio_value: "1000", buying_power: "1000", trading_blocked: false, account_blocked: false, trade_suspended_by_user: false }))
      .mockResolvedValueOnce(response([]));
    const snapshot = await new AlpacaPaperClient({ ...config, fetchImpl }).getPortfolioSnapshot();
    expect(snapshot.accountCurrency).toBe("USD");
    expect(snapshot.cashUsd).toBe(1000);
    expect(fetchImpl.mock.calls.map(([url]) => url)).toEqual([
      "https://paper-api.alpaca.markets/v2/account",
      "https://paper-api.alpaca.markets/v2/positions",
    ]);
  });

  it("normalizes assets, quotes, and daily bars", async () => {
    const asset = { id: "asset", class: "us_equity", exchange: "NASDAQ", symbol: "NVDA", name: "NVIDIA", status: "active", tradable: true };
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(response([asset]))
      .mockResolvedValueOnce(response({ NVDA: { bp: 100, ap: 101, t: "2026-08-29T14:00:00.000Z" } }))
      .mockResolvedValueOnce(response({ bars: [{ t: "2026-08-28T20:00:00.000Z", c: 100.5 }] }));
    const client = new AlpacaPaperClient({ ...config, fetchImpl });
    await expect(client.listTradableAssets()).resolves.toHaveLength(1);
    await expect(client.getLatestQuotes(["NVDA"])).resolves.toEqual([{ symbol: "NVDA", bidPrice: 100, askPrice: 101, timestamp: "2026-08-29T14:00:00.000Z" }]);
    await expect(client.getPriceHistory("NVDA", "2026-08-01T00:00:00.000Z")).resolves.toEqual([{ timestamp: "2026-08-28T20:00:00.000Z", close: 100.5 }]);
  });

  it("submits only validated Paper orders with serialized numeric fields", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(response({ id: "order", client_order_id: "action-1", symbol: "NVDA", side: "buy", type: "market", status: "accepted", notional: "100", filled_qty: "0", filled_avg_price: null }));
    const order = await new AlpacaPaperClient({ ...config, fetchImpl }).submitPaperOrder({ symbol: "NVDA", notional: 100, side: "buy", type: "market", time_in_force: "day", client_order_id: "action-1" });
    expect(order.status).toBe("accepted");
    const [url, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://paper-api.alpaca.markets/v2/orders");
    expect(JSON.parse(String(init.body))).toMatchObject({ symbol: "NVDA", notional: "100", side: "buy", type: "market", time_in_force: "day", client_order_id: "action-1" });
  });

  it("rejects malformed broker responses", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(response({ nope: true }));
    await expect(new AlpacaPaperClient({ ...config, fetchImpl }).listTradableAssets()).rejects.toThrow();
  });
});
