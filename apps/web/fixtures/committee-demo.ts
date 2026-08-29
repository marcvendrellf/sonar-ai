import { goldenState } from "../../../packages/core/src/__fixtures__/golden-state"

/**
 * The UI's offline reference run. It is validated by the @sonar-ai/core test
 * suite and is explicitly synthetic—not live market data or investment advice.
 */
export const committeeDemo = goldenState

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
