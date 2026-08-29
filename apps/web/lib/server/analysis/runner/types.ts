import type { AgentStage } from "@sonar-ai/core";
import type { ZodType } from "zod";

/**
 * The seam between deterministic stubs and real OpenAI calls.
 *
 * Agents are DATA, runners are BEHAVIOR. Each agent is an {@link AgentDef}:
 * a stage id, instructions, an output schema, and a function that turns its
 * isolated context pack into a model input. A {@link AgentRunner} executes a
 * def. `StubAgentRunner` (Phase 3) returns canned fixture outputs;
 * `OpenAIAgentRunner` (Phase 5) calls the model — swapping one for the other is
 * the only change needed to go from an offline demo to live agents.
 */

/** One committee agent, defined by what it must produce — never an SDK call. */
export interface AgentDef<TContext, TOutput> {
  stage: AgentStage;
  /** System / instruction prompt for this agent. */
  instructions: string;
  /**
   * Zod schema the output must satisfy. Also the source of the OpenAI
   * structured-output JSON schema, so the model can never return a shape the
   * contract does not accept.
   */
  outputSchema: ZodType<TOutput>;
  /** Build the model input from the isolated context pack. */
  buildInput(context: TContext): string;
}

export interface AgentUsage {
  inputTokens: number;
  outputTokens: number;
}

export interface AgentRunResult<TOutput> {
  output: TOutput;
  usage?: AgentUsage;
}

/**
 * Executes an {@link AgentDef}. Implementations MUST validate the produced
 * output against `def.outputSchema` before returning, and MUST NOT leak
 * prompts, credentials, or hidden reasoning to their caller — only the typed
 * output crosses this boundary.
 */
export interface AgentRunner {
  run<TContext, TOutput>(
    def: AgentDef<TContext, TOutput>,
    context: TContext,
  ): Promise<AgentRunResult<TOutput>>;
}
