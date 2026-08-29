import type OpenAI from "openai";
import { getServerEnv, type ServerEnv } from "../../env";
import { createOpenAIClient } from "../../llm/openai-client";
import { requestStructuredOutput } from "../../llm/structured-output";
import type { AgentDef, AgentRunner, AgentRunResult } from "./types";

export interface OpenAIAgentRunnerOptions {
  client: OpenAI;
  model: string;
  maxOutputTokens: number;
  maxRetries: number;
}

/**
 * Structured-output runner for the code-owned committee orchestrator.
 *
 * It performs one model request per attempt and never chooses stages, tools,
 * or control flow. All orchestration and gates remain deterministic code.
 */
export class OpenAIAgentRunner implements AgentRunner {
  constructor(private readonly options: OpenAIAgentRunnerOptions) {
    if (!Number.isInteger(options.maxRetries) || options.maxRetries < 0) {
      throw new Error("OpenAIAgentRunner maxRetries must be a non-negative integer.");
    }
  }

  async run<TContext, TOutput>(
    def: AgentDef<TContext, TOutput>,
    context: TContext,
  ): Promise<AgentRunResult<TOutput>> {
    const input = def.buildInput(context);
    const maxAttempts = this.options.maxRetries + 1;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        return await requestStructuredOutput(this.options.client, {
          model: this.options.model,
          instructions: def.instructions,
          input,
          schema: def.outputSchema,
          schemaName: `sonar_${def.stage}`,
          maxOutputTokens: this.options.maxOutputTokens,
        });
      } catch {
        if (attempt === maxAttempts) {
          throw new Error(
            `OpenAIAgentRunner: stage "${def.stage}" failed after ${maxAttempts} attempt(s).`,
          );
        }
      }
    }

    throw new Error(`OpenAIAgentRunner: unreachable stage "${def.stage}" state.`);
  }
}

/** Construct the live runner from validated server environment. */
export function createOpenAIAgentRunner(
  env: ServerEnv = getServerEnv(),
): OpenAIAgentRunner {
  return new OpenAIAgentRunner({
    client: createOpenAIClient(env),
    model: env.SONAR_AGENT_MODEL,
    maxOutputTokens: env.SONAR_AGENT_MAX_TOKENS,
    maxRetries: env.SONAR_AGENT_MAX_RETRIES,
  });
}
