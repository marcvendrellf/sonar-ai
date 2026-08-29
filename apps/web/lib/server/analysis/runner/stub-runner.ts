import type { AgentStage } from "@sonar-ai/core";
import type { AgentDef, AgentRunner, AgentRunResult } from "./types";

/**
 * Deterministic runner for Phase 3. Returns a canned output per stage (drawn
 * from a fixture) instead of calling a model, so the whole orchestrator —
 * phase transitions, the evidence gate, the risk hard-block, the approval gate,
 * the receipt — can be proven end-to-end with zero LLM flakiness and zero
 * network. Swapped for `OpenAIAgentRunner` without touching the orchestrator.
 *
 * Every returned output is still validated against `def.outputSchema`, so the
 * stub cannot silently drift from the contract.
 */
export class StubAgentRunner implements AgentRunner {
  private readonly calls = new Map<AgentStage, number>();

  constructor(
    private readonly outputs: Partial<
      Record<AgentStage, unknown | readonly unknown[]>
    >,
  ) {}

  async run<TContext, TOutput>(
    def: AgentDef<TContext, TOutput>,
    context: TContext,
  ): Promise<AgentRunResult<TOutput>> {
    void context;
    const configured = this.outputs[def.stage];
    if (configured === undefined) {
      throw new Error(`StubAgentRunner: no canned output for stage "${def.stage}".`);
    }
    const call = this.calls.get(def.stage) ?? 0;
    this.calls.set(def.stage, call + 1);
    const canned = Array.isArray(configured) ? configured[call] : configured;
    if (canned === undefined) {
      throw new Error(`StubAgentRunner: no canned output for stage "${def.stage}" call ${call + 1}.`);
    }
    const parsed = def.outputSchema.safeParse(canned);
    if (!parsed.success) {
      throw new Error(
        `StubAgentRunner: canned output for "${def.stage}" fails its schema:\n${JSON.stringify(
          parsed.error.issues,
          null,
          2,
        )}`,
      );
    }
    return { output: parsed.data };
  }
}
