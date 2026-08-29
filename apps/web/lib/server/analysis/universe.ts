import {
  InvestmentCommitteeStateSchema,
  type Evidence,
  type Instrument,
  type InvestmentCommitteeState,
  type MaterialEvent,
} from "@sonar-ai/core";
import type { AlpacaPaperPortfolioSnapshot, AlpacaQuote } from "@sonar-ai/core/alpaca";

/**
 * A broad, diversified watchlist of real, liquid, Alpaca-tradable US names. The
 * committee's Market Context analyst SELECTS its candidates from this list —
 * it's the fund's investable universe, not a pre-picked answer. A large list
 * keeps the selection a genuine judgment call while keeping the run reliable
 * (no open-universe discovery against a slow/rate-limited knowledge API).
 *
 * Sectors are set here because Alpaca's asset feed carries none, and the
 * deterministic risk engine enforces a sector-exposure limit.
 */
const RAW: Array<[symbol: string, name: string, sector: string]> = [
  // Semiconractors
  ["NVDA", "NVIDIA", "Semiconductors"],
  ["AMD", "Advanced Micro Devices", "Semiconductors"],
  ["AVGO", "Broadcom", "Semiconductors"],
  ["MU", "Micron Technology", "Semiconductors"],
  ["INTC", "Intel", "Semiconductors"],
  ["QCOM", "Qualcomm", "Semiconductors"],
  ["TSM", "Taiwan Semiconductor", "Semiconductors"],
  ["ARM", "Arm Holdings", "Semiconductors"],
  // Software & hyperscalers
  ["MSFT", "Microsoft", "Software"],
  ["GOOGL", "Alphabet", "Software"],
  ["AMZN", "Amazon", "Consumer Discretionary"],
  ["META", "Meta Platforms", "Software"],
  ["ORCL", "Oracle", "Software"],
  ["PLTR", "Palantir Technologies", "Software"],
  ["CRM", "Salesforce", "Software"],
  // Technology hardware & networking
  ["DELL", "Dell Technologies", "Technology Hardware"],
  ["SMCI", "Super Micro Computer", "Technology Hardware"],
  ["ANET", "Arista Networks", "Technology Hardware"],
  ["CSCO", "Cisco Systems", "Technology Hardware"],
  ["AAPL", "Apple", "Technology Hardware"],
  // Power, grid & energy (the second-order AI-datacenter beneficiaries)
  ["VST", "Vistra", "Utilities"],
  ["CEG", "Constellation Energy", "Utilities"],
  ["NEE", "NextEra Energy", "Utilities"],
  ["NRG", "NRG Energy", "Utilities"],
  ["GEV", "GE Vernova", "Industrials"],
  ["ETN", "Eaton", "Industrials"],
  ["PWR", "Quanta Services", "Industrials"],
  ["FSLR", "First Solar", "Energy"],
  // Broad industrials & diversification
  ["GE", "GE Aerospace", "Industrials"],
  ["HON", "Honeywell", "Industrials"],
  ["CAT", "Caterpillar", "Industrials"],
  ["JPM", "JPMorgan Chase", "Financials"],
  ["UNH", "UnitedHealth Group", "Healthcare"],
  ["LLY", "Eli Lilly", "Healthcare"],
  ["XOM", "Exxon Mobil", "Energy"],
  ["WMT", "Walmart", "Consumer Staples"],
  ["KO", "Coca-Cola", "Consumer Staples"],
];

export const DEMO_UNIVERSE: Instrument[] = RAW.map(([symbol, name, sector]) => ({
  id: `inst_${symbol.toLowerCase()}`,
  symbol,
  name,
  sector,
  assetClass: symbol === "SPY" || symbol === "QQQ" ? "etf" : "equity",
  currency: "USD",
}));

/** The seed event that frames the run. Labeled synthetic; agents fetch real evidence. */
export const DEMO_SEED_EVIDENCE: Evidence = {
  id: "ev_seed_event",
  kind: "market",
  title: "Hyperscaler AI datacenter capex hits record; grid power flagged as bottleneck",
  sourceName: "Committee brief",
  observedAt: "2026-08-29T09:00:00Z",
  label: "synthetic",
};

