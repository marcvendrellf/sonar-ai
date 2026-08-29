import { goldenState } from "../../../packages/core/src/__fixtures__/golden-state"

const defensiveGrowthInstruments = [
  { id: "inst_brk_b", symbol: "BRK.B", name: "Berkshire Hathaway", sector: "Diversified", assetClass: "equity", currency: "USD" },
  { id: "inst_msft", symbol: "MSFT", name: "Microsoft", sector: "Technology", assetClass: "equity", currency: "USD" },
  { id: "inst_googl", symbol: "GOOGL", name: "Alphabet", sector: "Communication Services", assetClass: "equity", currency: "USD" },
  { id: "inst_jpm", symbol: "JPM", name: "JPMorgan Chase", sector: "Financials", assetClass: "equity", currency: "USD" },
  { id: "inst_v", symbol: "V", name: "Visa", sector: "Financials", assetClass: "equity", currency: "USD" },
  { id: "inst_amzn", symbol: "AMZN", name: "Amazon", sector: "Consumer Discretionary", assetClass: "equity", currency: "USD" },
  { id: "inst_cost", symbol: "COST", name: "Costco", sector: "Consumer Staples", assetClass: "equity", currency: "USD" },
  { id: "inst_jnj", symbol: "JNJ", name: "Johnson & Johnson", sector: "Healthcare", assetClass: "equity", currency: "USD" },
  { id: "inst_pg", symbol: "PG", name: "Procter & Gamble", sector: "Consumer Staples", assetClass: "equity", currency: "USD" },
  { id: "inst_xom", symbol: "XOM", name: "Exxon Mobil", sector: "Energy", assetClass: "equity", currency: "USD" },
  { id: "inst_tsm", symbol: "TSM", name: "Taiwan Semiconductor", sector: "Semiconductors", assetClass: "equity", currency: "USD" },
  { id: "inst_sgov", symbol: "SGOV", name: "0–3 Month US Treasuries", sector: "Fixed Income", assetClass: "etf", currency: "USD" },
  { id: "inst_ief", symbol: "IEF", name: "7–10Y US Treasuries", sector: "Fixed Income", assetClass: "etf", currency: "USD" },
  { id: "inst_bnd", symbol: "BND", name: "Total US Bond Market", sector: "Fixed Income", assetClass: "etf", currency: "USD" },
  { id: "inst_tip", symbol: "TIP", name: "US TIPS", sector: "Fixed Income", assetClass: "etf", currency: "USD" },
  { id: "inst_lqd", symbol: "LQD", name: "Investment Grade Corporates", sector: "Fixed Income", assetClass: "etf", currency: "USD" },
  { id: "inst_btc", symbol: "BTC-USD", name: "Bitcoin", sector: "Crypto", assetClass: "crypto", currency: "USD" },
  { id: "inst_eth", symbol: "ETH-USD", name: "Ethereum", sector: "Crypto", assetClass: "crypto", currency: "USD" },
] as const

const defensiveGrowthPositions = [
  ["inst_brk_b", 0.08, 480], ["inst_msft", 0.07, 520],
  ["inst_googl", 0.06, 215], ["inst_jpm", 0.05, 310],
  ["inst_v", 0.05, 345], ["inst_amzn", 0.04, 235],
  ["inst_cost", 0.04, 980], ["inst_jnj", 0.04, 185],
  ["inst_pg", 0.04, 170], ["inst_xom", 0.04, 125],
  ["inst_tsm", 0.04, 265], ["inst_sgov", 0.15, 100.5],
  ["inst_ief", 0.08, 96], ["inst_bnd", 0.08, 74],
  ["inst_tip", 0.05, 110], ["inst_lqd", 0.04, 112],
  ["inst_btc", 0.04, 112000], ["inst_eth", 0.01, 4600],
] as const

/**
 * The UI's offline reference run. It is validated by the @sonar-ai/core test
 * suite and is explicitly synthetic—not live market data or investment advice.
 */
export const committeeDemo = {
  ...goldenState,
  candidateUniverse: [...goldenState.candidateUniverse, ...defensiveGrowthInstruments],
  portfolioAfter: {
    id: "pf_defensive_growth",
    asOf: "2026-08-29T14:05:30Z",
    baseCurrency: "USD",
    cash: { amount: 0, currency: "USD" },
    nav: { amount: 1000, currency: "USD" },
    positions: defensiveGrowthPositions.map(([instrumentId, weight, avgPrice]) => ({
      instrumentId,
      quantity: (weight * 100_000) / avgPrice,
      avgPrice: { amount: avgPrice, currency: "USD" },
      marketValue: { amount: weight * 1000, currency: "USD" },
      weight,
    })),
    label: "synthetic",
  },
}

export const defaultDemoPreferences = {
  paperBudget: 100_000,
  currency: "USD",
  riskProfile: "core",
  assetClasses: ["stocks", "etfs", "crypto"],
} as const

const DEMO_NOTIONAL_SCALE = 100

export function scaleDemoNotional(amount: number) {
  return amount * DEMO_NOTIONAL_SCALE
}

export function getDemoInstrument(instrumentId: string) {
  return committeeDemo.candidateUniverse.find(
    (instrument) => instrument.id === instrumentId
  )
}
