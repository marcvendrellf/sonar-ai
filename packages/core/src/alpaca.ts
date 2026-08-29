import { z } from "zod";

const NumericStringSchema = z.coerce.number().finite();

/** Sonar supports Paper only. Live is intentionally not a valid value. */
export const AlpacaEnvironmentSchema = z.literal("paper");
export type AlpacaEnvironment = z.infer<typeof AlpacaEnvironmentSchema>;

export const AlpacaAccountResponseSchema = z
  .object({
    id: z.string().min(1),
    status: z.string().min(1),
    currency: z.string().length(3),
    cash: NumericStringSchema,
    equity: NumericStringSchema,
    portfolio_value: NumericStringSchema,
    buying_power: NumericStringSchema,
    trading_blocked: z.boolean(),
    account_blocked: z.boolean(),
    trade_suspended_by_user: z.boolean(),
  })
  .passthrough();
export type AlpacaAccountResponse = z.infer<typeof AlpacaAccountResponseSchema>;

export const AlpacaPositionResponseSchema = z
  .object({
    asset_id: z.string().min(1),
    symbol: z.string().min(1),
    qty: NumericStringSchema,
    avg_entry_price: NumericStringSchema,
    market_value: NumericStringSchema,
    cost_basis: NumericStringSchema,
    unrealized_pl: NumericStringSchema,
    unrealized_plpc: NumericStringSchema,
    current_price: NumericStringSchema,
  })
  .passthrough();
export type AlpacaPositionResponse = z.infer<typeof AlpacaPositionResponseSchema>;

export const AlpacaPositionsResponseSchema = z.array(AlpacaPositionResponseSchema);

export const AlpacaPaperOrderRequestSchema = z
  .object({
    symbol: z.string().min(1),
    qty: z.number().positive().optional(),
    notional: z.number().positive().optional(),
    side: z.enum(["buy", "sell"]),
    type: z.enum(["market", "limit", "stop", "stop_limit", "trailing_stop"]),
    time_in_force: z.enum(["day", "gtc", "opg", "cls", "ioc", "fok"]),
    limit_price: z.number().positive().optional(),
    stop_price: z.number().positive().optional(),
    client_order_id: z.string().min(1).optional(),
  })
  .superRefine((value, context) => {
    if ((value.qty === undefined) === (value.notional === undefined)) {
      context.addIssue({
        code: "custom",
        message: "Provide exactly one of qty or notional",
        path: ["qty"],
      });
    }
  });
export type AlpacaPaperOrderRequest = z.infer<typeof AlpacaPaperOrderRequestSchema>;

export const AlpacaOrderResponseSchema = z
  .object({
    id: z.string().min(1),
    client_order_id: z.string().min(1),
    symbol: z.string().min(1),
    side: z.enum(["buy", "sell"]),
    type: z.string().min(1),
    status: z.string().min(1),
    qty: NumericStringSchema.optional(),
    notional: NumericStringSchema.optional(),
    filled_qty: NumericStringSchema,
    filled_avg_price: NumericStringSchema.nullable().optional(),
  })
  .passthrough();
export type AlpacaOrderResponse = z.infer<typeof AlpacaOrderResponseSchema>;

export const AlpacaPositionSchema = z.object({
  assetId: z.string().min(1),
  symbol: z.string().min(1),
  quantity: z.number().finite(),
  averageEntryPriceUsd: z.number().finite(),
  marketValueUsd: z.number().finite(),
  costBasisUsd: z.number().finite(),
  unrealizedPnlUsd: z.number().finite(),
  unrealizedPnlPct: z.number().finite(),
  currentPriceUsd: z.number().finite(),
});
export type AlpacaPosition = z.infer<typeof AlpacaPositionSchema>;

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
});
export type AlpacaPaperPortfolioSnapshot = z.infer<
  typeof AlpacaPaperPortfolioSnapshotSchema
>;

export function normalizeAlpacaPaperPortfolio(
  accountInput: unknown,
  positionsInput: unknown,
  options: { source: "live" | "fixture"; observedAt?: string },
): AlpacaPaperPortfolioSnapshot {
  const account = AlpacaAccountResponseSchema.parse(accountInput);
  const positions = AlpacaPositionsResponseSchema.parse(positionsInput);
  if (account.currency !== "USD") {
    throw new Error(`Unsupported Alpaca account currency: ${account.currency}`);
  }

  const observedAt = options.observedAt ?? new Date().toISOString();
  return AlpacaPaperPortfolioSnapshotSchema.parse({
    provider: "alpaca",
    environment: "paper",
    source: options.source,
    observedAt,
    accountCurrency: "USD",
    cashUsd: account.cash,
    equityUsd: account.equity,
    portfolioValueUsd: account.portfolio_value,
    buyingPowerUsd: account.buying_power,
    unrealizedPnlUsd: positions.reduce((sum, position) => sum + position.unrealized_pl, 0),
    tradingBlocked: account.trading_blocked,
    accountBlocked: account.account_blocked,
    tradeSuspendedByUser: account.trade_suspended_by_user,
    positions: positions.map((position) => ({
      assetId: position.asset_id,
      symbol: position.symbol,
      quantity: position.qty,
      averageEntryPriceUsd: position.avg_entry_price,
      marketValueUsd: position.market_value,
      costBasisUsd: position.cost_basis,
      unrealizedPnlUsd: position.unrealized_pl,
      unrealizedPnlPct: position.unrealized_plpc,
      currentPriceUsd: position.current_price,
    })),
  });
}
