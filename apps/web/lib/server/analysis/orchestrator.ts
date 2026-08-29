import {
  AGENT_STAGES,
  InvestmentCommitteeStateSchema,
  UserDecisionSchema,
  type ActivityEvent,
  type AgentStage,
  type Evidence,
  type FundamentalReport,
  type InvestmentCommitteeState,
  type RiskReport,
  type StageRecord,
  type UserDecision,
} from "@sonar-ai/core";
import { type InstrumentStats, type StressScenario } from "@sonar-ai/risk-engine";
import { bearCritic } from "./agents/bear-critic";
import { fundamentalAnalyst } from "./agents/fundamental-analyst";
import { marketContextAnalyst } from "./agents/market-context";
import { portfolioManager } from "./agents/portfolio-manager";
import { reportWriter } from "./agents/report-writer";
import { runRiskOfficer } from "./agents/risk-officer";
import type { Agent } from "./agents/types";
import {
  buildBearCriticContext,
  buildFundamentalContext,
  buildMarketContext,
  buildPortfolioManagerContext,
  buildReportWriterContext,
} from "./context";
import { checkEvidenceGate, checkHumanApprovalGate, checkRiskGate } from "./gates";
import { applyPaperActions } from "./trader";
import type { AgentDef, AgentRunner } from "./runner/types";

export interface AnalysisOrchestratorOptions {
  runner: AgentRunner;
  instrumentStats?: InstrumentStats;
  stressScenarios?: readonly StressScenario[];
}

export interface AnalysisRunInput {
  /** An idle, validated state containing inputs, evidence, and graph. */
  state: InvestmentCommitteeState;
  /** Explicit selection keeps candidate selection deterministic and replayable. */
  selectedInstrumentIds: readonly string[];
  /** Optional decision for callers that can provide approval in the same request. */
  userDecision?: UserDecision;
}

const STAGE_OFFSETS: Record<AgentStage, number> = {
  fundamental_analyst: 60,
  market_context: 60,
  portfolio_manager: 240,
  risk_officer: 270,
  bear_critic: 300,
  report_writer: 360,
};

const ALLOWED_TRANSITIONS: Record<InvestmentCommitteeState["phase"], readonly InvestmentCommitteeState["phase"][]> = {
  idle: ["observing"],
  observing: ["tracing", "blocked"],
  tracing: ["proposing", "blocked"],
  proposing: ["challenging", "awaiting_approval", "blocked"],
  challenging: ["awaiting_approval", "blocked"],
  awaiting_approval: ["executing", "complete", "blocked"],
  executing: ["complete", "blocked"],
  blocked: [],
  complete: [],
};

/**
 * Code-owned, linear committee runner. It is intentionally boring: explicit
 * stage order, no autonomous loop, no agent-to-agent calls, fixed timestamps,
 * and one human gate before paper-ledger mutation.
 */
export class AnalysisOrchestrator {
  constructor(private readonly options: AnalysisOrchestratorOptions) {}

