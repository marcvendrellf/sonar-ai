import {
  FundamentalReportSchema,
  type Evidence,
  type Instrument,
} from "@sonar-ai/core";
import { describe, expect, it } from "vitest";
import { StubAgentRunner } from "../runner/stub-runner";
import {
  fundamentalAnalyst,
  FundamentalReportDraftSchema,
  type FundamentalContext,
  type FundamentalReportDraft,
} from "./fundamental-analyst";

const INSTRUMENT: Instrument = {
  id: "inst_nvidia",
  symbol: "NVDA",
  name: "Nvidia",
  sector: "Semiconductors",
  assetClass: "equity",
  currency: "EUR",
};

const EVIDENCE: Evidence[] = [
  { id: "ev_nvda_fund", kind: "filing", title: "Nvidia data-center revenue growth", sourceName: "Synthetic filing", observedAt: "2026-08-01T00:00:00Z", label: "synthetic" },
  { id: "ev_nvda_supplier", kind: "cala", title: "GlobalCloud sources GPUs from Nvidia", sourceName: "Cala", observedAt: "2026-08-20T00:00:00Z", label: "synthetic" },
];

const CONTEXT: FundamentalContext = {
  instrument: INSTRUMENT,
  evidence: EVIDENCE,
  priorThesis: null,
};

const DRAFT: FundamentalReportDraft = {
  quality: "Dominant AI accelerator franchise with a wide software moat.",
  valuation: "Rich on trailing multiples; justified only if datacenter demand persists.",
  financialStrength: "Strong balance sheet, high gross margins.",
  catalysts: ["GlobalCloud capex cycle"],
  risks: ["Demand air-pocket if AI capex slows"],
  claims: [
    { statement: "Nvidia datacenter revenue is growing on hyperscaler capex.", stance: "bull", evidenceIds: ["ev_nvda_fund"] },
  ],
};

describe("fundamentalAnalyst", () => {
  it("accepts a well-formed draft (no IDs) against its output schema", () => {
    expect(FundamentalReportDraftSchema.safeParse(DRAFT).success).toBe(true);
  });

  it("builds a prompt that names the instrument and exposes every evidence ID", () => {
    const prompt = fundamentalAnalyst.def.buildInput(CONTEXT);
    expect(prompt).toContain("Nvidia");
    for (const e of EVIDENCE) expect(prompt).toContain(e.id);
  });

  it("finalizes a draft into a schema-valid report with deterministic IDs", () => {
    const report = fundamentalAnalyst.finalize(DRAFT, CONTEXT);
    expect(FundamentalReportSchema.safeParse(report).success).toBe(true);
    expect(report.id).toBe("frp_inst_nvidia");
    expect(report.instrumentId).toBe("inst_nvidia");
    expect(report.claims[0]!.id).toBe("clm_inst_nvidia_0");
  });

  it("produces claims whose evidence all resolves to the provided pack", () => {
    const report = fundamentalAnalyst.finalize(DRAFT, CONTEXT);
    const known = new Set(EVIDENCE.map((e) => e.id));
    const referenced = report.claims.flatMap((c) => c.evidenceIds);
    expect(referenced.every((id) => known.has(id))).toBe(true);
  });

  it("runs end-to-end through the StubAgentRunner for one instrument", async () => {
    const runner = new StubAgentRunner({ fundamental_analyst: DRAFT });
    const { output } = await runner.run(fundamentalAnalyst.def, CONTEXT);
    const report = fundamentalAnalyst.finalize(output, CONTEXT);
    expect(FundamentalReportSchema.safeParse(report).success).toBe(true);
  });
});
