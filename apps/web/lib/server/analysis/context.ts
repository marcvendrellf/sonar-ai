import type {
  BearCase,
  Evidence,
  FundamentalReport,
  Instrument,
  InvestmentCommitteeState,
  MarketContextReport,
  Recommendation,
  RiskReport,
} from "@sonar-ai/core";
import type { BearCriticContext } from "./agents/bear-critic";
import type { FundamentalContext } from "./agents/fundamental-analyst";
import type { MarketContextContext } from "./agents/market-context";
import type { PortfolioManagerContext } from "./agents/portfolio-manager";
import type { ReportWriterContext } from "./agents/report-writer";

/**
 * Context builders — the orchestration lane's job of turning committee state
 * into each agent's isolated context. The context TYPES are owned by the agent
 * modules (agents lane); these functions only populate them.
 */

function evidenceIdsForInstrument(state: InvestmentCommitteeState, instrumentId: string): Set<string> {
  const ids = new Set<string>();
  for (const node of state.graph.nodes) {
    if (node.instrumentId === instrumentId) {
      node.evidenceIds.forEach((id) => ids.add(id));
    }
  }
  for (const edge of state.graph.edges) {
    if (
      state.graph.nodes.some((node) => node.id === edge.source && node.instrumentId === instrumentId) ||
      state.graph.nodes.some((node) => node.id === edge.target && node.instrumentId === instrumentId)
    ) {
      edge.evidenceIds.forEach((id) => ids.add(id));
    }
  }
  return ids;
}

function evidenceByIds(state: InvestmentCommitteeState, ids: Set<string>): Evidence[] {
  return state.evidence.filter((evidence) => ids.has(evidence.id));
}

export function buildFundamentalContext(
  state: InvestmentCommitteeState,
  instrument: Instrument,
): FundamentalContext {
  const ids = evidenceIdsForInstrument(state, instrument.id);
  for (const event of state.materialEvents) event.evidenceIds.forEach((id) => ids.add(id));

  return {
    instrument,
    evidence: evidenceByIds(state, ids),
    priorThesis: null,
  };
}

export function buildMarketContext(
  state: InvestmentCommitteeState,
  selectedInstruments: readonly Instrument[],
): MarketContextContext {
  const evidenceIds = new Set<string>();
  for (const event of state.materialEvents) event.evidenceIds.forEach((id) => evidenceIds.add(id));
  for (const edge of state.graph.edges) edge.evidenceIds.forEach((id) => evidenceIds.add(id));

  return {
    instruments: [...selectedInstruments],
    mandate: state.mandate,
    materialEvents: [...state.materialEvents],
    evidence: evidenceByIds(state, evidenceIds),
    holdings: [...state.portfolioSnapshot.positions],
  };
}

/** Extra inputs the Portfolio Manager receives on the revision pass. */
export interface PortfolioManagerExtras {
  mode: "proposal" | "revision";
  proposal?: Recommendation;
  riskReport?: RiskReport;
  bearCase?: BearCase;
}

export function buildPortfolioManagerContext(
  state: InvestmentCommitteeState,
  selectedInstruments: readonly Instrument[],
  fundamentalReports: readonly FundamentalReport[],
  marketContext: MarketContextReport,
  extras: PortfolioManagerExtras,
): PortfolioManagerContext {
  // My PM infers the pass from the presence of risk/bear (revision ⇒ present).
  return {
    portfolio: state.portfolioSnapshot,
    mandate: state.mandate,
    instruments: [...selectedInstruments],
    fundamentalReports: [...fundamentalReports],
    marketContext,
    evidence: state.evidence,
    riskReport: extras.riskReport ?? null,
    bearCase: extras.bearCase ?? null,
  };
}

export function buildBearCriticContext(
  recommendation: Recommendation,
  fundamentalReports: readonly FundamentalReport[],
  marketContext: MarketContextReport,
  riskReport: RiskReport,
  evidence: Evidence[],
): BearCriticContext {
  return {
    recommendation,
    fundamentalReports: [...fundamentalReports],
    marketContext,
    riskReport,
    evidence,
  };
}

export function buildReportWriterContext(
  state: InvestmentCommitteeState,
): ReportWriterContext {
  if (!state.finalRecommendation || !state.riskReport || !state.userDecision || !state.portfolioAfter) {
    throw new Error("Report Writer context requires final recommendation, risk, decision, and portfolio-after records.");
  }

  return {
    recommendation: state.finalRecommendation,
    userDecision: state.userDecision,
    appliedOrders: state.appliedOrders,
    comparison: state.riskReport.comparison,
    event: state.materialEvents[0] ?? null,
    evidence: state.evidence,
  };
}
