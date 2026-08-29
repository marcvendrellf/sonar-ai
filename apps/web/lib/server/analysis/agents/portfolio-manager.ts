import { RecommendationSchema, type Recommendation } from "@sonar-ai/core";
import type { PortfolioManagerContext } from "../context";
import type { AgentDef } from "../runner/types";

export const portfolioManager: AgentDef<PortfolioManagerContext, Recommendation> = {
  stage: "portfolio_manager",
  instructions:
    "Propose or revise allocation from structured research, risk output, mandate, and portfolio state. Keep action amounts consistent with target weights. Never override a risk hard block, calculate risk manually, or invent evidence.",
  outputSchema: RecommendationSchema,
  buildInput: (context) => JSON.stringify(context),
};
