import "server-only";

import {
  AlpacaAccountResponseSchema,
  AlpacaOrderResponseSchema,
  AlpacaPaperOrderRequestSchema,
  AlpacaPositionsResponseSchema,
  normalizeAlpacaPaperPortfolio,
  type AlpacaOrderResponse,
  type AlpacaPaperOrderRequest,
  type AlpacaPaperPortfolioSnapshot,
} from "@sonar-ai/core/alpaca";

import type { AlpacaPaperConfig } from "./config";

const PAPER_API_BASE_URL = "https://paper-api.alpaca.markets/v2";

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
  ): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const response = await this.fetchImpl(`${PAPER_API_BASE_URL}${path}`, {
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
      const payload: unknown = await response.json();
      if (!response.ok) {
        throw new Error(`Alpaca Paper API request failed with HTTP ${response.status}`);
      }
      return schema.parse(payload);
    } finally {
      clearTimeout(timeout);
    }
  }
}
