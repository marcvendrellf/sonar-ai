import {
  UserDecisionSchema,
  type InvestmentCommitteeState,
  type UserDecision,
} from "@sonar-ai/core";
import type { AlpacaOrderResponse, AlpacaPaperOrderRequest, AlpacaPaperPortfolioSnapshot } from "@sonar-ai/core/alpaca";
import type { InstrumentStats, StressScenario } from "@sonar-ai/risk-engine";
import { runRiskOfficer } from "./agents/risk-officer";
import { AnalysisOrchestrator } from "./orchestrator";
import type { AgentRunner } from "./runner/types";
import { buildIdleState, type RiskPreferences } from "./build-state";
import { getRunStore, type RunStore } from "../runs/run-store";

export interface AlpacaExecutor {
  submitPaperOrder(input: AlpacaPaperOrderRequest): Promise<AlpacaOrderResponse>;
}

/** Raised when the caller asks to act on a run the store doesn't hold. */
export class RunNotFoundError extends Error {
  constructor(public readonly runId: string) {
    super(`No analysis run found for id "${runId}".`);
    this.name = "RunNotFoundError";
  }
}

/** Raised when a run exists but isn't in a state that permits the operation. */
export class RunConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RunConflictError";
  }
}

export interface StartAnalysisRunInput {
  riskPreferences: RiskPreferences;
  /** The agent runner: OpenAI live, or a stub/recording runner offline. */
  runner: AgentRunner;
  /** Scenario supplying the universe, evidence, graph, and market snapshot. */
  scenario: InvestmentCommitteeState;
  /** A loaded Alpaca portfolio to run against (used when currency-compatible). */
  alpacaSnapshot?: AlpacaPaperPortfolioSnapshot;
  instrumentStats?: InstrumentStats;
  stressScenarios?: readonly StressScenario[];
  label?: InvestmentCommitteeState["run"]["label"];
  store?: RunStore;
  now?: string;
  runId?: string;
}

/**
 * Start one committee run. Assembles the idle state (risk preferences + Alpaca
 * portfolio + discovery scenario), runs the committee up to — and stopping at —
 * the human-approval gate (no `userDecision` is passed), then persists the run
 * so a later `approveAnalysisRun` can find and execute it.
 *
 * The run never mutates any ledger: discovery, research, proposal, deterministic
 * risk, critique, and revision all happen here, but nothing is applied until a
 * human approves.
 */
export async function startAnalysisRun(
  input: StartAnalysisRunInput,
): Promise<InvestmentCommitteeState> {
  const store = input.store ?? getRunStore();
  const state = buildIdleState({
    scenario: input.scenario,
    riskPreferences: input.riskPreferences,
    ...(input.alpacaSnapshot ? { alpacaSnapshot: input.alpacaSnapshot } : {}),
    ...(input.label ? { label: input.label } : {}),
    ...(input.now ? { now: input.now } : {}),
    ...(input.runId ? { runId: input.runId } : {}),
  });

  const orchestrator = new AnalysisOrchestrator({
    runner: input.runner,
    ...(input.instrumentStats ? { instrumentStats: input.instrumentStats } : {}),
    ...(input.stressScenarios ? { stressScenarios: input.stressScenarios } : {}),
  });

  // No userDecision: the committee halts at `awaiting_approval` (or `blocked`).
  const result = await orchestrator.run({ state });

  store.save({
    state: result,
    ...(input.instrumentStats ? { instrumentStats: input.instrumentStats } : {}),
    ...(input.stressScenarios ? { stressScenarios: input.stressScenarios } : {}),
    updatedAt: input.now ?? new Date().toISOString(),
  });

  return result;
}

export interface ApproveAnalysisRunInput {
  runId: string;
  decision: {
    decision: "approved" | "rejected";
    decidedBy?: string;
    note?: string;
  };
  /** The same runner used at run time (the report writer runs at approval). */
  runner: AgentRunner;
  /** Live Alpaca executor. Absent = internal deterministic paper ledger only. */
  alpacaClient?: AlpacaExecutor;
  store?: RunStore;
  now?: string;
}

/**
 * Apply a human decision to a pending run. Before anything is executed the
 * deterministic risk checks are RE-RUN on the exact actions being approved,
 * using the risk inputs captured at run time — a hard block here refuses the
 * approval outright, so no revision or timing gap can smuggle an action past a
 * limit the risk engine already enforced. On approval the orchestrator applies
 * the actions (to Alpaca Paper when an executor is provided, otherwise the
 * internal ledger), writes the report, and produces the decision receipt.
 */
export async function approveAnalysisRun(
  input: ApproveAnalysisRunInput,
): Promise<InvestmentCommitteeState> {
  const store = input.store ?? getRunStore();
  const entry = store.get(input.runId);
  if (!entry) throw new RunNotFoundError(input.runId);

  const state = entry.state;
  if (state.phase !== "awaiting_approval") {
    throw new RunConflictError(
      `Run "${input.runId}" is "${state.phase}", not awaiting approval.`,
    );
  }
  if (!state.finalRecommendation || !state.riskReport) {
    throw new RunConflictError(`Run "${input.runId}" has no recommendation to approve.`);
  }

  // Deterministic re-check on the approved actions. Independent of the model.
  const recheck = runRiskOfficer({
    portfolio: state.portfolioSnapshot,
    mandate: state.mandate,
    actions: state.finalRecommendation.actions,
    instruments: state.candidateUniverse,
    ...(entry.instrumentStats ? { instrumentStats: entry.instrumentStats } : {}),
    ...(entry.stressScenarios ? { stressScenarios: entry.stressScenarios } : {}),
    reportId: `rrp_recheck_${state.run.id}`,
  });
  if (recheck.hardBlocks.length > 0) {
    throw new RunConflictError(
      `Approval refused: deterministic risk re-check hard-blocked (${recheck.hardBlocks.join(", ")}).`,
    );
  }

  const decision: UserDecision = UserDecisionSchema.parse({
    decision: input.decision.decision,
    decidedAt: input.now ?? new Date().toISOString(),
    ...(input.decision.decidedBy ? { decidedBy: input.decision.decidedBy } : {}),
    ...(input.decision.note ? { note: input.decision.note } : {}),
  });

  const orchestrator = new AnalysisOrchestrator({
    runner: input.runner,
    ...(entry.instrumentStats ? { instrumentStats: entry.instrumentStats } : {}),
    ...(entry.stressScenarios ? { stressScenarios: entry.stressScenarios } : {}),
    ...(input.alpacaClient ? { alpacaClient: input.alpacaClient } : {}),
  });

  const result = await orchestrator.approve(state, decision);
  store.save({
    ...entry,
    state: result,
    updatedAt: decision.decidedAt,
  });
  return result;
}
