import { zodTextFormat } from "openai/helpers/zod";
import { describe, expect, it } from "vitest";
import { BearCaseDraftSchema } from "../analysis/agents/bear-critic";
import { FundamentalReportDraftSchema } from "../analysis/agents/fundamental-analyst";
import { MarketContextReportDraftSchema } from "../analysis/agents/market-context";
import { RecommendationDraftSchema } from "../analysis/agents/portfolio-manager";
import { CommitteeReportDraftSchema } from "../analysis/agents/report-writer";

/**
 * Every agent's DRAFT schema must convert to an OpenAI strict structured-output
 * format. `zodTextFormat` is the exact helper the runtime uses; it throws at
 * build time on any construct OpenAI's strict JSON-schema subset rejects
 * (unsupported keywords, optional-without-nullable, etc.). This is what stands
 * between a green stub run and a real model call that fails on the first turn.
 */
const cases = [
  ["fundamental_report", FundamentalReportDraftSchema],
  ["market_context_report", MarketContextReportDraftSchema],
  ["recommendation", RecommendationDraftSchema],
  ["bear_case", BearCaseDraftSchema],
  ["committee_report", CommitteeReportDraftSchema],
] as const;

describe("agent draft schemas → OpenAI strict structured output", () => {
  for (const [name, schema] of cases) {
    it(`${name} converts via zodTextFormat`, () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const format = zodTextFormat(schema as any, name);
      expect(format.type).toBe("json_schema");
      // The helper only emits strict:true when the schema is fully compatible.
      expect((format as unknown as { strict?: boolean }).strict).toBe(true);
    });
  }
});
