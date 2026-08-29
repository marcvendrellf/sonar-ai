import {
  CommitteeReportSchema,
  type CommitteeReport,
  type Evidence,
  type MaterialEvent,
  type PaperOrder,
  type PortfolioComparison,
  type Recommendation,
  type UserDecision,
} from "@sonar-ai/core";
import { z } from "zod";
import type { Agent } from "./types";

/**
 * Communications / Report Writer — turns the finished decision into a plain
 * narrative and a one-line summary.
 *
 * It runs ONLY after the human decision (enforced structurally: its context
 * requires a non-null `userDecision`) and it CANNOT influence allocation — its
 * output has no action or weight fields. Compliance disclaimers are injected by
 * `finalize`, never left to the model.
 */

/** What the Report Writer is allowed to see. Populated by the orchestrator. */
export interface ReportWriterContext {
  /** The final recommendation the human ruled on. */
  recommendation: Recommendation;
  /** The human's decision. Required — this agent never runs before it exists. */
  userDecision: UserDecision;
  /** The paper orders that actually applied (empty if rejected). */
  appliedOrders: PaperOrder[];
  /** The current-vs-proposed comparison. */
  comparison: PortfolioComparison;
  /** The originating event, for narrative color. */
  event?: MaterialEvent | null;
  /** Evidence records the narrative may reference. */
  evidence: Evidence[];
}

export const CommitteeReportDraftSchema = CommitteeReportSchema.omit({
  id: true,
});
export type CommitteeReportDraft = z.infer<typeof CommitteeReportDraftSchema>;

/** Always present, regardless of what the model writes. */
const REQUIRED_DISCLAIMERS = ["Paper trading only.", "Not investment advice."];

// ── First-draft prompt (Axel owns the final wording) ─────────────────────────

const INSTRUCTIONS = `You are the Communications / Report Writer on an investment committee. The decision is already made.

Write, in plain language:
- narrative: what the committee examined, what it found, and what was decided;
- decisionSummary: one sentence stating the outcome.

Describe only what happened. Do NOT recommend new trades, change any allocation,
or second-guess the decision — your role is to explain, not to decide. You may
add scenario-specific caveats to disclaimers, but standard compliance notices are
added automatically. Return only the required JSON.`;

function buildInput(ctx: ReportWriterContext): string {
  const outcome = ctx.userDecision.decision.toUpperCase();
  const actions =
    ctx.recommendation.actions
      .map((a) => `- ${a.side} ${a.instrumentId} to ${Math.round(a.targetWeight * 100)}% of NAV`)
      .join("\n") || "(no actions)";
  const applied =
    ctx.appliedOrders
      .map((o) => `- ${o.side} ${o.quantity} ${o.instrumentId} @ ${o.price.amount} (${o.notional.amount} ${o.notional.currency})`)
      .join("\n") || "(none applied)";

  return [
    `Human decision: ${outcome}${ctx.userDecision.note ? ` — "${ctx.userDecision.note}"` : ""}.`,
    ctx.event ? `Originating event: ${ctx.event.headline} — ${ctx.event.summary}` : `No specific event.`,
    `Recommended allocation:\n${actions}`,
    `Applied paper orders:\n${applied}`,
    `Cash after: ${ctx.comparison.proposedCash.amount} ${ctx.comparison.proposedCash.currency} of ${ctx.comparison.currentNav.amount} NAV.`,
    `Write the report as JSON matching the required schema.`,
  ].join("\n\n");
}

/** Assign the ID and force the mandatory compliance disclaimers. */
function finalize(draft: CommitteeReportDraft): CommitteeReport {
  const extra = draft.disclaimers.filter((d) => !REQUIRED_DISCLAIMERS.includes(d));
  return {
    id: "rpt_main",
    narrative: draft.narrative,
    decisionSummary: draft.decisionSummary,
    disclaimers: [...REQUIRED_DISCLAIMERS, ...extra],
  };
}

export const reportWriter: Agent<
  ReportWriterContext,
  CommitteeReportDraft,
  CommitteeReport
> = {
  def: {
    stage: "report_writer",
    instructions: INSTRUCTIONS,
    outputSchema: CommitteeReportDraftSchema,
    buildInput,
  },
  finalize: (draft) => finalize(draft),
};
