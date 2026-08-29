import {
  AgentStageSchema,
  InvestmentCommitteeStateSchema,
  UserDecisionSchema,
  type AgentStage,
  type InvestmentCommitteeState,
} from "@sonar-ai/core";
import { z } from "zod";
import type { AgentDef, AgentRunner, AgentRunResult } from "../analysis/runner/types";

/**
 * Recording & replay for demo runs.
 *
 * A real committee run makes several GPT-5 calls and can take longer than the
 * two-minute demo window, so we record a run once (ahead of time) and replay it
 * during the demo. A recording captures BOTH what each agent did (its output)
 * and the conversation behind it (the exact instructions + prompt sent, plus
 * token usage and timing). Replaying feeds the recorded outputs back through the
 * StubAgentRunner, so the orchestrator reproduces the exact same state offline.
 */

/** One agent call: the conversation and its result. */
export const AgentTurnSchema = z.object({
  stage: AgentStageSchema,
  /** 0-based call index within a stage (the Portfolio Manager runs twice). */
  callIndex: z.number().int().nonnegative(),
  /** The system/instruction prompt the agent was given. */
  instructions: z.string(),
  /** The exact user prompt built from the isolated context. */
  input: z.string(),
  /** The model's structured output (the draft, before finalize). */
  output: z.unknown(),
  usage: z
    .object({ inputTokens: z.number(), outputTokens: z.number() })
    .optional(),
  startedAt: z.string(),
  completedAt: z.string(),
});
export type AgentTurn = z.infer<typeof AgentTurnSchema>;

// Deterministic analytics config lives in the recording so a replay reproduces
// the exact same risk metrics and stress numbers with no external config.
const InstrumentStatsSchema = z.record(
  z.string(),
  z.object({ volatility: z.number(), beta: z.number() }),
);
const StressScenarioSchema = z.object({
  name: z.string(),
  shockByInstrument: z.record(z.string(), z.number()).optional(),
  marketShock: z.number().optional(),
});

/** A complete recorded run: the conversation transcript plus the final state. */
export const RunRecordingSchema = z.object({
  runId: z.string().min(1),
  recordedAt: z.string(),
  /** The model that produced it, or "stub" for a fixture-driven recording. */
  model: z.string().min(1),
  scenarioId: z.string().min(1),
  userDecision: UserDecisionSchema.nullable(),
  /** Demo analytics config, stored so replay is fully self-contained. */
  instrumentStats: InstrumentStatsSchema.optional(),
  stressScenarios: z.array(StressScenarioSchema).optional(),
  turns: z.array(AgentTurnSchema),
  state: InvestmentCommitteeStateSchema,
});
export type RunRecording = z.infer<typeof RunRecordingSchema>;

/**
 * Wraps any {@link AgentRunner} and records every call without changing its
 * behavior. Use it around the OpenAIAgentRunner to capture a real run, or around
 * the StubAgentRunner to test the recorder offline.
 */
export class RecordingAgentRunner implements AgentRunner {
  readonly turns: AgentTurn[] = [];
  private readonly counts = new Map<AgentStage, number>();

  constructor(
    private readonly delegate: AgentRunner,
    private readonly clock: () => string = () => new Date().toISOString(),
  ) {}

  async run<TContext, TOutput>(
    def: AgentDef<TContext, TOutput>,
    context: TContext,
  ): Promise<AgentRunResult<TOutput>> {
    const startedAt = this.clock();
    const result = await this.delegate.run(def, context);
    const completedAt = this.clock();

    const callIndex = this.counts.get(def.stage) ?? 0;
    this.counts.set(def.stage, callIndex + 1);

    this.turns.push({
      stage: def.stage,
      callIndex,
      instructions: def.instructions,
      input: def.buildInput(context), // pure; recomputes the exact prompt sent
      output: result.output,
      ...(result.usage ? { usage: result.usage } : {}),
      startedAt,
      completedAt,
    });

    return result;
  }
}

/**
 * Turn a recording's per-stage outputs into the shape `StubAgentRunner` accepts,
 * preserving call order so the Portfolio Manager's proposal then revision replay
 * correctly.
 */
export function recordingToStubOutputs(
  recording: RunRecording,
): Partial<Record<AgentStage, unknown[]>> {
  const byStage = new Map<AgentStage, AgentTurn[]>();
  for (const turn of recording.turns) {
    const list = byStage.get(turn.stage) ?? [];
    list.push(turn);
    byStage.set(turn.stage, list);
  }

  const outputs: Partial<Record<AgentStage, unknown[]>> = {};
  for (const [stage, turns] of byStage) {
    outputs[stage] = turns
      .slice()
      .sort((a, b) => a.callIndex - b.callIndex)
      .map((turn) => turn.output);
  }
  return outputs;
}

/**
 * Reset a finished committee state back to an idle input state — keeping the
 * inputs (mandate, universe, portfolio, events, market snapshot, evidence,
 * graph) and clearing every stage output. Used to re-drive the orchestrator
 * from a recording during replay.
 */
export function resetToIdle(
  state: InvestmentCommitteeState,
): InvestmentCommitteeState {
  const clone = structuredClone(state);
  clone.phase = "idle";
  clone.run = { ...clone.run, completedAt: null };
  clone.stages = [];
  clone.fundamentalReports = [];
  clone.marketContext = null;
  clone.riskReport = null;
  clone.proposal = null;
  clone.finalRecommendation = null;
  clone.bearCase = null;
  clone.proposedActions = [];
  clone.riskChecks = [];
  clone.userDecision = null;
  clone.appliedOrders = [];
  clone.portfolioAfter = null;
  clone.report = null;
  clone.activities = [];
  clone.receipt = null;
  return clone;
}
