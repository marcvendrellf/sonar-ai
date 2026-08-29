import type OpenAI from "openai";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import type { AgentDef } from "./types";
import { OpenAIAgentRunner } from "./openai-runner";
import { z as zod } from "zod";

const OutputSchema = z.object({ verdict: z.enum(["pass", "fail"]) });
type Output = z.infer<typeof OutputSchema>;

const def: AgentDef<{ evidenceId: string }, Output> = {
  stage: "fundamental_analyst",
  instructions: "Use only supplied evidence.",
  outputSchema: OutputSchema,
  buildInput: (context) => JSON.stringify(context),
};

function response(output: Output) {
  return {
    output_parsed: output,
    usage: { input_tokens: 12, output_tokens: 4 },
  };
}

function clientWith(parse: ReturnType<typeof vi.fn>): OpenAI {
  return { responses: { parse } } as unknown as OpenAI;
}

describe("OpenAIAgentRunner", () => {
  it("makes one bounded structured-output request", async () => {
    const parse = vi.fn().mockResolvedValue(response({ verdict: "pass" }));
    const runner = new OpenAIAgentRunner({
      client: clientWith(parse),
      model: "test-model",
      maxOutputTokens: 256,
      maxRetries: 1,
    });

    await expect(runner.run(def, { evidenceId: "ev-1" })).resolves.toEqual({
      output: { verdict: "pass" },
      usage: { inputTokens: 12, outputTokens: 4 },
    });

    expect(parse).toHaveBeenCalledTimes(1);
    expect(parse).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "test-model",
        instructions: def.instructions,
        input: '{"evidenceId":"ev-1"}',
        max_output_tokens: 256,
        store: false,
        text: { format: expect.objectContaining({ type: "json_schema" }) },
      }),
    );
  });

  it("uses exactly the configured retry budget", async () => {
    const parse = vi
      .fn()
      .mockRejectedValueOnce(new Error("temporary"))
      .mockResolvedValueOnce(response({ verdict: "pass" }));
    const runner = new OpenAIAgentRunner({
      client: clientWith(parse),
      model: "test-model",
      maxOutputTokens: 256,
      maxRetries: 1,
    });

    await expect(runner.run(def, { evidenceId: "ev-1" })).resolves.toMatchObject({
      output: { verdict: "pass" },
    });
    expect(parse).toHaveBeenCalledTimes(2);
  });

  it("returns a stage-scoped error without leaking input or provider errors", async () => {
    const parse = vi.fn().mockRejectedValue(new Error("secret provider detail"));
    const runner = new OpenAIAgentRunner({
      client: clientWith(parse),
      model: "test-model",
      maxOutputTokens: 256,
      maxRetries: 1,
    });

    await expect(runner.run(def, { evidenceId: "private-input" })).rejects.toThrow(
      'OpenAIAgentRunner: stage "fundamental_analyst" failed after 2 attempt(s).',
    );
    expect(parse).toHaveBeenCalledTimes(2);
  });

  it("rejects invalid retry configuration", () => {
    expect(
      () =>
        new OpenAIAgentRunner({
          client: clientWith(vi.fn()),
          model: "test-model",
          maxOutputTokens: 256,
          maxRetries: -1,
        }),
    ).toThrow("maxRetries must be a non-negative integer");
  });

  it("executes only allowlisted tools and returns discovered evidence", async () => {
    const evidence = {
      id: "ev_cala_test",
      kind: "cala" as const,
      title: "Cala query",
      sourceName: "Cala fixture",
      sourceUrl: "https://docs.cala.ai/",
      observedAt: "2026-08-29T00:00:00Z",
      label: "synthetic" as const,
      snippet: "Synthetic result.",
    };
    const parse = vi
      .fn()
      .mockResolvedValueOnce({
        output_parsed: null,
        output: [
          {
            type: "function_call",
            name: "query_financial_knowledge",
            arguments: JSON.stringify({ query: "NovaChip revenue" }),
            call_id: "call_1",
            parsed_arguments: { query: "NovaChip revenue" },
          },
        ],
        usage: { input_tokens: 10, output_tokens: 3 },
      })
      .mockResolvedValueOnce({
        output_parsed: { verdict: "pass" },
        output: [],
        usage: { input_tokens: 8, output_tokens: 4 },
      });
    const execute = vi.fn().mockResolvedValue({ data: { rows: [] }, evidence: [evidence] });
    const toolDef = { ...def, toolNames: ["query_financial_knowledge"] as const };
    const runner = new OpenAIAgentRunner({
      client: clientWith(parse),
      model: "test-model",
      maxOutputTokens: 256,
      maxRetries: 0,
      maxToolCalls: 2,
      toolRegistry: {
        query_financial_knowledge: {
          name: "query_financial_knowledge",
          description: "Query fixture.",
          inputSchema: zod.object({ query: zod.string() }),
          outputSchema: zod.object({
            data: zod.object({ rows: zod.array(zod.unknown()) }),
            evidence: zod.array(zod.object({
              id: zod.string(), kind: zod.literal("cala"), title: zod.string(),
              sourceName: zod.string(), sourceUrl: zod.url(), observedAt: zod.string(),
              label: zod.literal("synthetic"), snippet: zod.string(),
            })),
          }),
          execute,
        },
      },
      toolContext: { offline: true },
    });

    await expect(runner.run(toolDef, { evidenceId: "ev-1" })).resolves.toEqual({
      output: { verdict: "pass" },
      usage: { inputTokens: 18, outputTokens: 7 },
      evidence: [evidence],
    });
    expect(execute).toHaveBeenCalledWith(
      { query: "NovaChip revenue" },
      { offline: true },
    );
    expect(parse.mock.calls[1]?.[0].input).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "function_call_output", call_id: "call_1" }),
      ]),
    );
  });
});
