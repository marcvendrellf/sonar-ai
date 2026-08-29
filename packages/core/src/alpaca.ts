import { z } from "zod"

const numericString = z.coerce.number().finite()

export const AlpacaEnvironmentSchema = z.literal("paper")
export type AlpacaEnvironment = z.infer<typeof AlpacaEnvironmentSchema>

export const AlpacaAccountResponseSchema = z
  .object({
    id: z.string().min(1),
    status: z.string().min(1),
    currency: z.string().length(3),
    cash: numericString,
    equity: numericString,
    portfolio_value: numericString,
    buying_power: numericString,
    trading_blocked: z.boolean(),
    account_blocked: z.boolean(),
    trade_suspended_by_user: z.boolean(),
  })
  .passthrough()

export type AlpacaAccountResponse = z.infer<typeof AlpacaAccountResponseSchema>

export const AlpacaPositionResponseSchema = z
  .object({
    asset_id: z.string().min(1),
    symbol: z.string().min(1),
    qty: numericString,
    avg_entry_price: numericString,
    market_value: numericString,
    cost_basis: numericString,
    unrealized_pl: numericString,
    unrealized_plpc: numericString,
    current_price: numericString,
  })
  .passthrough()

export const AlpacaPositionsResponseSchema = z.array(AlpacaPositionResponseSchema)
export type AlpacaPositionResponse = z.infer<typeof AlpacaPositionResponseSchema>

export const AlpacaPaperOrderRequestSchema = z.object({
  symbol: z.string().min(1).max(20),
  qty: z.number().positive().finite().optional(),
  notional: z.number().positive().finite().optional(),
  side: z.enum(["buy", "sell"]),
  type: z.enum(["market", "limit", "stop", "stop_limit", "trailing_stop"]),
  time_in_force: z.enum(["day", "gtc", "opg", "cls", "ioc", "fok"]),
  limit_price: z.number().positive().finite().optional(),
  stop_price: z.number().positive().finite().optional(),
  client_order_id: z.string().min(1).max(128).optional(),
}).superRefine((order, context) => {
  if ((order.qty === undefined) === (order.notional === undefined)) {
    context.addIssue({ code: "custom", message: "Provide exactly one of qty or notional" })
  }
})

export type AlpacaPaperOrderRequest = z.infer<typeof AlpacaPaperOrderRequestSchema>

export const AlpacaOrderResponseSchema = z
  .object({
    id: z.string().min(1),
    client_order_id: z.string().min(1),
    symbol: z.string().min(1),
    side: z.enum(["buy", "sell"]),
    type: z.string().min(1),
    status: z.string().min(1),
    qty: numericString.nullable().optional(),
    notional: numericString.nullable().optional(),
    filled_qty: numericString,
    filled_avg_price: numericString.nullable(),
  })
  .passthrough()

export type AlpacaOrderResponse = z.infer<typeof AlpacaOrderResponseSchema>

export const AlpacaPositionSchema = z.object({
  assetId: z.string(),
  symbol: z.string(),
  qty: z.number().finite(),
  avgEntryPriceUsd: z.number().finite(),
  marketValueUsd: z.number().finite(),
  costBasisUsd: z.number().finite(),
  unrealizedPnlUsd: z.number().finite(),
  unrealizedPnlPercent: z.number().finite(),
  currentPriceUsd: z.number().finite(),
})

export const AlpacaPaperPortfolioSnapshotSchema = z.object({
  provider: z.literal("alpaca"),
  environment: AlpacaEnvironmentSchema,
  source: z.enum(["live", "fixture"]),
  observedAt: z.string().datetime({ offset: true }),
  accountCurrency: z.literal("USD"),
  cashUsd: z.number().finite(),
  equityUsd: z.number().finite(),
  portfolioValueUsd: z.number().finite(),
  buyingPowerUsd: z.number().finite(),
  unrealizedPnlUsd: z.number().finite(),
  tradingBlocked: z.boolean(),
  accountBlocked: z.boolean(),
  tradeSuspendedByUser: z.boolean(),
  positions: z.array(AlpacaPositionSchema),
})

export type AlpacaPaperPortfolioSnapshot = z.infer<typeof AlpacaPaperPortfolioSnapshotSchema>

export function normalizeAlpacaPaperPortfolio(
  accountInput: unknown,
  positionsInput: unknown,
  options: { source: "live" | "fixture"; observedAt?: Date },
): AlpacaPaperPortfolioSnapshot {
  const account = AlpacaAccountResponseSchema.parse(accountInput)
  const positions = AlpacaPositionsResponseSchema.parse(positionsInput)
  const normalized = {
    provider: "alpaca" as const,
    environment: "paper" as const,
    source: options.source,
    observedAt: (options.observedAt ?? new Date()).toISOString(),
    accountCurrency: "USD" as const,
    cashUsd: account.cash,
    equityUsd: account.equity,
    portfolioValueUsd: account.portfolio_value,
    buyingPowerUsd: account.buying_power,
    unrealizedPnlUsd: positions.reduce((total, position) => total + position.unrealized_pl, 0),
    tradingBlocked: account.trading_blocked,
    accountBlocked: account.account_blocked,
    tradeSuspendedByUser: account.trade_suspended_by_user,
    positions: positions.map((position) => ({
      assetId: position.asset_id,
      symbol: position.symbol,
      qty: position.qty,
      avgEntryPriceUsd: position.avg_entry_price,
      marketValueUsd: position.market_value,
      costBasisUsd: position.cost_basis,
      unrealizedPnlUsd: position.unrealized_pl,
      unrealizedPnlPercent: position.unrealized_plpc,
      currentPriceUsd: position.current_price,
    })),
  }

  return AlpacaPaperPortfolioSnapshotSchema.parse(normalized)
}