export const DEMO_EVENT: MaterialEvent = {
  id: "evt_ai_capex",
  headline: "Record 2027 AI-datacenter capex; power and grid named the binding constraint",
  summary:
    "Major hyperscalers guide to record AI infrastructure spend for 2027. Coverage centers on GPUs, but the binding constraint is increasingly power generation, grid equipment, and datacenter build-out — a chain of second-order beneficiaries.",
  occurredAt: "2026-08-29T09:00:00Z",
  label: "synthetic",
  evidenceIds: [DEMO_SEED_EVIDENCE.id],
};

function midPrice(quote: AlpacaQuote): number {
  if (quote.askPrice > 0 && quote.bidPrice > 0) return (quote.bidPrice + quote.askPrice) / 2;
  return quote.askPrice > 0 ? quote.askPrice : quote.bidPrice;
}

export interface AssembleScenarioInput {
  account: AlpacaPaperPortfolioSnapshot;
  quotes: readonly AlpacaQuote[];
  now: string;
  universe?: readonly Instrument[];
  event?: MaterialEvent;
  seedEvidence?: Evidence;
  runId?: string;
}

/**
 * Assemble a validated, idle USD committee state for a live recording: the
 * watchlist filtered to names Alpaca actually quotes, a market snapshot from
 * those live quotes, and a USD portfolio from the paper account. Pure — the
 * caller supplies the fetched Alpaca data, so this is unit-testable.
 */
export function assembleLiveScenario(input: AssembleScenarioInput): InvestmentCommitteeState {
  const universe = input.universe ?? DEMO_UNIVERSE;
  const event = input.event ?? DEMO_EVENT;
  const seed = input.seedEvidence ?? DEMO_SEED_EVIDENCE;
  const runId = input.runId ?? "run_demo1";

  const priceBySymbol = new Map<string, number>();
  for (const quote of input.quotes) {
    const price = midPrice(quote);
    if (price > 0) priceBySymbol.set(quote.symbol.toUpperCase(), price);
  }

  // Keep only names Alpaca actually prices — an unpriced candidate can't be
  // sized or executed on the paper ledger.
  const tradable = universe.filter((instrument) => priceBySymbol.has(instrument.symbol.toUpperCase()));
  if (tradable.length === 0) throw new Error("No watchlist symbols returned a usable Alpaca quote.");

  const bySymbol = new Map(tradable.map((instrument) => [instrument.symbol.toUpperCase(), instrument]));
  const nav = input.account.equityUsd;
  const positions = input.account.positions.flatMap((position) => {
    const instrument = bySymbol.get(position.symbol.toUpperCase());
    if (!instrument) return []; // A holding outside the watchlist is ignored for the demo.
    return [{
      instrumentId: instrument.id,
      quantity: position.quantity,
      avgPrice: { amount: position.averageEntryPriceUsd, currency: "USD" as const },
      marketValue: { amount: position.marketValueUsd, currency: "USD" as const },
      weight: nav > 0 ? position.marketValueUsd / nav : 0,
    }];
  });

  const state: InvestmentCommitteeState = {
    run: { id: runId, scenarioId: "scn_demo_live", startedAt: input.now, completedAt: null, label: "live" },
    phase: "idle",
    mandate: {
      id: `mnd_${runId}`,
      baseCurrency: "USD",
      initialCash: { amount: input.account.cashUsd, currency: "USD" },
      limits: { maxGrossExposurePerPosition: 0.3, maxSectorExposure: 0.45, minCashRatio: 0.1, maxTurnoverPerEvent: 0.2 },
    },
    candidateUniverse: tradable,
    portfolioSnapshot: {
      id: "pf_before",
      asOf: input.account.observedAt,
      baseCurrency: "USD",
      cash: { amount: input.account.cashUsd, currency: "USD" },
      nav: { amount: nav, currency: "USD" },
      positions,
      label: "live",
    },
    materialEvents: [event],
    marketSnapshot: {
      asOf: input.account.observedAt,
      source: "alpaca",
      label: "live",
      quotes: tradable.map((instrument) => ({
        instrumentId: instrument.id,
        price: priceBySymbol.get(instrument.symbol.toUpperCase())!,
        currency: "USD" as const,
      })),
    },
    evidence: [seed],
    graph: { nodes: [], edges: [] },
    stages: [],
    fundamentalReports: [],
    marketContext: null,
    riskReport: null,
    proposal: null,
    finalRecommendation: null,
    bearCase: null,
    proposedActions: [],
    riskChecks: [],
    userDecision: null,
    appliedOrders: [],
    portfolioAfter: null,
    report: null,
    activities: [],
    receipt: null,
  };

  return InvestmentCommitteeStateSchema.parse(state);
}