  async run(input: AnalysisRunInput): Promise<InvestmentCommitteeState> {
    const state = InvestmentCommitteeStateSchema.parse(structuredClone(input.state));
    const researchRunner = withEvidenceLedger(this.options.runner, state);
    if (state.phase !== "idle") {
      throw new Error(`AnalysisOrchestrator.run requires idle phase, got "${state.phase}".`);
    }

    const selectedInstruments = input.selectedInstrumentIds.map((id) => {
      const instrument = state.candidateUniverse.find((candidate) => candidate.id === id);
      if (!instrument) throw new Error(`Selected instrument "${id}" is not in candidate universe.`);
      return instrument;
    });
    if (selectedInstruments.length === 0) throw new Error("At least one instrument must be selected.");
    if (new Set(input.selectedInstrumentIds).size !== input.selectedInstrumentIds.length) {
      throw new Error("Selected instruments must be unique.");
    }

    state.stages = pendingStages(state.run.id);
    let activeStage: AgentStage | undefined;

    const executeStage = async <T>(
      stage: AgentStage,
      fn: () => Promise<T>,
      outputId: (output: T) => string | null,
    ): Promise<T> => {
      activeStage = stage;
      markStageRunning(state, stage, stageTime(state, stage));
      try {
        const output = await fn();
        markStageComplete(state, stage, stageTime(state, stage, 30), outputId(output));
        activeStage = undefined;
        return output;
      } catch (error) {
        throw new Error(`${stage} failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    };

    try {
      transition(state, "observing", "Committee run started.");
      transition(state, "tracing", "Research stages received isolated evidence packs.");

      // Serial by design. Stable stage order makes replay independent of promise
      // scheduling while keeping both contexts isolated.
      const fundamentalReports: FundamentalReport[] = [];
      for (const instrument of selectedInstruments) {
        const report = await executeStage(
          "fundamental_analyst",
          () => runFinalizedAgent(
            fundamentalAnalyst,
            buildFundamentalContext(state, instrument),
            researchRunner,
          ),
          (output) => output.id,
        );
        fundamentalReports.push(report);
      }
      state.fundamentalReports = fundamentalReports;

      const marketContext = await executeStage(
        "market_context",
        () => runFinalizedAgent(
          marketContextAnalyst,
          buildMarketContext(state, selectedInstruments),
          researchRunner,
        ),
        (output) => output.id,
      );
      state.marketContext = marketContext;

      const researchGate = checkEvidenceGate(state);
      if (!researchGate.ok) {
        return block(
          state,
          `Evidence gate failed: ${[...researchGate.danglingEvidenceIds, ...researchGate.danglingActionIds].join(", ")}.`,
        );
      }

      transition(state, "proposing", "Research complete; Portfolio Manager is forming a proposal.");
      const proposal = await executeStage(
        "portfolio_manager",
        () => runFinalizedAgent(
          portfolioManager,
          buildPortfolioManagerContext(state, selectedInstruments, fundamentalReports, marketContext, { mode: "proposal" }),
          researchRunner,
        ),
        (output) => output.id,
      );
      if (proposal.revision !== 0) throw new Error("Initial Portfolio Manager output must have revision 0.");
      state.proposal = proposal;
      state.proposedActions = proposal.actions;

      const proposalGate = checkEvidenceGate(state);
      if (!proposalGate.ok) {
        return block(
          state,
          `Evidence gate failed: ${[...proposalGate.danglingEvidenceIds, ...proposalGate.danglingActionIds].join(", ")}.`,
        );
      }

      const proposalRisk = await executeStage(
        "risk_officer",
        async () => runRiskOfficer({
          portfolio: state.portfolioSnapshot,
          mandate: state.mandate,
          actions: proposal.actions,
          instruments: state.candidateUniverse,
          ...(this.options.instrumentStats ? { instrumentStats: this.options.instrumentStats } : {}),
          ...(this.options.stressScenarios ? { stressScenarios: this.options.stressScenarios } : {}),
          reportId: `rrp_${state.run.id}`,
        }),
        (output) => output.id,
      );
      state.riskReport = proposalRisk;
      state.riskChecks = proposalRisk.checks;

      const riskGate = checkRiskGate(proposalRisk);
      if (!riskGate.ok) return block(state, riskGate.reason!);

      transition(state, "challenging", "Proposal passed deterministic checks; Bear/Critic is challenging it.");
      const bearCase = await executeStage(
        "bear_critic",
        () => runFinalizedAgent(
          bearCritic,
          buildBearCriticContext(proposal, fundamentalReports, marketContext, proposalRisk, state.evidence),
          researchRunner,
        ),
        (output) => output.id,
      );
      if (bearCase.targetRecommendationId !== proposal.id) {
        throw new Error("Bear/Critic output targets a different recommendation.");
      }
      state.bearCase = bearCase;

      const revision = await executeStage(
        "portfolio_manager",
        () => runFinalizedAgent(
          portfolioManager,
          buildPortfolioManagerContext(state, selectedInstruments, fundamentalReports, marketContext, {
            mode: "revision",
            proposal,
            riskReport: proposalRisk,
            bearCase,
          }),
          researchRunner,
        ),
        (output) => output.id,
      );
      if (revision.revision !== 1) throw new Error("Post-critique Portfolio Manager output must have revision 1.");

      const revisionGate = checkEvidenceGate({ ...state, finalRecommendation: revision, proposedActions: revision.actions });
      if (!revisionGate.ok) {
        return block(
          state,
          `Evidence gate failed: ${[...revisionGate.danglingEvidenceIds, ...revisionGate.danglingActionIds].join(", ")}.`,
        );
      }

      // Re-check revised actions with deterministic code. A model cannot use a
      // revision to bypass a limit that the first risk pass enforced.
      const finalRisk = runRiskOfficer({
        portfolio: state.portfolioSnapshot,
        mandate: state.mandate,
        actions: revision.actions,
        instruments: state.candidateUniverse,
        ...(this.options.instrumentStats ? { instrumentStats: this.options.instrumentStats } : {}),
        ...(this.options.stressScenarios ? { stressScenarios: this.options.stressScenarios } : {}),
        reportId: `rrp_${state.run.id}`,
      });
      if (finalRisk.hardBlocks.length > 0) return block(state, checkRiskGate(finalRisk).reason!);

      state.finalRecommendation = revision;
      state.proposedActions = revision.actions;
      // Preserve the first risk report when revision is the deterministic,
      // risk-adjusted allocation. Otherwise expose final verification output.
      state.riskReport = sameComparison(proposalRisk, finalRisk) ? proposalRisk : finalRisk;
      state.riskChecks = state.riskReport.checks;
      transition(state, "awaiting_approval", "Recommendation is ready for explicit human approval.");

      return input.userDecision ? this.approve(state, input.userDecision) : validateState(state);
    } catch (error) {
      if (activeStage) markStageFailed(state, activeStage, stageTime(state, activeStage, 30), errorMessage(error));
      return block(state, errorMessage(error));
    }
  }

  async approve(
    stateInput: InvestmentCommitteeState,
    decisionInput: UserDecision,
  ): Promise<InvestmentCommitteeState> {
    const state = InvestmentCommitteeStateSchema.parse(structuredClone(stateInput));
    const decision = UserDecisionSchema.parse(decisionInput);
    const gate = checkHumanApprovalGate(state, decision);
    if (!gate.ok) throw new Error(gate.reason!);

    state.userDecision = decision;
    const appliedAt = isoAfter(decision.decidedAt, 2);
    const execution = decision.decision === "approved"
      ? this.applyApprovedActions(state, appliedAt)
      : { orders: [], portfolio: state.portfolioSnapshot };

    // Writer runs after decision and before ledger state is committed. It can
    // describe the outcome but has no authority to change actions.
    markStageRunning(state, "report_writer", isoAfter(decision.decidedAt, 1));
    try {
      const writerState = {
        ...state,
        portfolioAfter: execution.portfolio,
        appliedOrders: execution.orders,
      };
      const report = await runFinalizedAgent(reportWriter, buildReportWriterContext(writerState), this.options.runner);
      state.portfolioAfter = execution.portfolio;
      state.appliedOrders = execution.orders;
      state.report = report;
      markStageComplete(state, "report_writer", isoAfter(decision.decidedAt, 2), report.id);
    } catch (error) {
      markStageFailed(state, "report_writer", isoAfter(decision.decidedAt, 2), errorMessage(error));
      return block(state, `report_writer failed: ${errorMessage(error)}`);
    }

    if (decision.decision === "approved") {
      transition(state, "executing", "Human approved; applying deterministic paper-ledger actions.");
      appendActivity(state, {
        kind: "paper_trade",
        message: `Applied ${state.appliedOrders.length} paper orders after approval.`,
        refId: `rcpt_${state.run.id}`,
      });
    }
    const completedAt = isoAfter(decision.decidedAt, 3);
    state.run = { ...state.run, completedAt };
    const receiptId = `rcpt_${state.run.id}`;
    state.receipt = {
      id: receiptId,
      runId: state.run.id,
      createdAt: completedAt,
      event: state.materialEvents[0] ?? null,
      portfolioBefore: state.portfolioSnapshot,
      portfolioAfter: execution.portfolio,
      proposal: state.proposal,
      recommendation: state.finalRecommendation!,
      riskReport: state.riskReport!,
      bearCase: state.bearCase,
      userDecision: state.userDecision,
      appliedOrders: state.appliedOrders,
      report: state.report,
      evidence: state.evidence,
    };
    transition(state, "complete", decision.decision === "approved" ? "Decision receipt completed." : "Decision rejected; no paper actions applied.");
    return validateState(state);
  }

  private applyApprovedActions(state: InvestmentCommitteeState, appliedAt: string) {
    if (!state.finalRecommendation || !state.marketSnapshot) {
      throw new Error("Approved action requires final recommendation and market snapshot.");
    }
    if (state.riskReport?.hardBlocks.length) {
      throw new Error("Approved action cannot bypass deterministic risk hard block.");
    }
    return applyPaperActions({
      portfolio: state.portfolioSnapshot,
      actions: state.finalRecommendation.actions,
      marketSnapshot: state.marketSnapshot,
      appliedAt,
    });
  }
}

async function runAgent<TContext, TOutput>(
  definition: AgentDef<TContext, TOutput>,
  context: TContext,
  runner: AgentRunner,
): Promise<TOutput> {
  const result = await runner.run(definition, context);
  const parsed = definition.outputSchema.safeParse(result.output);
  if (!parsed.success) {
    throw new Error(`${definition.stage} output failed schema validation.`);
  }
  return parsed.data;
}

async function runFinalizedAgent<TContext, TDraft, TOutput>(
  agent: Agent<TContext, TDraft, TOutput>,
  context: TContext,
  runner: AgentRunner,
): Promise<TOutput> {
  const draft = await runAgent(agent.def, context, runner);
  return agent.finalize(draft, context);
}

function pendingStages(runId: string): StageRecord[] {
  return AGENT_STAGES.map((stage) => ({
    runId,
    stage,
    status: "pending",
    startedAt: null,
    completedAt: null,
    outputId: null,
  }));
}

function markStageRunning(state: InvestmentCommitteeState, stage: AgentStage, startedAt: string): void {
  const record = stageRecord(state, stage);
  record.status = "running";
  record.startedAt = startedAt;
  record.completedAt = null;
  record.outputId = null;
}

function markStageComplete(state: InvestmentCommitteeState, stage: AgentStage, completedAt: string, outputId: string | null): void {
  const record = stageRecord(state, stage);
  record.status = "complete";
  record.completedAt = completedAt;
  record.outputId = outputId;
}

function markStageFailed(state: InvestmentCommitteeState, stage: AgentStage, completedAt: string, note: string): void {
  const record = stageRecord(state, stage);
  record.status = "failed";
  record.completedAt = completedAt;
  record.note = note;
}

function stageRecord(state: InvestmentCommitteeState, stage: AgentStage): StageRecord {
  const record = state.stages.find((candidate) => candidate.stage === stage);
  if (!record) throw new Error(`Missing stage record for "${stage}".`);
  return record;
}

function stageTime(state: InvestmentCommitteeState, stage: AgentStage, extraSeconds = 0): string {
  return isoAfter(state.run.startedAt, STAGE_OFFSETS[stage] + extraSeconds);
}

function transition(state: InvestmentCommitteeState, next: InvestmentCommitteeState["phase"], message: string): void {
  if (state.phase !== next && !ALLOWED_TRANSITIONS[state.phase].includes(next)) {
    throw new Error(`Invalid phase transition "${state.phase}" -> "${next}".`);
  }
  state.phase = next;
  appendActivity(state, { kind: "phase_changed", message });
}

function appendActivity(state: InvestmentCommitteeState, input: Omit<ActivityEvent, "id" | "at" | "evidenceIds"> & { evidenceIds?: string[] }): void {
  state.activities.push({
    id: `act_${state.activities.length + 1}`,
    at: state.run.startedAt,
    evidenceIds: input.evidenceIds ?? [],
    ...input,
  });
}

function block(state: InvestmentCommitteeState, reason: string): InvestmentCommitteeState {
  for (const record of state.stages) {
    if (record.status === "pending" || record.status === "running") {
      record.status = "skipped";
      record.note = reason;
    }
  }
  if (state.phase !== "blocked") transition(state, "blocked", reason);
  return validateState(state);
}

function validateState(state: InvestmentCommitteeState): InvestmentCommitteeState {
  return InvestmentCommitteeStateSchema.parse(state);
}

function sameComparison(a: RiskReport, b: RiskReport): boolean {
  return JSON.stringify(a.comparison) === JSON.stringify(b.comparison);
}

function isoAfter(value: string, seconds: number): string {
  return new Date(Date.parse(value) + seconds * 1000).toISOString();
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function withEvidenceLedger(
  runner: AgentRunner,
  state: InvestmentCommitteeState,
): AgentRunner {
  return {
    async run<TContext, TOutput>(
      definition: AgentDef<TContext, TOutput>,
      context: TContext,
    ) {
      const result = await runner.run(definition, context);
      mergeEvidence(state.evidence, result.evidence ?? []);
      if (result.graph) mergeGraph(state.graph, result.graph);
      return result;
    },
  };
}

function mergeGraph(
  target: InvestmentCommitteeState["graph"],
  additions: InvestmentCommitteeState["graph"],
): void {
  const nodes = new Map(target.nodes.map((item) => [item.id, item]));
  const edges = new Map(target.edges.map((item) => [item.id, item]));
  for (const item of additions.nodes) mergeGraphRecord(nodes, item);
  for (const item of additions.edges) mergeGraphRecord(edges, item);
  target.nodes = [...nodes.values()];
  target.edges = [...edges.values()];
}

function mergeGraphRecord<T extends { id: string }>(target: Map<string, T>, item: T): void {
  const existing = target.get(item.id);
  if (existing && JSON.stringify(existing) !== JSON.stringify(item)) {
    throw new Error(`Conflicting graph record "${item.id}".`);
  }
  target.set(item.id, item);
}

function mergeEvidence(target: Evidence[], additions: readonly Evidence[]): void {
  const byId = new Map(target.map((item) => [item.id, item]));
  for (const item of additions) {
    const existing = byId.get(item.id);
    if (existing && JSON.stringify(existing) !== JSON.stringify(item)) {
      throw new Error(`Conflicting evidence record "${item.id}".`);
    }
    if (!existing) {
      target.push(item);
      byId.set(item.id, item);
    }
  }
}
