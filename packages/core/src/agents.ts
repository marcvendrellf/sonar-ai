import { z } from "zod";
import { ClaimSchema } from "./evidence";
import { RiskBreachCodeSchema } from "./mandate";
import {
  PortfolioComparisonSchema,
  ProposedActionSchema,
  RiskCheckSchema,
} from "./portfolio";
import {
  IdSchema,
  IsoDateTimeSchema,
  MoneySchema,
  RatioSchema,
} from "./primitives";

/** The committee stages, in the order the orchestrator runs them. */
export const AGENT_STAGES = [
  "fundamental_analyst",
  "market_context",
  "portfolio_manager",
  "risk_officer",
  "bear_critic",
  "report_writer",
] as const;

export const AgentStageSchema = z.enum(AGENT_STAGES);
export type AgentStage = z.infer<typeof AgentStageSchema>;

export const StageStatusSchema = z.enum([
  "pending",
  "running",
  "complete",
  "skipped",
  "failed",
  "blocked",
]);
export type StageStatus = z.infer<typeof StageStatusSchema>;

/**
 * Bookkeeping for one committee stage. Timing and status live here; the payload
 * lives in the matching typed field on the committee state, linked by
 * `outputId`. Failed and skipped stages remain visible in the receipt.
 */
export const StageRecordSchema = z.object({
  runId: IdSchema,
  stage: AgentStageSchema,
  status: StageStatusSchema,
  startedAt: IsoDateTimeSchema.nullable(),
  completedAt: IsoDateTimeSchema.nullable(),
  /** The id of the produced output, or null if the stage produced none. */
  outputId: IdSchema.nullable(),
  /** Human-readable reason for a skip/failure/block, when relevant. */
  note: z.string().optional(),
});
export type StageRecord = z.infer<typeof StageRecordSchema>;

// ── Per-stage outputs ───────────────────────────────────────────────────────

/** Fundamental Analyst output for one instrument, from an isolated evidence pack. */
export const FundamentalReportSchema = z.object({
  id: IdSchema,
  instrumentId: IdSchema,
  quality: z.string().min(1),
  valuation: z.string().min(1),
  financialStrength: z.string().min(1),
  catalysts: z.array(z.string()).default([]),
  risks: z.array(z.string()).default([]),
  claims: z.array(ClaimSchema).default([]),
});
export type FundamentalReport = z.infer<typeof FundamentalReportSchema>;

/** Market Context Analyst output, from an isolated context pack. */
export const MarketContextReportSchema = z.object({
  id: IdSchema,
  summary: z.string().min(1),
  drivers: z.array(z.string()).default([]),
  sectorView: z.string().min(1),
  macroView: z.string().min(1),
  claims: z.array(ClaimSchema).default([]),
});
export type MarketContextReport = z.infer<typeof MarketContextReportSchema>;

/**
 * Deterministic portfolio metrics. Beyond volatility and beta, these surface
 * the current value of each of the four mandate limits, so the metrics panel is
 * symmetric with the mandate: `concentration` (position limit), `sectorExposure`
 * (sector limit), `cashRatio` (cash floor), and `turnover` (turnover limit).
 */
export const RiskMetricsSchema = z.object({
  volatility: z.number().nonnegative(),
  beta: z.number(),
  /** Largest single-position weight — the value the position limit constrains. */
  concentration: RatioSchema,
  /** Exposure by sector name, each a fraction of NAV. */
  sectorExposure: z.record(z.string(), RatioSchema),
  /**
   * Cash held after the proposed allocation, as a fraction of NAV. SIGNED, not
   * a [0, 1] ratio: an over-invested proposal (which the cash-floor check then
   * hard-blocks) yields a negative value. Capped at 1 — a long-only book cannot
   * hold more than NAV in cash.
   */
  cashRatio: z.number().max(1),
  /** Sell-side turnover for this event, as a fraction of NAV. */
  turnover: RatioSchema,
});
export type RiskMetrics = z.infer<typeof RiskMetricsSchema>;

export const StressResultSchema = z.object({
  scenario: z.string().min(1),
  navImpact: MoneySchema,
  navImpactPct: z.number(),
});
export type StressResult = z.infer<typeof StressResultSchema>;

/**
 * Risk Officer output. Deterministic: metrics, stress, per-action checks, and
 * the current-vs-proposed comparison all come from the pure risk engine.
 */
export const RiskReportSchema = z.object({
  id: IdSchema,
  metrics: RiskMetricsSchema,
  stress: z.array(StressResultSchema).default([]),
  checks: z.array(RiskCheckSchema),
  comparison: PortfolioComparisonSchema,
  /** Hard blocks raised; a non-empty list forces the run to `blocked`. */
  hardBlocks: z.array(RiskBreachCodeSchema).default([]),
});
export type RiskReport = z.infer<typeof RiskReportSchema>;

/**
 * Portfolio Manager recommendation (proposal or revision). Carries structured
 * bull / context / bear evidence and the conditions that would invalidate it.
 */
export const RecommendationSchema = z.object({
  id: IdSchema,
  /** Which revision this is: 0 = initial proposal, 1 = post-critique revision. */
  revision: z.number().int().nonnegative().default(0),
  actions: z.array(ProposedActionSchema),
  bull: z.array(ClaimSchema).default([]),
  context: z.array(ClaimSchema).default([]),
  bear: z.array(ClaimSchema).default([]),
  confidence: RatioSchema,
  invalidationConditions: z.array(z.string()).default([]),
  expectedCashAfter: MoneySchema,
});
export type Recommendation = z.infer<typeof RecommendationSchema>;

/** Bear/Critic output. Flags weaknesses and failure scenarios; cannot veto. */
export const BearCaseSchema = z.object({
  id: IdSchema,
  targetRecommendationId: IdSchema,
  weaknesses: z.array(z.string()).default([]),
  failureScenarios: z.array(z.string()).default([]),
  claims: z.array(ClaimSchema).default([]),
});
export type BearCase = z.infer<typeof BearCaseSchema>;

/**
 * Communications/Report Writer output. Runs only after the human decision and
 * cannot influence allocation.
 */
export const CommitteeReportSchema = z.object({
  id: IdSchema,
  narrative: z.string().min(1),
  decisionSummary: z.string().min(1),
  disclaimers: z.array(z.string()).default([]),
});
export type CommitteeReport = z.infer<typeof CommitteeReportSchema>;
