import { z } from "zod";
import {
  CurrencySchema,
  DataLabelSchema,
  IdSchema,
  IsoDateTimeSchema,
} from "./primitives";

/**
 * A tradable instrument in the candidate universe. Sourced read-only from
 * eToro or a fixture — never an order-capable handle.
 */
export const InstrumentSchema = z.object({
  id: IdSchema,
  symbol: z.string().min(1),
  name: z.string().min(1),
  sector: z.string().min(1),
  assetClass: z.enum(["equity", "etf", "crypto", "commodity", "index"]),
  currency: CurrencySchema,
});
export type Instrument = z.infer<typeof InstrumentSchema>;

export const PricePointSchema = z.object({
  t: IsoDateTimeSchema,
  close: z.number().nonnegative(),
});
export type PricePoint = z.infer<typeof PricePointSchema>;

/** A per-instrument close-price series with explicit provenance. */
export const PriceHistorySchema = z.object({
  instrumentId: IdSchema,
  currency: CurrencySchema,
  source: z.enum(["etoro", "fixture"]),
  label: DataLabelSchema,
  asOf: IsoDateTimeSchema,
  points: z.array(PricePointSchema).min(1),
});
export type PriceHistory = z.infer<typeof PriceHistorySchema>;

export const InstrumentQuoteSchema = z.object({
  instrumentId: IdSchema,
  price: z.number().nonnegative(),
  currency: CurrencySchema,
});
export type InstrumentQuote = z.infer<typeof InstrumentQuoteSchema>;

/** A point-in-time snapshot of quotes for the universe. */
export const MarketSnapshotSchema = z.object({
  asOf: IsoDateTimeSchema,
  source: z.enum(["etoro", "fixture"]),
  label: DataLabelSchema,
  quotes: z.array(InstrumentQuoteSchema),
});
export type MarketSnapshot = z.infer<typeof MarketSnapshotSchema>;
