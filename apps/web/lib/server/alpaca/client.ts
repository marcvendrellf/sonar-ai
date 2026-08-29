import "server-only"

import {
  AlpacaAccountResponseSchema,
  AlpacaOrderResponseSchema,
  AlpacaPaperOrderRequestSchema,
  AlpacaPositionsResponseSchema,
  normalizeAlpacaPaperPortfolio,
  type AlpacaPaperOrderRequest,
  type AlpacaPaperPortfolioSnapshot,
  type AlpacaOrderResponse,
} from "@sonar-ai/core/alpaca"

const PAPER_API_BASE_URL = "https://paper-api.alpaca.markets/v2"

type AlpacaClientConfig = {
  apiKey: string
  secretKey: string
  timeoutMs?: number
  fetchImpl?: typeof fetch
}

export class AlpacaPaperClient {
  private readonly config: Required<Omit<AlpacaClientConfig, "fetchImpl">> & {
    fetchImpl: typeof fetch
  }

  constructor(config: AlpacaClientConfig) {
    this.config = {
      apiKey: config.apiKey,
      secretKey: config.secretKey,
      timeoutMs: config.timeoutMs ?? 15_000,
      fetchImpl: config.fetchImpl ?? fetch,
    }
  }

  async getPortfolioSnapshot(): Promise<AlpacaPaperPortfolioSnapshot> {
    const [account, positions] = await Promise.all([
      this.request("/account", AlpacaAccountResponseSchema),
      this.request("/positions", AlpacaPositionsResponseSchema),
    ])

    return normalizeAlpacaPaperPortfolio(account, positions, { source: "live" })
  }

  /** Submit only to Alpaca's fixed paper endpoint. Caller must enforce approval and risk gates. */
  async submitPaperOrder(input: AlpacaPaperOrderRequest): Promise<AlpacaOrderResponse> {
    const order = AlpacaPaperOrderRequestSchema.parse(input)
    const response = await this.request("/orders", AlpacaOrderResponseSchema, {
      method: "POST",
      body: JSON.stringify({
        ...order,
        qty: order.qty?.toString(),
        notional: order.notional?.toString(),
        limit_price: order.limit_price?.toString(),
        stop_price: order.stop_price?.toString(),
      }),
    })

    return response
  }

  private async request<T>(
    path: string,
    schema: { parse: (value: unknown) => T },
    init: RequestInit = {},
  ): Promise<T> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs)

    try {
      const response = await this.config.fetchImpl(`${PAPER_API_BASE_URL}${path}`, {
        ...init,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "APCA-API-KEY-ID": this.config.apiKey,
          "APCA-API-SECRET-KEY": this.config.secretKey,
          ...init.headers,
        },
        signal: controller.signal,
      })

      if (!response.ok) {
        throw new Error(`Alpaca paper API request failed with HTTP ${response.status}`)
      }

      return schema.parse(await response.json())
    } finally {
      clearTimeout(timeout)
    }
  }
}
