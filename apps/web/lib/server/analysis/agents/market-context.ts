import {
  MarketContextReportSchema,
  type Evidence,
  type Instrument,
  type MarketContextReport,
  type MaterialEvent,
  type Position,
} from "@sonar-ai/core";
import { z } from "zod";
import { ClaimDraftSchema, type Agent } from "./types";

/**
 * Market Context Analyst — evaluates the external world around the fund's
 * assets: news, sector, macro, competitors, regulation, and material events.
 *
 * Authority: explain material external context. It does NOT evaluate a single
 * company's fundamentals (that is the Fundamental Analyst), and it does NOT size
 * positions or turn one macro fact into a trade (that is the Portfolio Manager).
 * Runs once per committee run and produces one report.
 */

/** What the Market Context Analyst is allowed to see. Populated by the orchestrator. */
export interface MarketContextContext {
  /** The assets in scope (the candidate universe / selected set). */
  instruments: Instrument[];
  /** The material events driving this run. */
  materialEvents: MaterialEvent[];
  /**
   * The isolated, pre-fetched sector / macro / news evidence pack. The ONLY
   * window this agent has — it never sees the fundamental reports, the risk
   * report, or the mandate.
   */
  evidence: Evidence[];
  /** Current portfolio holdings, for framing (empty on the all-cash baseline). */
  holdings: Position[];
}

export const MarketContextReportDraftSchema = MarketContextReportSchema.omit({
  id: true,
  claims: true,
}).extend({ claims: z.array(ClaimDraftSchema) });
export type MarketContextReportDraft = z.infer<
  typeof MarketContextReportDraftSchema
>;

// ── First-draft prompt (Axel owns the final wording) ─────────────────────────

const INSTRUCTIONS = `You are the Market Context Analyst on an investment committee.

Assess the EXTERNAL context around the assets in scope, using ONLY the evidence
provided. Produce:
- summary: the one or two forces that matter most right now;
- drivers: the concrete external drivers (demand, policy, supply, cycle);
- sectorView: where the relevant sectors sit in their cycle;
- macroView: the macro and regulatory backdrop.

Then list claims. Every claim MUST cite one or more evidenceIds drawn ONLY from
the provided pack — never invent an ID or a fact. Mark each claim's stance as
"bull", "bear", "neutral", or "context".

Do NOT evaluate a single company's balance sheet in depth (Fundamental Analyst's
job) and do NOT propose weights or trades (Portfolio Manager's job). Return only
the required JSON.`;

function buildInput(ctx: MarketContextContext): string {
  const assets =
    ctx.instruments
      .map((i) => `- ${i.symbol} (${i.name}) — sector ${i.sector}`)
      .join("\n") || "(no assets in scope)";

  const events =
    ctx.materialEvents
      .map((e) => `- ${e.id} | ${e.headline} — ${e.summary} (${e.label})`)
      .join("\n") || "(no material events)";

  const holdings =
    ctx.holdings
      .map((p) => `- ${p.instrumentId} @ ${Math.round(p.weight * 100)}% of NAV`)
      .join("\n") || "(all cash — no holdings)";

  const evidenceBlock =
    ctx.evidence
      .map(
        (e) =>
          `- ${e.id} | ${e.title} | ${e.sourceName} | observed ${e.observedAt} | ${e.label}` +
          (e.snippet ? ` | ${e.snippet}` : ""),
      )
      .join("\n") || "(no evidence provided)";

  return [
    `Assets in scope:\n${assets}`,
    `Current holdings:\n${holdings}`,
    `Material events:\n${events}`,
    `Evidence pack — cite ONLY these evidence IDs:\n${evidenceBlock}`,
    `Produce a market-context assessment as JSON matching the required schema. Every claim.evidenceIds entry MUST be one of the IDs listed above.`,
  ].join("\n\n");
}

/** Assign deterministic IDs, turning the model draft into a core report. */
function finalize(draft: MarketContextReportDraft): MarketContextReport {
  return {
    id: "mrp_main",
    summary: draft.summary,
    drivers: draft.drivers,
    sectorView: draft.sectorView,
    macroView: draft.macroView,
    claims: draft.claims.map((claim, index) => ({
      id: `clm_mrp_${index}`,
      ...claim,
    })),
  };
}

export const marketContextAnalyst: Agent<
  MarketContextContext,
  MarketContextReportDraft,
  MarketContextReport
> = {
  def: {
    stage: "market_context",
    instructions: INSTRUCTIONS,
    outputSchema: MarketContextReportDraftSchema,
    buildInput,
  },
  finalize: (draft) => finalize(draft),
};
