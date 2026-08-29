import { goldenState } from "../../../packages/core/src/__fixtures__/golden-state"

/**
 * The UI's offline reference run. It is validated by the @sonar-ai/core test
 * suite and is explicitly synthetic—not live market data or investment advice.
 */
export const committeeDemo = goldenState

export const defaultDemoPreferences = {
  paperBudget: 1_000,
  riskProfile: "core",
  assetClasses: ["stocks", "etfs", "crypto"],
} as const

export function getDemoInstrument(instrumentId: string) {
  return committeeDemo.candidateUniverse.find(
    (instrument) => instrument.id === instrumentId
  )
}
