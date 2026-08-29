import { z } from "zod";
import { RiskBreachCodeSchema } from "./mandate";
import {
  CurrencySchema,
  DataLabelSchema,
  IdSchema,
  IsoDateTimeSchema,
  MoneySchema,
  RatioSchema,
} from "./primitives";

export const TradeSideSchema = z.enum(["buy", "sell"]);
export type TradeSide = z.infer<typeof TradeSideSchema>;

/** A held position. The MVP baseline holds none of these (all cash). */
export const PositionSchema = z.object({
  instrumentId: IdSchema,
  quantity: z.number(),
  avgPrice: MoneySchema,
  marketValue: MoneySchema,
  /** Fraction of NAV. */
  weight: RatioSchema,
});
export type Position = z.infer<typeof PositionSchema>;

/**
 * A point-in-time paper-portfolio snapshot. MVP starts at `cash = €1,000` with
 * an empty `positions` array and `nav == cash`.
 */
export const PortfolioSnapshotSchema = z.object({
  id: IdSchema,
  asOf: IsoDateTimeSchema,
  baseCurrency: CurrencySchema,
  cash: MoneySchema,
  nav: MoneySchema,
  positions: z.array(PositionSchema),
  label: DataLabelSchema,
});
export type PortfolioSnapshot = z.infer<typeof PortfolioSnapshotSchema>;

/**
 * An allocation intent from the Portfolio Manager. It expresses a target, not a
 * broker order — the deterministic risk engine turns it into a pass/resize/
 * reject result, and only an approved result mutates the paper ledger.
 */
export const ProposedActionSchema = z.object({
  id: IdSchema,
  instrumentId: IdSchema,
  side: TradeSideSchema,
  /** Target weight of NAV after the action. */
  targetWeight: RatioSchema,
  /** Intended notional for the action. */
  amount: MoneySchema,
  /** Evidence backing this specific action. */
  evidenceIds: z.array(IdSchema).default([]),
});
export type ProposedAction = z.infer<typeof ProposedActionSchema>;

export const RiskResultSchema = z.enum(["pass", "resize", "reject"]);
export type RiskResult = z.infer<typeof RiskResultSchema>;

/**
 * The deterministic verdict on one proposed action. `numbers` carries the
 * reproducible figures behind the decision so the Risk Officer can explain a
 * block with exact values. `breachCode` is set on a resize or reject.
 */
export const RiskCheckSchema = z.object({
  id: IdSchema,
  actionId: IdSchema,
  result: RiskResultSchema,
  breachCode: RiskBreachCodeSchema.optional(),
  detail: z.string().min(1),
  numbers: z.record(z.string(), z.number()).default({}),
  /** Present when the engine resized rather than rejected. */
  resizedAmount: MoneySchema.optional(),
});
export type RiskCheck = z.infer<typeof RiskCheckSchema>;

/**
 * An action the paper ledger actually applies after human approval. Produced by
 * deterministic Trader code — never by an agent and never by a broker client.
 */
export const PaperOrderSchema = z.object({
  id: IdSchema,
  actionId: IdSchema,
  instrumentId: IdSchema,
  side: TradeSideSchema,
  quantity: z.number().nonnegative(),
  price: MoneySchema,
  notional: MoneySchema,
  appliedAt: IsoDateTimeSchema,
});
export type PaperOrder = z.infer<typeof PaperOrderSchema>;

/** Per-instrument weight delta between two portfolios. */
export const WeightDeltaSchema = z.object({
  instrumentId: IdSchema,
  currentWeight: RatioSchema,
  proposedWeight: RatioSchema,
});
export type WeightDelta = z.infer<typeof WeightDeltaSchema>;

/**
 * Current-versus-proposed comparison. For the MVP this compares the all-cash
 * baseline against the proposed allocation and its retained cash.
 */
export const PortfolioComparisonSchema = z.object({
  currentNav: MoneySchema,
  proposedInvested: MoneySchema,
  proposedCash: MoneySchema,
  deltas: z.array(WeightDeltaSchema),
});
export type PortfolioComparison = z.infer<typeof PortfolioComparisonSchema>;
