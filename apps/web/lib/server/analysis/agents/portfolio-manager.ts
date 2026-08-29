import {
  ProposedActionSchema,
  RecommendationSchema,
  type BearCase,
  type Evidence,
  type FundamentalReport,
  type Instrument,
  type Mandate,
  type MarketContextReport,
  type PortfolioSnapshot,
  type ProposedAction,
  type Recommendation,
  type RiskReport,
} from "@sonar-ai/core";
import { z } from "zod";
import { ClaimDraftSchema, type Agent } from "./types";

/**
 * Portfolio Manager — owns capital allocation. It proposes target weights from
 * the committee's research and revises them after risk + critique.
 *
 * Runs TWICE through one definition: a PROPOSAL pass (no risk report / bear
 * case in context) and a REVISION pass (both present). It reasons over
 * structured summaries — never raw evidence packs — and it does NOT compute
 * risk math or override the Risk Officer.
 */

/** What the Portfolio Manager is allowed to see. Populated by the orchestrator. */
export interface PortfolioManagerContext {
  portfolio: PortfolioSnapshot;
  mandate: Mandate;
  /** The investable candidate universe. */
  instruments: Instrument[];
  /** Research summaries (not raw evidence). */
  fundamentalReports: FundamentalReport[];
  marketContext: MarketContextReport | null;
  /** The evidence records the PM may cite in its bull/context/bear claims. */
  evidence: Evidence[];
  /** Revision-only: the Risk Officer's verdict. Present ⇒ this is the revision pass. */
  riskReport?: RiskReport | null;
  /** Revision-only: the Bear/Critic's case. */
  bearCase?: BearCase | null;
}

// The model supplies each action's instrument, side, target weight, and
// evidence — not its ID or notional. `finalize` computes the notional from NAV
// (so it always satisfies the risk engine's amount≈weight×NAV check) and
// assigns the ID.
const ProposedActionDraftSchema = ProposedActionSchema.omit({
  id: true,
  amount: true,
});

export const RecommendationDraftSchema = RecommendationSchema.omit({
  id: true,
  revision: true,
  actions: true,
  bull: true,
  context: true,
  bear: true,
  expectedCashAfter: true,
}).extend({
  actions: z.array(ProposedActionDraftSchema),
  bull: z.array(ClaimDraftSchema),
  context: z.array(ClaimDraftSchema),
  bear: z.array(ClaimDraftSchema),
});
export type RecommendationDraft = z.infer<typeof RecommendationDraftSchema>;

function isRevision(ctx: PortfolioManagerContext): boolean {
  return Boolean(ctx.riskReport || ctx.bearCase);
}

const round2 = (n: number): number => Math.round(n * 100) / 100;

// ── First-draft prompt (Axel owns the final wording) ─────────────────────────

const INSTRUCTIONS = `You are the Portfolio Manager on an investment committee. You own capital allocation.

From the research summaries, propose a set of paper allocation actions. For each:
- name the instrument, the side (buy/sell), and a target weight as a fraction of NAV;
- cite the evidence that supports it.

Stay within the mandate: no single position over its limit, no sector over its
limit, and hold at least the minimum cash. Then give the structured case:
- bull: why this allocation can work;
- context: the external backdrop it depends on;
- bear: what you are knowingly accepting.
Give an overall confidence (0-1) and the conditions that would invalidate the plan.

Every claim MUST cite evidenceIds from the provided list. Do NOT compute risk
metrics or ratios yourself — the Risk Officer does that. Do NOT set position IDs
or notional amounts — provide target weights only.

On a REVISION pass you also receive the Risk Officer's report and the Bear/Critic's
case: adopt any resized sizing, address the strongest bear points, and keep the
plan within the mandate. Return only the required JSON.`;

function summarizeFundamentals(reports: FundamentalReport[]): string {
  if (reports.length === 0) return "(no fundamental reports)";
  return reports
    .map(
      (r) =>
        `- ${r.instrumentId}: quality — ${r.quality} | valuation — ${r.valuation}` +
        (r.claims.length
          ? ` | evidence: ${r.claims.flatMap((c) => c.evidenceIds).join(", ")}`
          : ""),
    )
    .join("\n");
}

