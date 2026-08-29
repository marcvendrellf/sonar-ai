import {
  AlpacaAssetsResponseSchema,
  AlpacaBarSchema,
  AlpacaPaperPortfolioSnapshotSchema,
  AlpacaQuoteSchema,
} from "@sonar-ai/core/alpaca";
import { z } from "zod";
import { defineTool, type ToolRegistry } from "./types";

export interface ReadonlyAlpacaProvider {
  getPortfolioSnapshot(): Promise<unknown>;
  listTradableAssets(): Promise<unknown>;
  getLatestQuotes(symbols: readonly string[]): Promise<unknown>;
  getPriceHistory(symbol: string, start: string, end?: string, limit?: number): Promise<unknown>;
}

const QuotesInputSchema = z.object({ symbols: z.array(z.string().min(1)).min(1).max(50) });
const HistoryInputSchema = z.object({ symbol: z.string().min(1), start: z.string().datetime({ offset: true }), end: z.string().datetime({ offset: true }).optional(), limit: z.number().int().min(1).max(1000) });

export function createAlpacaTools(provider: ReadonlyAlpacaProvider): ToolRegistry {
  return {
    get_portfolio_snapshot: defineTool({
      name: "get_portfolio_snapshot",
      description: "Read USD Alpaca Paper account and positions. Read-only; never submits orders.",
      inputSchema: z.object({}),
      outputSchema: AlpacaPaperPortfolioSnapshotSchema,
      execute: async () => provider.getPortfolioSnapshot(),
    }),
    list_tradable_assets: defineTool({
      name: "list_tradable_assets",
      description: "List active, tradable Alpaca Paper assets. Use this as the authoritative symbol universe.",
      inputSchema: z.object({}),
      outputSchema: AlpacaAssetsResponseSchema,
      execute: async () => provider.listTradableAssets(),
    }),
    get_latest_quotes: defineTool({
      name: "get_latest_quotes",
      description: "Read latest bid/ask quotes for symbols. Use for price, spread, and execution-liquidity checks.",
      inputSchema: QuotesInputSchema,
      outputSchema: z.array(AlpacaQuoteSchema),
      execute: async ({ symbols }) => provider.getLatestQuotes(symbols),
    }),
    get_price_history: defineTool({
      name: "get_price_history",
      description: "Read daily Alpaca price history for one symbol. Use for trend, volatility, drawdown, and regime context; never forecast from it alone.",
      inputSchema: HistoryInputSchema,
      outputSchema: z.array(AlpacaBarSchema),
      execute: async ({ symbol, start, end, limit }) => provider.getPriceHistory(symbol, start, end, limit),
    }),
  };
}
