import type { ZodType } from "zod";

/**
 * The CLOSED set of capabilities an agent may reach. Nothing outside this list
 * is callable, no tool submits an order or touches a brokerage account, and no
 * agent calls another directly — the orchestrator is the only sequencer.
 */
export const TOOL_NAMES = [
  "get_portfolio_snapshot",
  "get_price_history",
  "get_company_fundamentals",
  "search_company_information", // -> Cala relationship tracing / fixture
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

/** The registry the orchestrator hands to agents — keyed by the closed name set. */
export type ToolRegistry = Partial<Record<ToolName, AnyTool>>;
