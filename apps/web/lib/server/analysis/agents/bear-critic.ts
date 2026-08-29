import {
  BearCaseSchema,
  type BearCase,
  type Evidence,
  type FundamentalReport,
  type MarketContextReport,
  type Recommendation,
  type RiskReport,
} from "@sonar-ai/core";
import { z } from "zod";
import { ClaimDraftSchema, type Agent } from "./types";

/**
 * Bear/Critic — attacks the Portfolio Manager's proposal and names what could
 * make it fail.
 *
 * Authority: flag weak assumptions and failure scenarios. It CANNOT veto the
 * recommendation and CANNOT propose alternative sizing — it only surfaces risk
 * the committee should weigh before the human decides. Runs once, after the
 * proposal and the risk report.
 */

/** What the Bear/Critic is allowed to see. Populated by the orchestrator. */
export interface BearCriticContext {
  /** The recommendation under attack (the PM's proposal). */
  recommendation: Recommendation;
  /** Research summaries. */
  fundamentalReports: FundamentalReport[];
  marketContext: MarketContextReport | null;
  /** The Risk Officer's verdict on the proposal. */
  riskReport: RiskReport | null;
  /** The evidence records the critic may cite. */
  evidence: Evidence[];
}

export const BearCaseDraftSchema = BearCaseSchema.omit({
  id: true,
  targetRecommendationId: true,
  claims: true,
}).extend({ claims: z.array(ClaimDraftSchema) });
export type BearCaseDraft = z.infer<typeof BearCaseDraftSchema>;

// ── First-draft prompt (Axel owns the final wording) ─────────────────────────

const INSTRUCTIONS = `You are the Bear/Critic on an investment committee. Your job is to attack the proposed allocation.

Given the recommendation, the research, and the risk report, produce:
- weaknesses: the shakiest assumptions the proposal depends on;
- failureScenarios: concrete paths in which this allocation loses money;
- claims: specific criticisms, each citing evidenceIds from the provided list.

Be adversarial but fair — attack the reasoning, not a straw man. You CANNOT veto
the recommendation and you must NOT propose alternative weights or trades; you
only surface what the committee should weigh. Return only the required JSON.`;

function buildInput(ctx: BearCriticContext): string {
  const actions =
    ctx.recommendation.actions
      .map(
        (a) =>
          `- ${a.side} ${a.instrumentId} to ${Math.round(a.targetWeight * 100)}% of NAV`,
      )
      .join("\n") || "(no actions)";

  const pmCase = [
    `bull: ${ctx.recommendation.bull.map((c) => c.statement).join("; ") || "none"}`,
    `bear (self-identified): ${ctx.recommendation.bear.map((c) => c.statement).join("; ") || "none"}`,
  ].join("\n");

  const fundamentals =
    ctx.fundamentalReports
      .map((r) => `- ${r.instrumentId}: ${r.valuation}`)
      .join("\n") || "(none)";

  const risk = ctx.riskReport
    ? `Hard blocks: ${ctx.riskReport.hardBlocks.join(", ") || "none"}\n` +
      ctx.riskReport.checks
        .map((c) => `  · ${c.actionId}: ${c.result}${c.breachCode ? ` (${c.breachCode})` : ""}`)
        .join("\n")
    : "(no risk report)";

  const evidenceList =
    ctx.evidence.map((e) => `- ${e.id} | ${e.title}`).join("\n") || "(none)";

  return [
    `Recommendation under review (revision ${ctx.recommendation.revision}, confidence ${ctx.recommendation.confidence}):\n${actions}`,
    `Portfolio Manager's case:\n${pmCase}`,
    `Fundamental valuation notes:\n${fundamentals}`,
    `Market context:\n${ctx.marketContext ? ctx.marketContext.summary : "(none)"}`,
    `Risk Officer report:\n${risk}`,
    `Evidence you may cite:\n${evidenceList}`,
    `Produce the bear case as JSON matching the required schema. Every claim.evidenceIds entry MUST come from the evidence list above.`,
  ].join("\n\n");
}

/** Assign deterministic IDs and bind the case to the recommendation it targets. */
function finalize(draft: BearCaseDraft, ctx: BearCriticContext): BearCase {
  return {
    id: "bear_main",
    targetRecommendationId: ctx.recommendation.id,
    weaknesses: draft.weaknesses,
    failureScenarios: draft.failureScenarios,
    claims: draft.claims.map((claim, index) => ({
      id: `clm_bear_${index}`,
      ...claim,
    })),
  };
}

export const bearCritic: Agent<BearCriticContext, BearCaseDraft, BearCase> = {
  def: {
    stage: "bear_critic",
    instructions: INSTRUCTIONS,
    outputSchema: BearCaseDraftSchema,
    buildInput,
  },
  finalize,
};
