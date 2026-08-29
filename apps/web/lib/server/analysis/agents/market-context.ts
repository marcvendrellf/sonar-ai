import { MarketContextReportSchema, type MarketContextReport } from "@sonar-ai/core";
import type { MarketContext } from "../context";
import type { AgentDef } from "../runner/types";

export const marketContextAnalyst: AgentDef<MarketContext, MarketContextReport> = {
  stage: "market_context",
  instructions:
    "Explain news, sector, macro, competitors, regulation, and material events from supplied context. Do not turn one fact into an automatic trade. Every claim must cite supplied evidence IDs.",
  outputSchema: MarketContextReportSchema,
  buildInput: (context) => JSON.stringify(context),
};
