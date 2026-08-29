import type OpenAI from "openai";
import { zodResponsesFunction, zodTextFormat } from "openai/helpers/zod";
import type {
  ResponseInput,
  ResponseInputItem,
} from "openai/resources/responses/responses";
import {
  EvidenceSchema,
  RelationshipGraphSchema,
  type Evidence,
  type GraphEdge,
  type GraphNode,
} from "@sonar-ai/core";
import type { ZodType } from "zod";
import type { AgentRunResult } from "../analysis/runner/types";
import type { ToolContext, ToolName, ToolRegistry } from "../tools/types";
import { requireTool } from "../tools/types";

export interface StructuredOutputRequest<TOutput> {
  model: string;
  instructions: string;
  input: string;
  schema: ZodType<TOutput>;
  schemaName: string;
  maxOutputTokens: number;
  toolNames?: readonly ToolName[];
  toolRegistry?: ToolRegistry;
  toolContext?: ToolContext;
  maxToolCalls?: number;
  maxToolOutputChars?: number;
}

/** One bounded Responses API call. Retry policy belongs to the runner. */
export async function requestStructuredOutput<TOutput>(
  client: OpenAI,
  request: StructuredOutputRequest<TOutput>,
): Promise<AgentRunResult<TOutput>> {
  const toolNames = request.toolNames ?? [];
  const registry = request.toolRegistry ?? {};
  const tools = toolNames.map((name) => requireTool(registry, name));
  const modelTools = tools.map((tool) =>
    zodResponsesFunction({
      name: tool.name,
      description: tool.description,
      parameters: tool.inputSchema,
    }),
  );
  const maxToolCalls = request.maxToolCalls ?? 8;
  if (!Number.isInteger(maxToolCalls) || maxToolCalls < 0) {
    throw new Error("maxToolCalls must be a non-negative integer.");
  }
  let totalToolCalls = 0;
  let input: string | ResponseInput = request.input;
  let inputTokens = 0;
  let outputTokens = 0;
  let remainingOutputTokens = request.maxOutputTokens;
  const maxToolOutputChars = request.maxToolOutputChars ?? 60_000;
  if (!Number.isInteger(maxToolOutputChars) || maxToolOutputChars < 1) {
    throw new Error("maxToolOutputChars must be a positive integer.");
  }
  const evidence = new Map<string, Evidence>();
  const graphNodes = new Map<string, GraphNode>();
  const graphEdges = new Map<string, GraphEdge>();

  while (true) {
    const response = await client.responses.parse({
      model: request.model,
      instructions: request.instructions,
      input,
      max_output_tokens: remainingOutputTokens,
      store: false,
      text: {
        format: zodTextFormat(request.schema, request.schemaName),
      },
      ...(modelTools.length
        ? { tools: modelTools, parallel_tool_calls: false }
        : {}),
    });
    inputTokens += response.usage?.input_tokens ?? 0;
    outputTokens += response.usage?.output_tokens ?? 0;
    remainingOutputTokens -= response.usage?.output_tokens ?? 0;

    const responseItems = response.output ?? [];
    const calls = responseItems.filter((item) => item.type === "function_call");
    if (calls.length === 0) {
      if (response.output_parsed === null) {
        throw new Error("OpenAI response contained no parsed structured output.");
      }
      const output = request.schema.parse(response.output_parsed);
      return {
        output,
        ...(inputTokens || outputTokens
          ? { usage: { inputTokens, outputTokens } }
          : {}),
        ...(evidence.size ? { evidence: [...evidence.values()] } : {}),
        ...(graphNodes.size || graphEdges.size
          ? { graph: { nodes: [...graphNodes.values()], edges: [...graphEdges.values()] } }
          : {}),
      };
    }

    totalToolCalls += calls.length;
    if (totalToolCalls > maxToolCalls) {
      throw new Error(`OpenAI response exceeded ${maxToolCalls} tool calls.`);
    }
    if (remainingOutputTokens <= 0) {
      throw new Error("OpenAI response exhausted the stage output-token budget.");
    }
    if (typeof input === "string") {
      input = [{ role: "user", content: input }];
    }
    // Echo the model's own items back as the next turn's input. `responses.parse`
    // decorates function_call items with a `parsed_arguments` field that is NOT a
    // valid input parameter, so re-emit only the fields the API accepts or it
    // rejects the follow-up request.
    for (const item of responseItems) {
      if (item.type === "function_call") {
        input.push({
          type: "function_call",
          call_id: item.call_id,
          name: item.name,
          arguments: item.arguments,
        });
      } else {
        input.push(item as ResponseInputItem);
      }
    }

    for (const call of calls) {
      if (!toolNames.includes(call.name as ToolName)) {
        throw new Error(`OpenAI requested unavailable tool "${call.name}".`);
      }
      const tool = requireTool(registry, call.name as ToolName);
      const args = tool.inputSchema.parse(JSON.parse(call.arguments));
      const rawOutput = await tool.execute(args, request.toolContext ?? { offline: true });
      const parsedOutput = tool.outputSchema.parse(rawOutput);
      // Evidence/graph are harvested from the FULL parsed output first, so
      // truncating the model-facing text below never drops a citation.
      collectEvidence(parsedOutput, evidence);
      collectGraph(parsedOutput, graphNodes, graphEdges);
      const full = JSON.stringify(parsedOutput);
      // A rich Cala entity profile can be very large. Truncate rather than fail
      // the stage — the model still gets most of the data plus a clear marker.
      const serializedOutput =
        full.length > maxToolOutputChars
          ? `${full.slice(0, maxToolOutputChars)}…[truncated ${full.length - maxToolOutputChars} chars]`
          : full;
      input.push({
        type: "function_call_output",
        call_id: call.call_id,
        output: serializedOutput,
      });
    }
  }
}

function collectGraph(
  value: unknown,
  nodes: Map<string, GraphNode>,
  edges: Map<string, GraphEdge>,
): void {
  if (!value || typeof value !== "object" || !("data" in value)) return;
  const data = (value as { data?: unknown }).data;
  if (!data || typeof data !== "object" || !("normalizedGraph" in data)) return;
  const parsed = RelationshipGraphSchema.safeParse(
    (data as { normalizedGraph?: unknown }).normalizedGraph,
  );
  if (!parsed.success) return;
  for (const node of parsed.data.nodes) mergeGraphItem(nodes, node);
  for (const edge of parsed.data.edges) mergeGraphItem(edges, edge);
}

function mergeGraphItem<T extends { id: string }>(target: Map<string, T>, item: T): void {
  const existing = target.get(item.id);
  if (existing && JSON.stringify(existing) !== JSON.stringify(item)) {
    throw new Error(`Conflicting graph artifact "${item.id}".`);
  }
  target.set(item.id, item);
}

function collectEvidence(value: unknown, target: Map<string, Evidence>): void {
  if (!value || typeof value !== "object" || !("evidence" in value)) return;
  const parsed = EvidenceSchema.array().safeParse(
    (value as { evidence?: unknown }).evidence,
  );
  if (!parsed.success) return;
  for (const item of parsed.data) target.set(item.id, item);
}
