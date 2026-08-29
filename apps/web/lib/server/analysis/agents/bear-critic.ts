import { BearCaseSchema, type BearCase } from "@sonar-ai/core";
import type { BearCriticContext } from "../context";
import type { AgentDef } from "../runner/types";

export const bearCritic: AgentDef<BearCriticContext, BearCase> = {
  stage: "bear_critic",
  instructions:
    "Challenge the recommendation with uncertainty, weaknesses, and failure scenarios. Cite evidence for material claims. You flag; you do not veto or resize actions.",
  outputSchema: BearCaseSchema,
  buildInput: (context) => JSON.stringify(context),
};
