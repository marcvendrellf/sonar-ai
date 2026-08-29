import {
  MarketContextReportSchema,
  type Evidence,
  type Instrument,
  type MaterialEvent,
} from "@sonar-ai/core";
import { describe, expect, it } from "vitest";
import { StubAgentRunner } from "../runner/stub-runner";
import {
  marketContextAnalyst,
  MarketContextReportDraftSchema,
  type MarketContextContext,
  type MarketContextReportDraft,
} from "./market-context";

const EVENTS: MaterialEvent[] = [
  { id: "evt_capex", headline: "GlobalCloud €40B AI datacenter buildout", summary: "Capex names GPUs but not grid power.", occurredAt: "2026-08-28T09:00:00Z", label: "synthetic", evidenceIds: ["ev_capex"] },
];

const EVIDENCE: Evidence[] = [
  { id: "ev_capex", kind: "cala", title: "GlobalCloud capex", sourceName: "Cala", observedAt: "2026-08-28T09:00:00Z", label: "synthetic" },
  { id: "ev_power_demand", kind: "cala", title: "Datacenters lift grid power demand", sourceName: "Cala", observedAt: "2026-08-10T00:00:00Z", label: "synthetic" },
];

const WATCHLIST: Instrument[] = [
  { id: "inst_nvda", symbol: "NVDA", name: "NVIDIA", sector: "Semiconductors", assetClass: "equity", currency: "USD" },
  { id: "inst_vst", symbol: "VST", name: "Vistra", sector: "Utilities", assetClass: "equity", currency: "USD" },
];

const CONTEXT: MarketContextContext = {
  instruments: WATCHLIST,
  materialEvents: EVENTS,
  evidence: EVIDENCE,
  holdings: [],
  mandate: {
    id: "mnd_test",
    baseCurrency: "EUR",
    initialCash: { amount: 1000, currency: "EUR" },
    limits: { maxGrossExposurePerPosition: 0.3, maxSectorExposure: 0.45, minCashRatio: 0.1, maxTurnoverPerEvent: 0.2 },
  },
};

const DRAFT: MarketContextReportDraft = {
  candidateOpportunities: [],
  summary: "AI datacenter capex is the dominant driver; grid power is the under-priced dependency.",
  drivers: ["Hyperscaler AI capex", "Grid power constraints"],
  sectorView: "Semiconductors extended; energy/grid earlier in its re-rating.",
  macroView: "Rates stable; capex cycle intact.",
  claims: [
    { statement: "The capex headline names GPUs but not the grid dependency.", stance: "context", evidenceIds: ["ev_capex", "ev_power_demand"] },
  ],
};

describe("marketContextAnalyst", () => {
  it("accepts a well-formed draft (no IDs) against its output schema", () => {
    expect(MarketContextReportDraftSchema.safeParse(DRAFT).success).toBe(true);
  });

  it("exposes the watchlist to select from, plus events and every evidence ID", () => {
    const prompt = marketContextAnalyst.def.buildInput(CONTEXT);
    // The agent selects candidates from the provided watchlist.
    expect(prompt).toContain("NVDA");
    expect(prompt).toContain("VST");
    expect(prompt).toContain("SELECT");
    expect(prompt).toContain("evt_capex");
    for (const e of EVIDENCE) expect(prompt).toContain(e.id);
  });

  it("finalizes a draft into a schema-valid report with deterministic IDs", () => {
    const report = marketContextAnalyst.finalize(DRAFT, CONTEXT);
    expect(MarketContextReportSchema.safeParse(report).success).toBe(true);
    expect(report.id).toBe("mrp_main");
    expect(report.claims[0]!.id).toBe("clm_mrp_0");
  });

  it("produces claims whose evidence all resolves to the provided pack", () => {
    const report = marketContextAnalyst.finalize(DRAFT, CONTEXT);
    const known = new Set(EVIDENCE.map((e) => e.id));
    const referenced = report.claims.flatMap((c) => c.evidenceIds);
    expect(referenced.every((id) => known.has(id))).toBe(true);
  });

  it("runs end-to-end through the StubAgentRunner", async () => {
    const runner = new StubAgentRunner({ market_context: DRAFT });
    const { output } = await runner.run(marketContextAnalyst.def, CONTEXT);
    const report = marketContextAnalyst.finalize(output, CONTEXT);
    expect(MarketContextReportSchema.safeParse(report).success).toBe(true);
  });
});
