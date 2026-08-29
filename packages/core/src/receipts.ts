import { z } from "zod";
import {
  BearCaseSchema,
  CommitteeReportSchema,
  RecommendationSchema,
  RiskReportSchema,
} from "./agents";
import { EvidenceSchema } from "./evidence";
import { MaterialEventSchema } from "./events";
import {
  PaperOrderSchema,
  PortfolioSnapshotSchema,
} from "./portfolio";
import { IdSchema, IsoDateTimeSchema } from "./primitives";

/**
 * The human's explicit decision. Required before any paper-ledger mutation —
 * the orchestrator refuses to apply actions without an `approved` decision.
 */
export const UserDecisionSchema = z.object({
  decision: z.enum(["approved", "rejected"]),
  decidedAt: IsoDateTimeSchema,
  decidedBy: z.string().optional(),
  note: z.string().optional(),
});
export type UserDecision = z.infer<typeof UserDecisionSchema>;

/**
 * The inspectable artifact of one committee run. Contains the event, the
 * relationship evidence, the risk comparison (including the rejected/resized
 * alternative), the human approval, the applied paper actions, and the report.
 */
export const DecisionReceiptSchema = z.object({
  id: IdSchema,
  runId: IdSchema,
  createdAt: IsoDateTimeSchema,
  event: MaterialEventSchema.nullable(),
  portfolioBefore: PortfolioSnapshotSchema,
  portfolioAfter: PortfolioSnapshotSchema,
  /** The initial proposal (revision 0) risk evaluated; `riskReport.checks` cite its actions. */
  proposal: RecommendationSchema.nullable(),
  /** The revised recommendation the human approved or rejected. */
  recommendation: RecommendationSchema,
  riskReport: RiskReportSchema,
  bearCase: BearCaseSchema.nullable(),
  userDecision: UserDecisionSchema,
  appliedOrders: z.array(PaperOrderSchema),
  report: CommitteeReportSchema.nullable(),
  /** Every evidence record referenced anywhere in this receipt. */
  evidence: z.array(EvidenceSchema),
});
export type DecisionReceipt = z.infer<typeof DecisionReceiptSchema>;
