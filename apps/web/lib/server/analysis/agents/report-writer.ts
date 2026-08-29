import { CommitteeReportSchema, type CommitteeReport } from "@sonar-ai/core";
import type { ReportWriterContext } from "../context";
import type { AgentDef } from "../runner/types";

export const reportWriter: AgentDef<ReportWriterContext, CommitteeReport> = {
  stage: "report_writer",
  instructions:
    "Summarize the final human decision, evidence, risk result, and paper-ledger outcome. Run only after decision. Do not alter allocation or create new claims.",
  outputSchema: CommitteeReportSchema,
  buildInput: (context) => JSON.stringify(context),
};