function summarizeRisk(risk: RiskReport): string {
  const checks = risk.checks
    .map(
      (c) =>
        `  · ${c.actionId}: ${c.result}` +
        (c.breachCode ? ` (${c.breachCode})` : "") +
        ` — ${c.detail}`,
    )
    .join("\n");
  return [
    `Hard blocks: ${risk.hardBlocks.length ? risk.hardBlocks.join(", ") : "none"}`,
    `Checks:\n${checks}`,
  ].join("\n");
}

function buildInput(ctx: PortfolioManagerContext): string {
  const nav = ctx.portfolio.nav.amount;
  const { limits } = ctx.mandate;

  const universe =
    ctx.instruments
      .map((i) => `- ${i.symbol} (${i.id}) — sector ${i.sector}`)
      .join("\n") || "(none)";

  const evidenceList =
    ctx.evidence.map((e) => `- ${e.id} | ${e.title}`).join("\n") || "(none)";

  const blocks = [
    `Pass: ${isRevision(ctx) ? "REVISION" : "PROPOSAL"}.`,
    `Portfolio: NAV ${nav} ${ctx.portfolio.baseCurrency}, cash ${ctx.portfolio.cash.amount}, ${ctx.portfolio.positions.length} positions.`,
    `Mandate limits: position ≤ ${limits.maxGrossExposurePerPosition}, sector ≤ ${limits.maxSectorExposure}, cash ≥ ${limits.minCashRatio}, turnover ≤ ${limits.maxTurnoverPerEvent}.`,
    `Candidate universe:\n${universe}`,
    `Fundamental research:\n${summarizeFundamentals(ctx.fundamentalReports)}`,
    `Market context:\n${ctx.marketContext ? ctx.marketContext.summary : "(none)"}`,
    `Evidence you may cite:\n${evidenceList}`,
  ];

  if (ctx.riskReport) blocks.push(`Risk Officer report:\n${summarizeRisk(ctx.riskReport)}`);
  if (ctx.bearCase) {
    blocks.push(
      `Bear/Critic case:\n- weaknesses: ${ctx.bearCase.weaknesses.join("; ") || "none"}\n- failure scenarios: ${ctx.bearCase.failureScenarios.join("; ") || "none"}`,
    );
  }

  blocks.push(
    `Produce the recommendation as JSON matching the required schema. Provide target weights only; every claim.evidenceIds entry MUST come from the evidence list above.`,
  );
  return blocks.join("\n\n");
}

/** Assign IDs, compute notionals from NAV, and derive expected cash. */
function finalize(
  draft: RecommendationDraft,
  ctx: PortfolioManagerContext,
): Recommendation {
  const revision = isRevision(ctx) ? 1 : 0;
  const id = revision === 1 ? "rec_final" : "rec_proposal";
  const nav = ctx.portfolio.nav.amount;
  const currency = ctx.portfolio.baseCurrency;

  const actions: ProposedAction[] = draft.actions.map((a) => ({
    id: `acn_${a.instrumentId}_r${revision}`,
    instrumentId: a.instrumentId,
    side: a.side,
    targetWeight: a.targetWeight,
    amount: { amount: round2(a.targetWeight * nav), currency },
    evidenceIds: a.evidenceIds,
  }));

  const buys = actions
    .filter((a) => a.side === "buy")
    .reduce((sum, a) => sum + a.amount.amount, 0);
  const sells = actions
    .filter((a) => a.side === "sell")
    .reduce((sum, a) => sum + a.amount.amount, 0);
  const expectedCashAfter = {
    amount: round2(ctx.portfolio.cash.amount - buys + sells),
    currency,
  };

  const withIds = (
    claims: RecommendationDraft["bull"],
    kind: "bull" | "context" | "bear",
  ) => claims.map((c, i) => ({ id: `clm_${id}_${kind}_${i}`, ...c }));

  return {
    id,
    revision,
    actions,
    bull: withIds(draft.bull, "bull"),
    context: withIds(draft.context, "context"),
    bear: withIds(draft.bear, "bear"),
    confidence: draft.confidence,
    invalidationConditions: draft.invalidationConditions,
    expectedCashAfter,
  };
}

export const portfolioManager: Agent<
  PortfolioManagerContext,
  RecommendationDraft,
  Recommendation
> = {
  def: {
    stage: "portfolio_manager",
    instructions: INSTRUCTIONS,
    outputSchema: RecommendationDraftSchema,
    buildInput,
  },
  finalize,
};
