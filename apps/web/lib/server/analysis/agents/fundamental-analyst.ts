import {
  FundamentalReportSchema,
  type Evidence,
  type FundamentalReport,
  type Instrument,
} from "@sonar-ai/core";
import { z } from "zod";
import { ClaimDraftSchema, type Agent } from "./types";

/**
 * Fundamental Analyst — evaluates ONE company's business quality, valuation,
 * financial strength, catalysts, and risks from an isolated evidence pack.
 *
 * Authority: assess asset quality and valuation. It does NOT size positions,
 * discuss portfolio allocation, or read the risk report or other agents' output.
 * The orchestrator calls it once per selected instrument.
 */

/** What the Fundamental Analyst is allowed to see. Populated by the orchestrator. */
export interface FundamentalContext {
  /** The single company under review. */
  instrument: Instrument;
  /**
   * The isolated, pre-fetched evidence pack (fundamentals, filings, news, and
   * any price/valuation facts). Deliberately the ONLY window this agent has —
   * it never sees the mandate, the risk report, or other agents' output, so it
   * cannot drift toward sizing decisions.
   */
  evidence: Evidence[];
  /** A prior thesis on this instrument, if the fund already holds a view. */
  priorThesis?: string | null;
}

// The model produces content only — no IDs. Drafts are derived from the core
// schemas so they cannot drift from the contract.
export const FundamentalReportDraftSchema = FundamentalReportSchema.omit({
  id: true,
  instrumentId: true,
  claims: true,
}).extend({ claims: z.array(ClaimDraftSchema) });
export type FundamentalReportDraft = z.infer<typeof FundamentalReportDraftSchema>;

// ── First-draft prompt (Axel owns the final wording) ─────────────────────────

const INSTRUCTIONS = `You are the Fundamental Analyst on an investment committee.

Evaluate exactly ONE company using ONLY the evidence provided. Assess:
- quality: the durability of the business and its competitive position;
- valuation: whether the price is justified by fundamentals;
- financialStrength: balance sheet, margins, cash generation;
- catalysts: concrete events that could re-rate the asset;
- risks: what could impair the thesis.

Then list claims. Every claim MUST cite one or more evidenceIds drawn ONLY from
the provided pack — never invent an ID or a fact not supported by the evidence.
Mark each claim's stance as "bull", "bear", "neutral", or "context".

Do NOT size positions, recommend a weight, or discuss the rest of the portfolio —
that is the Portfolio Manager's job. Return only the required JSON.`;

function buildInput(ctx: FundamentalContext): string {
  const evidenceBlock =
    ctx.evidence
      .map(
        (e) =>
          `- ${e.id} | ${e.title} | ${e.sourceName} | observed ${e.observedAt} | ${e.label}` +
          (e.snippet ? ` | ${e.snippet}` : ""),
      )
      .join("\n") || "(no evidence provided)";

  return [
    `Company under review: ${ctx.instrument.name} (${ctx.instrument.symbol}) — sector ${ctx.instrument.sector}.`,
    ctx.priorThesis
      ? `Prior thesis on file: ${ctx.priorThesis}`
      : `No prior thesis on file.`,
    `Evidence pack — cite ONLY these evidence IDs:`,
    evidenceBlock,
    `Produce a fundamental assessment as JSON matching the required schema. Every claim.evidenceIds entry MUST be one of the IDs listed above.`,
  ].join("\n\n");
}

/** Assign deterministic IDs, turning the model draft into a core report. */
function finalize(
  draft: FundamentalReportDraft,
  ctx: FundamentalContext,
): FundamentalReport {
  return {
    id: `frp_${ctx.instrument.id}`,
    instrumentId: ctx.instrument.id,
    quality: draft.quality,
    valuation: draft.valuation,
    financialStrength: draft.financialStrength,
    catalysts: draft.catalysts,
    risks: draft.risks,
    claims: draft.claims.map((claim, index) => ({
      id: `clm_${ctx.instrument.id}_${index}`,
      ...claim,
    })),
  };
}

export const fundamentalAnalyst: Agent<
  FundamentalContext,
  FundamentalReportDraft,
  FundamentalReport
> = {
  def: {
    stage: "fundamental_analyst",
    instructions: INSTRUCTIONS,
    outputSchema: FundamentalReportDraftSchema,
    buildInput,
  },
  finalize,
};
