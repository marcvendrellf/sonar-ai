import { FundamentalReportSchema, type FundamentalReport } from "@sonar-ai/core";
import type { AgentDef } from "../runner/types";
import type { FundamentalContext } from "../context";

export const fundamentalAnalyst: AgentDef<FundamentalContext, FundamentalReport> = {
  stage: "fundamental_analyst",
  instructions:
    "Evaluate only company quality, valuation, financial strength, catalysts, and risks from supplied evidence. Do not set allocation weights. Every claim must cite supplied evidence IDs.",
  outputSchema: FundamentalReportSchema,
  buildInput: (context) => JSON.stringify({
    mandate: context.mandate,
    portfolio: context.portfolio,
    instrument: context.instrument,
    materialEvents: context.materialEvents,
    evidence: context.evidence,
    relatedNodes: context.relatedNodes,
  }),
};
