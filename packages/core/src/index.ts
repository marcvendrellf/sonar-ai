/**
 * @sonar-ai/core — the cross-lane contract.
 *
 * Zod schemas + inferred types + stable-ID helpers for the whole Sonar AI
 * committee pipeline. Imports neither React nor Next, and touches no network.
 * Every UI, agent, and risk-engine boundary validates against these.
 */

export * from "./primitives";
export * from "./ids";
export * from "./phases";
export * from "./evidence";
export * from "./market-data";
export * from "./mandate";
export * from "./portfolio";
export * from "./events";
export * from "./agents";
export * from "./receipts";
export * from "./analysis";
export * from "./integrity";
export * from "./alpaca";
