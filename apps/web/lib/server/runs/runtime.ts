import type { InvestmentCommitteeState, PortfolioSnapshot } from "@sonar-ai/core";
import { goldenState } from "../../../../../packages/core/src/__fixtures__/golden-state";
import { createOpenAIAgentRunner } from "../analysis/runner/openai-runner";
import type { AgentRunner } from "../analysis/runner/types";
import { StubAgentRunner } from "../analysis/runner/stub-runner";
import { AlpacaPaperClient } from "../alpaca/client";
import { FixtureAlpacaPaperProvider } from "../alpaca/fixture-provider";
import { getAlpacaPaperConfig } from "../alpaca/config";
import type { ServerEnv } from "../env";

export function resetScenario(state: InvestmentCommitteeState): InvestmentCommitteeState {
  const next = structuredClone(state);
  next.phase = "idle";
  next.run.completedAt = null;
  next.stages = [];
  next.fundamentalReports = [];
  next.marketContext = null;
  next.riskReport = null;
  next.proposal = null;
  next.finalRecommendation = null;
  next.bearCase = null;
  next.proposedActions = [];
  next.riskChecks = [];
  next.userDecision = null;
  next.appliedOrders = [];
  next.portfolioAfter = null;
  next.report = null;
  next.activities = [];
  next.receipt = null;
  return next;
}

export function fixtureRunner(): AgentRunner {
  const bearCase = structuredClone(goldenState.bearCase!);
  bearCase.targetRecommendationId = goldenState.proposal!.id;
  return new StubAgentRunner({
    fundamental_analyst: goldenState.fundamentalReports,
    market_context: goldenState.marketContext!,
    portfolio_manager: [goldenState.proposal!, goldenState.finalRecommendation!],
    bear_critic: bearCase,
    report_writer: goldenState.report!,
  });
}

export function createRunner(env: ServerEnv): AgentRunner {
  return env.SONAR_OFFLINE ? fixtureRunner() : createOpenAIAgentRunner(env);
}

export function createPaperExecutor(env: ServerEnv) {
  return env.SONAR_OFFLINE
    ? undefined
    : new AlpacaPaperClient(getAlpacaPaperConfig());
}

export function createFixturePaperProvider(): FixtureAlpacaPaperProvider {
  return new FixtureAlpacaPaperProvider();
}

export async function createInitialState(
  env: ServerEnv,
  mandate?: InvestmentCommitteeState["mandate"],
): Promise<InvestmentCommitteeState> {
  const state = resetScenario(goldenState);
  if (mandate) state.mandate = mandate;
  if (env.SONAR_OFFLINE) return state;
  if (!mandate || mandate.baseCurrency !== "USD") {
    throw new Error("Live Alpaca Paper runs require an explicit USD mandate.");
  }

  const client = new AlpacaPaperClient(getAlpacaPaperConfig());
  const [account, assets] = await Promise.all([client.getPortfolioSnapshot(), client.listTradableAssets()]);
  const assetSymbols = new Set(assets.map((asset) => asset.symbol.toUpperCase()));
  const instruments = state.candidateUniverse
    .filter((instrument) => assetSymbols.has(instrument.symbol.toUpperCase()))
    .map((instrument) => ({ ...instrument, currency: "USD" as const }));
  if (instruments.length === 0) throw new Error("Alpaca returned no supported tradable candidates.");

  const bySymbol = new Map(instruments.map((instrument) => [instrument.symbol.toUpperCase(), instrument]));
  const quotes = await client.getLatestQuotes(instruments.map((instrument) => instrument.symbol));
  const quoteBySymbol = new Map(quotes.map((quote) => [quote.symbol.toUpperCase(), quote]));
  const marketQuotes = instruments.flatMap((instrument) => {
    const quote = quoteBySymbol.get(instrument.symbol.toUpperCase());
    if (!quote) return [];
    return [{ instrumentId: instrument.id, price: (quote.bidPrice + quote.askPrice) / 2, currency: "USD" as const }];
  });
  if (marketQuotes.length === 0) throw new Error("Alpaca returned no usable quotes for supported candidates.");

  const positions = account.positions.map((position) => {
    const instrument = bySymbol.get(position.symbol.toUpperCase());
    if (!instrument) throw new Error(`Alpaca position "${position.symbol}" is outside supported instrument universe.`);
    return {
      instrumentId: instrument.id,
      quantity: position.quantity,
      avgPrice: { amount: position.averageEntryPriceUsd, currency: "USD" as const },
      marketValue: { amount: position.marketValueUsd, currency: "USD" as const },
      weight: account.equityUsd === 0 ? 0 : position.marketValueUsd / account.equityUsd,
    };
  });
  const portfolioSnapshot: PortfolioSnapshot = {
    id: "pf_alpaca_before",
    asOf: account.observedAt,
    baseCurrency: "USD",
    cash: { amount: account.cashUsd, currency: "USD" },
    nav: { amount: account.equityUsd, currency: "USD" },
    positions,
    label: "live",
  };
  return {
    ...state,
    run: { ...state.run, label: "live" },
    candidateUniverse: instruments,
    portfolioSnapshot,
    marketSnapshot: { asOf: account.observedAt, source: "alpaca", label: "live", quotes: marketQuotes },
  };
}
