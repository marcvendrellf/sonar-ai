import type OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import type { ZodType } from "zod";
import type { AgentRunResult } from "../analysis/runner/types";

export interface StructuredOutputRequest<TOutput> {
  model: string;
  instructions: string;
  input: string;
  schema: ZodType<TOutput>;
  schemaName: string;
  maxOutputTokens: number;
}

/** One bounded Responses API call. Retry policy belongs to the runner. */
export async function requestStructuredOutput<TOutput>(
  client: OpenAI,
  request: StructuredOutputRequest<TOutput>,
): Promise<AgentRunResult<TOutput>> {
  const response = await client.responses.parse({
    model: request.model,
    instructions: request.instructions,
    input: request.input,
    max_output_tokens: request.maxOutputTokens,
    store: false,
    text: {
      format: zodTextFormat(request.schema, request.schemaName),
    },
  });

  if (response.output_parsed === null) {
    throw new Error("OpenAI response contained no parsed structured output.");
  }

  // Parse again at the application boundary. This keeps the AgentRunner
  // contract valid even if SDK parsing behavior changes.
  const output = request.schema.parse(response.output_parsed);

  return response.usage
    ? {
        output,
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
        },
      }
    : { output };
}
