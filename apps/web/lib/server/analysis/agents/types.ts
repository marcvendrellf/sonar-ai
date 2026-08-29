import { ClaimSchema } from "@sonar-ai/core";
import { z } from "zod";
import type { AgentDef } from "../runner/types";

/**
 * A claim as the MODEL produces it — no ID. Derived from the core `Claim` schema
 * so it cannot drift. `finalize` assigns the stable claim ID. Shared by every
 * agent whose output carries evidence-linked claims.
 */
export const ClaimDraftSchema = ClaimSchema.omit({ id: true });
export type ClaimDraft = z.infer<typeof ClaimDraftSchema>;

/**
 * A committee agent, from the agents lane's point of view.
 *
 * The model produces a **draft** (`TDraft`): semantic content only, no IDs. A
 * pure `finalize` turns that draft into the core output type (`TOutput`),
 * assigning deterministic IDs. This keeps structured output robust (the model
 * never invents an ID) and keeps IDs testable and stable across replays.
 *
 * The orchestrator runs `def` through an `AgentRunner`, then calls `finalize`:
 *
 *   const draft = (await runner.run(agent.def, ctx)).output;
 *   const output = agent.finalize(draft, ctx);   // core type, ready for the gate
 *
 * Draft schemas are DERIVED from the core output schemas (via `.omit`), so they
 * can never drift from the contract.
 */
export interface Agent<TContext, TDraft, TOutput> {
  def: AgentDef<TContext, TDraft>;
  finalize(draft: TDraft, context: TContext): TOutput;
}
