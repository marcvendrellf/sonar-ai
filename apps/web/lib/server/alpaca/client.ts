import "server-only";
import { z } from "zod";

import {
  AlpacaAccountResponseSchema,
  AlpacaAssetsResponseSchema,
  AlpacaBarSchema,
  AlpacaQuoteSchema,
  AlpacaOrderResponseSchema,
  AlpacaPaperOrderRequestSchema,
  AlpacaPositionsResponseSchema,
  normalizeAlpacaPaperPortfolio,
  type AlpacaOrderResponse,
  type AlpacaPaperOrderRequest,
  type AlpacaPaperPortfolioSnapshot,
  type AlpacaBar,
  type AlpacaQuote,
} from "@sonar-ai/core/alpaca";

import type { AlpacaPaperConfig } from "./config";

const PAPER_API_BASE_URL = "https://paper-api.alpaca.markets/v2";
// Market data (quotes, bars) is served from a DIFFERENT host than the paper
// trading/account API — hitting paper-api for it returns 404 "Not Found".
const DATA_API_BASE_URL = "https://data.alpaca.markets/v2";

export interface AlpacaPaperClientOptions extends AlpacaPaperConfig {
  fetchImpl?: typeof fetch;
}

export class AlpacaPaperClient {
  private readonly fetchImpl: typeof fetch;

  constructor(private readonly config: AlpacaPaperClientOptions) {
    this.fetchImpl = config.fetchImpl ?? fetch;
  }

  async getPortfolioSnapshot(): Promise<AlpacaPaperPortfolioSnapshot> {
    const [account, positions] = await Promise.all([
      this.request("/account", AlpacaAccountResponseSchema),
      this.request("/positions", AlpacaPositionsResponseSchema),
    ]);

    return normalizeAlpacaPaperPortfolio(account, positions, { source: "live" });
  }

  async listTradableAssets() {
    const assets = await this.request("/assets?status=active&tradable=true", AlpacaAssetsResponseSchema);
    return assets.filter((asset) => asset.tradable);
  }

  async getLatestQuotes(symbols: readonly string[]): Promise<AlpacaQuote[]> {
    if (symbols.length === 0) return [];
    const payload = await this.request(`/stocks/quotes/latest?symbols=${encodeURIComponent(symbols.join(","))}`, z.object({ quotes: z.record(z.string(), z.object({ bp: z.number().nonnegative(), ap: z.number().nonnegative(), t: z.string().datetime({ offset: true }) })) }).transform((r) => r.quotes), {}, DATA_API_BASE_URL);
    return Object.entries(payload).map(([symbol, quote]) => AlpacaQuoteSchema.parse({ symbol, bidPrice: quote.bp, askPrice: quote.ap, timestamp: quote.t }));
  }

  async getPriceHistory(symbol: string, start: string, end?: string, limit = 100): Promise<AlpacaBar[]> {
    const params = new URLSearchParams({ timeframe: "1Day", start, limit: String(limit), adjustment: "all" });
    if (end) params.set("end", end);
    const payload = await this.request(`/stocks/${encodeURIComponent(symbol)}/bars?${params.toString()}`, z.object({ bars: z.array(z.object({ t: z.string().datetime({ offset: true }), c: z.number().nonnegative() })).nullable().transform((b) => b ?? []) }), {}, DATA_API_BASE_URL);
    return payload.bars.map((bar) => AlpacaBarSchema.parse({ timestamp: bar.t, close: bar.c }));
  }

  /** Caller must enforce evidence, risk, and human approval gates first. */
  async submitPaperOrder(input: AlpacaPaperOrderRequest): Promise<AlpacaOrderResponse> {
    const order = AlpacaPaperOrderRequestSchema.parse(input);
    return this.request(
      "/orders",
      AlpacaOrderResponseSchema,
      {
        method: "POST",
        body: JSON.stringify({
          ...order,
          qty: order.qty?.toString(),
          notional: order.notional?.toString(),
          limit_price: order.limit_price?.toString(),
          stop_price: order.stop_price?.toString(),
        }),
      },
    );
  }

  private async request<T>(
    path: string,
    schema: { parse: (value: unknown) => T },
    init: RequestInit = {},
    baseUrl: string = PAPER_API_BASE_URL,
  ): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const response = await this.fetchImpl(`${baseUrl}${path}`, {
        ...init,
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "APCA-API-KEY-ID": this.config.apiKey,
          "APCA-API-SECRET-KEY": this.config.secretKey,
          ...init.headers,
        },
      });
      // Check status BEFORE parsing: an error body may be plain text ("Not
      // Found"), which would otherwise crash JSON parsing and hide the status.
      if (!response.ok) {
        const detail = await response.text().catch(() => "");
        if (detail) console.error(`[AlpacaClient] ${path} -> ${response.status}: ${detail.slice(0, 300)}`);
        throw new Error(`Alpaca API request failed with HTTP ${response.status}`);
      }
      return schema.parse(await response.json());
    } finally {
      clearTimeout(timeout);
    }
  }
}
