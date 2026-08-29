import type {
  BearCase,
  Evidence,
  FundamentalReport,
  GraphNode,
  InvestmentCommitteeState,
  Mandate,
  MarketContextReport,
  MaterialEvent,
  PortfolioSnapshot,
  Recommendation,
  RelationshipGraph,
  RiskReport,
  UserDecision,
  Instrument,
} from "@sonar-ai/core";

export interface FundamentalContext {
  mandate: Mandate;
  portfolio: PortfolioSnapshot;
  instrument: Instrument;
  materialEvents: readonly MaterialEvent[];
  evidence: readonly Evidence[];
  relatedNodes: readonly GraphNode[];
}

export interface MarketContext {
  portfolio: PortfolioSnapshot;
  selectedInstruments: readonly Instrument[];
  materialEvents: readonly MaterialEvent[];
  evidence: readonly Evidence[];
  graph: RelationshipGraph;
}

export interface PortfolioManagerContext {
  mode: "proposal" | "revision";
  mandate: Mandate;
  portfolio: PortfolioSnapshot;
  selectedInstruments: readonly Instrument[];
  fundamentalReports: readonly FundamentalReport[];
  marketContext: MarketContextReport;
  proposal?: Recommendation;
  riskReport?: RiskReport;
  bearCase?: BearCase;
}

export interface BearCriticContext {
  recommendation: Recommendation;
  fundamentalReports: readonly FundamentalReport[];
  marketContext: MarketContextReport;
  riskReport: RiskReport;
}

export interface ReportWriterContext {
  event: InvestmentCommitteeState["materialEvents"][number] | null;
  portfolioBefore: PortfolioSnapshot;
  portfolioAfter: PortfolioSnapshot;
  recommendation: Recommendation;
  riskReport: RiskReport;
  bearCase: BearCase | null;
  decision: UserDecision;
  appliedOrderCount: number;
}

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
    mandate: state.mandate,
    portfolio: state.portfolioSnapshot,
    instrument,
    materialEvents: state.materialEvents,
    evidence: evidenceByIds(state, ids),
    relatedNodes: state.graph.nodes.filter(
      (node) => node.instrumentId === instrument.id || ids.size === 0,
    ),
  };
}

export function buildMarketContext(
  state: InvestmentCommitteeState,
  selectedInstruments: readonly Instrument[],
): MarketContext {
  const evidenceIds = new Set<string>();
  for (const event of state.materialEvents) event.evidenceIds.forEach((id) => evidenceIds.add(id));
  for (const edge of state.graph.edges) edge.evidenceIds.forEach((id) => evidenceIds.add(id));

  return {
    portfolio: state.portfolioSnapshot,
    selectedInstruments,
    materialEvents: state.materialEvents,
    evidence: evidenceByIds(state, evidenceIds),
    graph: state.graph,
  };
}

export function buildPortfolioManagerContext(
  state: InvestmentCommitteeState,
  selectedInstruments: readonly Instrument[],
  fundamentalReports: readonly FundamentalReport[],
  marketContext: MarketContextReport,
  extras: Pick<PortfolioManagerContext, "mode" | "proposal" | "riskReport" | "bearCase">,
): PortfolioManagerContext {
  return {
    mode: extras.mode,
    mandate: state.mandate,
    portfolio: state.portfolioSnapshot,
    selectedInstruments,
    fundamentalReports,
    marketContext,
    ...(extras.proposal ? { proposal: extras.proposal } : {}),
    ...(extras.riskReport ? { riskReport: extras.riskReport } : {}),
    ...(extras.bearCase ? { bearCase: extras.bearCase } : {}),
  };
}

export function buildBearCriticContext(
  recommendation: Recommendation,
  fundamentalReports: readonly FundamentalReport[],
  marketContext: MarketContextReport,
  riskReport: RiskReport,
): BearCriticContext {
  return { recommendation, fundamentalReports, marketContext, riskReport };
}

export function buildReportWriterContext(
  state: InvestmentCommitteeState,
): ReportWriterContext {
  if (!state.finalRecommendation || !state.riskReport || !state.userDecision || !state.portfolioAfter) {
    throw new Error("Report Writer context requires final recommendation, risk, decision, and portfolio-after records.");
  }

  return {
    event: state.materialEvents[0] ?? null,
    portfolioBefore: state.portfolioSnapshot,
    portfolioAfter: state.portfolioAfter,
    recommendation: state.finalRecommendation,
    riskReport: state.riskReport,
    bearCase: state.bearCase,
    decision: state.userDecision,
    appliedOrderCount: state.appliedOrders.length,
  };
}
