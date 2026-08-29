import { z } from "zod";
import { CurrencySchema, IdSchema, MoneySchema, RatioSchema } from "./primitives";

/**
 * The four deterministic limits the Risk Officer enforces. These are demo
 * parameters, not investment recommendations. A model can never widen them.
 */
export const RiskLimitsSchema = z.object({
  /** Maximum gross exposure of any single position, as a fraction of NAV. */
  maxGrossExposurePerPosition: RatioSchema,
  /** Maximum aggregate exposure to any one sector, as a fraction of NAV. */
  maxSectorExposure: RatioSchema,
  /** Minimum cash held, as a fraction of NAV. */
  minCashRatio: RatioSchema,
  /** Maximum fraction of NAV that may turn over in response to one event. */
  maxTurnoverPerEvent: RatioSchema,
});
export type RiskLimits = z.infer<typeof RiskLimitsSchema>;

/** A written, immutable-for-the-run mandate. */
export const MandateSchema = z.object({
  id: IdSchema,
  baseCurrency: CurrencySchema,
  initialCash: MoneySchema,
  limits: RiskLimitsSchema,
});
export type Mandate = z.infer<typeof MandateSchema>;

/**
 * Deterministic hard-block reasons the Risk Officer may raise. A model cannot
 * approve its own exception to any of these.
 */
export const RiskBreachCodeSchema = z.enum([
  "POSITION_LIMIT_BREACH",
  "RISK_MANDATE_BREACH",
  "DATA_INVALID",
]);
export type RiskBreachCode = z.infer<typeof RiskBreachCodeSchema>;

/** Convenience: the demo's recommended limit preset. */
export const DEMO_RISK_LIMITS: RiskLimits = {
  maxGrossExposurePerPosition: 0.3,
  maxSectorExposure: 0.45,
  minCashRatio: 0.1,
  maxTurnoverPerEvent: 0.2,
};
