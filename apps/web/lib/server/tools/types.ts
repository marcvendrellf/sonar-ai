import type { ZodType } from "zod";

/**
 * The CLOSED set of capabilities an agent may reach. Nothing outside this list
 * is callable, no tool submits an order or touches a brokerage account, and no
 * agent calls another directly — the orchestrator is the only sequencer.
 */
export const TOOL_NAMES = [
  "get_portfolio_snapshot",
  "get_price_history",
  "get_latest_quotes",
  "list_tradable_assets",
  "get_company_fundamentals",
  "search_company_information",
  "query_financial_knowledge",
  "find_cala_entities",
  "inspect_cala_entity",
  "get_cala_entity_profile",
  "traverse_cala_relationships",
  "calculate_portfolio_metrics", // -> risk-engine
  "calculate_asset_exposure", // -> risk-engine
  "run_stress_test", // -> risk-engine
  "compare_portfolio_scenarios", // -> risk-engine
  "get_existing_thesis",
  "save_recommendation", // writes internal state only
] as const;

export type ToolName = (typeof TOOL_NAMES)[number];

/**
 * Services the orchestrator injects into every tool call. Adapters resolve to
 * Cala/Alpaca or a fixture depending on `offline`.
 */
export interface ToolContext {
  offline: boolean;
}

/** One typed, schema-validated capability. */
export interface Tool<TInput, TOutput> {
  name: ToolName;
  description: string;
  inputSchema: ZodType<TInput>;
  outputSchema: ZodType<TOutput>;
  execute(input: TInput, ctx: ToolContext): Promise<TOutput>;
}

export type AnyTool = Tool<unknown, unknown>;

/** Erase generic I/O types only after a tool has been checked at definition time. */
export function defineTool<TInput, TOutput>(
  tool: Tool<TInput, TOutput>,
): AnyTool {
  return tool as unknown as AnyTool;
}

/** The registry the orchestrator hands to agents — keyed by the closed name set. */
export type ToolRegistry = Partial<Record<ToolName, AnyTool>>;

export function requireTool(registry: ToolRegistry, name: ToolName): AnyTool {
  const tool = registry[name];
  if (!tool) throw new Error(`Tool "${name}" is not registered.`);
  return tool;
}
