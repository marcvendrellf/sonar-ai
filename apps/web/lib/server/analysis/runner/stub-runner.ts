import type { AgentStage } from "@sonar-ai/core";
import type { AgentDef, AgentRunner, AgentRunResult } from "./types";

/**
 * Deterministic runner for Phase 3. Returns a canned output per stage (drawn
 * from a fixture) instead of calling a model, so the whole orchestrator —
 * phase transitions, the evidence gate, the risk hard-block, the approval gate,
 * the receipt — can be proven end-to-end with zero LLM flakiness and zero
 * network. Swapped for `OpenAIAgentRunner` in Phase 5 without touching the
 * orchestrator.
 *
 * Every returned output is still validated against `def.outputSchema`, so the
 * stub cannot silently drift from the contract.
 */
export class StubAgentRunner implements AgentRunner {
  constructor(private readonly outputs: Partial<Record<AgentStage, unknown>>) {}

  async run<TContext, TOutput>(
    def: AgentDef<TContext, TOutput>,
    _context: TContext,
  ): Promise<AgentRunResult<TOutput>> {
    const canned = this.outputs[def.stage];
    if (canned === undefined) {
      throw new Error(`StubAgentRunner: no canned output for stage "${def.stage}".`);
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
