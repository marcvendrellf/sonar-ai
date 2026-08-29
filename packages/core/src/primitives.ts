import { z } from "zod";

/**
 * Shared scalar schemas used across every contract.
 * Keep these tiny and dependency-free — every other module builds on them.
 */

/** ISO-8601 timestamp. Accepts a trailing `Z` or an explicit offset. */
export const IsoDateTimeSchema = z.iso.datetime({ offset: true });
export type IsoDateTime = z.infer<typeof IsoDateTimeSchema>;

/** Currencies the MVP may encounter. Portfolio base currency is EUR. */
export const CurrencySchema = z.enum(["EUR", "USD", "GBP"]);
export type Currency = z.infer<typeof CurrencySchema>;

/**
 * Provenance label. Every timestamped fact must declare whether it is live,
 * a historical replay, or synthetic. The demo must never blur these.
 */
export const DataLabelSchema = z.enum(["live", "historical", "synthetic"]);
export type DataLabel = z.infer<typeof DataLabelSchema>;

/** A money amount in a named currency. */
export const MoneySchema = z.object({
  amount: z.number(),
  currency: CurrencySchema,
});
export type Money = z.infer<typeof MoneySchema>;

/** A ratio or weight in the closed interval [0, 1]. */
export const RatioSchema = z.number().min(0).max(1);
export type Ratio = z.infer<typeof RatioSchema>;

/** Confidence class on an inferred edge or claim (mirrors the graphify audit trail). */
export const ConfidenceSchema = z.enum(["EXTRACTED", "INFERRED", "AMBIGUOUS"]);
export type Confidence = z.infer<typeof ConfidenceSchema>;

/** Numeric confidence score in [0, 1]. */
export const ConfidenceScoreSchema = z.number().min(0).max(1);
export type ConfidenceScore = z.infer<typeof ConfidenceScoreSchema>;

/** A non-empty identifier string. All entity IDs use this shape. */
export const IdSchema = z.string().min(1);
export type Id = z.infer<typeof IdSchema>;
