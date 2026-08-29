import {
  AlpacaAssetsResponseSchema,
  AlpacaOrderResponseSchema,
  AlpacaPaperOrderRequestSchema,
  normalizeAlpacaPaperPortfolio,
  type AlpacaOrderResponse,
  type AlpacaPaperOrderRequest,
  type AlpacaPaperPortfolioSnapshot,
  type AlpacaBar,
  type AlpacaQuote,
} from "@sonar-ai/core/alpaca";
import fixture from "../../../fixtures/alpaca-paper-account.json";

/** Deterministic broker seam for offline demo and integration tests. */
export class FixtureAlpacaPaperProvider {
  readonly mode = "fixture" as const;

  async getPortfolioSnapshot(): Promise<AlpacaPaperPortfolioSnapshot> {
    return normalizeAlpacaPaperPortfolio(fixture.account, fixture.positions, {
      source: "fixture",
      observedAt: fixture.observedAt,
    });
  }

  async listTradableAssets() {
    return AlpacaAssetsResponseSchema.parse(fixture.assets).filter((asset) => asset.tradable);
  }

  async getLatestQuotes(symbols: readonly string[]): Promise<AlpacaQuote[]> {
    return symbols.flatMap((symbol) => {
      const quote = fixture.quotes[symbol as keyof typeof fixture.quotes];
      return quote ? [{ symbol, bidPrice: quote.bidPrice, askPrice: quote.askPrice, timestamp: quote.timestamp }] : [];
    });
  }

  async getPriceHistory(symbol: string): Promise<AlpacaBar[]> {
    return (fixture.priceHistory[symbol as keyof typeof fixture.priceHistory] ?? []).map((bar) => ({ ...bar }));
  }

  async submitPaperOrder(input: AlpacaPaperOrderRequest): Promise<AlpacaOrderResponse> {
    const order = AlpacaPaperOrderRequestSchema.parse(input);
    const asset = (await this.listTradableAssets()).find((candidate) => candidate.symbol === order.symbol);
    if (!asset) throw new Error(`Fixture Alpaca asset is not tradable: ${order.symbol}`);
    const template = fixture.orders.accepted;
    return AlpacaOrderResponseSchema.parse({
      ...template,
      id: `${template.id}-${order.client_order_id ?? "no-client-id"}`,
      client_order_id: order.client_order_id ?? template.client_order_id,
      symbol: order.symbol,
      side: order.side,
      qty: order.qty ?? template.qty,
      notional: order.notional ?? template.notional,
    });
  }
}
