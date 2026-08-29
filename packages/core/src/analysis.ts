import { z } from "zod";
import {
  BearCaseSchema,
  CommitteeReportSchema,
  FundamentalReportSchema,
  MarketContextReportSchema,
  RecommendationSchema,
  RiskReportSchema,
  StageRecordSchema,
} from "./agents";
import { EvidenceSchema, RelationshipGraphSchema } from "./evidence";
import { ActivityEventSchema, MaterialEventSchema } from "./events";
import { MandateSchema } from "./mandate";
import { InstrumentSchema, MarketSnapshotSchema } from "./market-data";
import { FundPhaseSchema } from "./phases";
import {
  PaperOrderSchema,
  PortfolioSnapshotSchema,
  ProposedActionSchema,
  RiskCheckSchema,
} from "./portfolio";
import { DecisionReceiptSchema, UserDecisionSchema } from "./receipts";
import { IdSchema, IsoDateTimeSchema } from "./primitives";

/** Run-level metadata for one committee execution. */
export const RunSchema = z.object({
  id: IdSchema,
  scenarioId: IdSchema,
  startedAt: IsoDateTimeSchema,
  completedAt: IsoDateTimeSchema.nullable(),
  /** Whether this run is a live analysis, a historical replay, or synthetic. */
  label: z.enum(["live", "historical", "synthetic"]),
});
export type Run = z.infer<typeof RunSchema>;

/**
 * The single object enriched by each committee stage. Not prose passed from
 * prompt to prompt — one typed record that every stage reads from and writes to.
 * Deterministic analytics stay separate from model interpretation.
 *
 * This is the same shape sent to the browser (see {@link AnalysisSchema}): it
 * models records only — never prompts, credentials, or hidden chain-of-thought,
 * which live in the server layer and are never represented here.
 */
export const InvestmentCommitteeStateSchema = z.object({
  run: RunSchema,
  /** The current fund phase; the UI derives everything visual from this. */
  phase: FundPhaseSchema,

  // Inputs
  mandate: MandateSchema,
  candidateUniverse: z.array(InstrumentSchema),
  portfolioSnapshot: PortfolioSnapshotSchema,
  materialEvents: z.array(MaterialEventSchema).default([]),
  marketSnapshot: MarketSnapshotSchema.nullable(),

  // Sourced evidence + relationship graph
  evidence: z.array(EvidenceSchema).default([]),
  graph: RelationshipGraphSchema,

  // Stage bookkeeping (status + timing for every stage, including skipped/failed)
  stages: z.array(StageRecordSchema).default([]),

  // Stage outputs
  fundamentalReports: z.array(FundamentalReportSchema).default([]),
  marketContext: MarketContextReportSchema.nullable(),
  riskReport: RiskReportSchema.nullable(),
  /**
   * The Portfolio Manager's initial proposal (revision 0) — the exact set of
   * actions the Risk Officer evaluated. Kept so every `riskChecks[].actionId`
   * resolves to a real action even after the proposal is revised.
   */
  proposal: RecommendationSchema.nullable(),
  /** The revised recommendation (revision 1) after risk + critique. */
  finalRecommendation: RecommendationSchema.nullable(),
  bearCase: BearCaseSchema.nullable(),

  // Flattened views for the UI, DERIVED from the outputs above (not
  // authoritative): `proposedActions` mirrors `finalRecommendation.actions` and
  // `riskChecks` mirrors `riskReport.checks`. The orchestrator keeps them in
  // sync; a consumer that needs the source of truth reads the outputs directly.
  proposedActions: z.array(ProposedActionSchema).default([]),
  riskChecks: z.array(RiskCheckSchema).default([]),

  // Decision + application
  userDecision: UserDecisionSchema.nullable(),
  appliedOrders: z.array(PaperOrderSchema).default([]),
  portfolioAfter: PortfolioSnapshotSchema.nullable(),
  report: CommitteeReportSchema.nullable(),

  // Trace + final artifact
  activities: z.array(ActivityEventSchema).default([]),
  receipt: DecisionReceiptSchema.nullable(),
});
export type InvestmentCommitteeState = z.infer<
  typeof InvestmentCommitteeStateSchema
>;

/**
 * The browser-facing analysis contract. Identical to the committee state for
 * the MVP — the state already models records only. Kept as a distinct name so a
 * future server-side projection has a place to narrow.
 */
export const AnalysisSchema = InvestmentCommitteeStateSchema;
export type Analysis = InvestmentCommitteeState;
