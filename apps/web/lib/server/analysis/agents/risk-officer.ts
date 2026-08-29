import {
  type Instrument,
  type Mandate,
  type PortfolioSnapshot,
  type ProposedAction,
  type RiskReport,
} from "@sonar-ai/core";
import { evaluateProposal } from "@sonar-ai/risk-engine";
import type { InstrumentStats } from "@sonar-ai/risk-engine";
import type { StressScenario } from "@sonar-ai/risk-engine";

export interface RiskOfficerInput {
  portfolio: PortfolioSnapshot;
  mandate: Mandate;
  actions: readonly ProposedAction[];
  instruments: readonly Instrument[];
  instrumentStats?: InstrumentStats;
  stressScenarios?: readonly StressScenario[];
  reportId: string;
}

/** Risk Officer has no model path in MVP. This is pure deterministic analytics. */
export function runRiskOfficer(input: RiskOfficerInput): RiskReport {
  return evaluateProposal(input);
}
