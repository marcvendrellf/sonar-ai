/**
 * @sonar-ai/risk-engine — the pure deterministic Risk Officer.
 *
 * Consumes plain values from @sonar-ai/core and returns plain results. No IO,
 * no clock, no randomness: identical input yields identical output. A model can
 * call these through tools but can never widen a limit or approve its own
 * exception.
 */

export { evaluateProposal, type EvaluateInput } from "./engine";
export {
  computeMetrics,
  concentration,
  portfolioBeta,
  portfolioVolatility,
  sectorExposure,
  type InstrumentStats,
} from "./metrics";
export { comparePortfolios } from "./compare";
export { runStressTest, type StressScenario } from "./stress";
export {
  currentWeights,
  investedWeight,
  proposedWeights,
  type WeightMap,
} from "./weights";
export { validateAction, type ActionValidation } from "./rules/validate";
export {
  applyPositionLimit,
  type PositionLimitOutcome,
} from "./rules/position-limit";
export {
  checkCashFloor,
  checkSectorLimits,
  checkTurnover,
  type CashFloorOutcome,
  type SectorBreach,
  type TurnoverOutcome,
} from "./rules/portfolio-limits";
