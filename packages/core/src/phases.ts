import { z } from "zod";

/**
 * The single source of truth for fund state. The sphere, panel copy, graph
 * animation, and allowed controls all derive from this one phase — never run
 * unrelated animation timers that can drift apart from it.
 */
export const FUND_PHASES = [
  "idle",
  "observing",
  "tracing",
  "proposing",
  "challenging",
  "awaiting_approval",
  "executing",
  "blocked",
  "complete",
] as const;

export const FundPhaseSchema = z.enum(FUND_PHASES);
export type FundPhase = z.infer<typeof FundPhaseSchema>;
