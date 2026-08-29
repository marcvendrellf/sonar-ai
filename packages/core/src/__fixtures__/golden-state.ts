import type { InvestmentCommitteeState } from "../analysis";

/**
 * A complete, valid committee run used as the offline reference for the
 * stub-runner and for contract tests. Everything here is SYNTHETIC and labeled
 * as such — it is not market advice and not a real event.
 *
 * The scenario: a synthetic "GlobalCloud €40B AI datacenter buildout" event.
 * The obvious first-order name is Nvidia (GPUs); the non-obvious second-order
 * exposure is Siemens Energy (grid power for datacenters). The Portfolio
 * Manager proposes Nvidia at 35% — over the 30% position limit — and the
 * deterministic risk engine resizes it to 30%. A human approves the resized
 * allocation, and two paper orders apply.
 */
export const goldenState: InvestmentCommitteeState = {
  run: {
    id: "run_demo1",
    scenarioId: "scn_demo1",
    startedAt: "2026-08-29T14:00:00Z",
    completedAt: "2026-08-29T14:06:00Z",
    label: "synthetic",
  },
  phase: "complete",

  mandate: {
    id: "mnd_demo1",
    baseCurrency: "EUR",
    initialCash: { amount: 1000, currency: "EUR" },
    limits: {
      maxGrossExposurePerPosition: 0.3,
      maxSectorExposure: 0.45,
      minCashRatio: 0.1,
      maxTurnoverPerEvent: 0.2,
    },
  },

  candidateUniverse: [
    { id: "inst_nvidia", symbol: "NVDA", name: "Nvidia", sector: "Semiconductors", assetClass: "equity", currency: "EUR" },
    { id: "inst_asml", symbol: "ASML", name: "ASML Holding", sector: "Semiconductors", assetClass: "equity", currency: "EUR" },
    { id: "inst_siemens", symbol: "SIEGY", name: "Siemens Energy", sector: "Energy", assetClass: "equity", currency: "EUR" },
    { id: "inst_vestas", symbol: "VWS", name: "Vestas Wind Systems", sector: "Energy", assetClass: "equity", currency: "EUR" },
    { id: "inst_sp500", symbol: "SPYE", name: "S&P 500 ETF", sector: "Index", assetClass: "etf", currency: "EUR" },
  ],

  portfolioSnapshot: {
    id: "pf_before",
    asOf: "2026-08-29T14:00:00Z",
    baseCurrency: "EUR",
    cash: { amount: 1000, currency: "EUR" },
    nav: { amount: 1000, currency: "EUR" },
    positions: [],
    label: "synthetic",
  },

  materialEvents: [
    {
      id: "evt_capex",
      headline: "GlobalCloud announces €40B AI datacenter buildout for 2027",
      summary:
        "GlobalCloud Inc. commits €40B to AI datacenter capacity, naming GPU suppliers but not the downstream power and grid dependencies.",
      occurredAt: "2026-08-28T09:00:00Z",
      label: "synthetic",
      evidenceIds: ["ev_capex"],
    },
  ],

  marketSnapshot: {
    asOf: "2026-08-29T13:55:00Z",
    source: "fixture",
    label: "synthetic",
    quotes: [
      { instrumentId: "inst_nvidia", price: 120, currency: "EUR" },
      { instrumentId: "inst_asml", price: 650, currency: "EUR" },
      { instrumentId: "inst_siemens", price: 20, currency: "EUR" },
      { instrumentId: "inst_vestas", price: 15, currency: "EUR" },
      { instrumentId: "inst_sp500", price: 500, currency: "EUR" },
    ],
  },

  evidence: [
    { id: "ev_capex", kind: "cala", title: "GlobalCloud €40B AI datacenter buildout", sourceName: "Cala / GlobalCloud press", sourceUrl: "https://example.com/globalcloud-capex", observedAt: "2026-08-28T09:00:00Z", label: "synthetic" },
    { id: "ev_nvda_supplier", kind: "cala", title: "GlobalCloud sources AI GPUs from Nvidia", sourceName: "Cala relationship graph", observedAt: "2026-08-20T00:00:00Z", label: "synthetic" },
    { id: "ev_asml_supplier", kind: "cala", title: "Nvidia advanced nodes depend on ASML EUV lithography", sourceName: "Cala relationship graph", observedAt: "2026-07-15T00:00:00Z", label: "synthetic" },
    { id: "ev_power_demand", kind: "cala", title: "AI datacenters lift grid power demand; Siemens Energy supplies grid tech", sourceName: "Cala relationship graph", observedAt: "2026-08-10T00:00:00Z", label: "synthetic" },
    { id: "ev_nvda_fund", kind: "filing", title: "Nvidia data-center revenue growth (synthetic 10-Q)", sourceName: "Synthetic filing", observedAt: "2026-08-01T00:00:00Z", label: "synthetic" },
    { id: "ev_siemens_fund", kind: "filing", title: "Siemens Energy grid-orders backlog (synthetic)", sourceName: "Synthetic filing", observedAt: "2026-08-05T00:00:00Z", label: "synthetic" },
    { id: "ev_market", kind: "market", title: "Synthetic price snapshot for candidate universe", sourceName: "Fixture", observedAt: "2026-08-29T13:55:00Z", label: "synthetic" },
  ],

  graph: {
    nodes: [
      { id: "nd_event", type: "event", label: "GlobalCloud AI datacenter buildout", evidenceIds: ["ev_capex"] },
      { id: "nd_globalcloud", type: "company", label: "GlobalCloud Inc.", evidenceIds: ["ev_capex"] },
      { id: "nd_nvidia", type: "company", label: "Nvidia", instrumentId: "inst_nvidia", evidenceIds: ["ev_nvda_supplier", "ev_nvda_fund"] },
      { id: "nd_asml", type: "company", label: "ASML Holding", instrumentId: "inst_asml", evidenceIds: ["ev_asml_supplier"] },
      { id: "nd_siemens", type: "company", label: "Siemens Energy", instrumentId: "inst_siemens", evidenceIds: ["ev_power_demand", "ev_siemens_fund"] },
    ],
    edges: [
      { id: "edg_event_gc", source: "nd_event", target: "nd_globalcloud", relation: "affects", confidence: "EXTRACTED", confidenceScore: 1, treatment: "active", evidenceIds: ["ev_capex"] },
      { id: "edg_nvda_gc", source: "nd_nvidia", target: "nd_globalcloud", relation: "supplier_of", confidence: "EXTRACTED", confidenceScore: 1, treatment: "active", evidenceIds: ["ev_nvda_supplier"] },
      { id: "edg_asml_nvda", source: "nd_asml", target: "nd_nvidia", relation: "supplier_of", confidence: "INFERRED", confidenceScore: 0.85, treatment: "active", evidenceIds: ["ev_asml_supplier"] },
      { id: "edg_siemens_event", source: "nd_siemens", target: "nd_event", relation: "exposed_to", confidence: "INFERRED", confidenceScore: 0.75, treatment: "active", evidenceIds: ["ev_power_demand"] },
    ],
  },

  stages: [
    { runId: "run_demo1", stage: "fundamental_analyst", status: "complete", startedAt: "2026-08-29T14:01:00Z", completedAt: "2026-08-29T14:02:00Z", outputId: "frp_nvidia" },
    { runId: "run_demo1", stage: "market_context", status: "complete", startedAt: "2026-08-29T14:01:00Z", completedAt: "2026-08-29T14:02:00Z", outputId: "mrp_main" },
    { runId: "run_demo1", stage: "risk_officer", status: "complete", startedAt: "2026-08-29T14:03:00Z", completedAt: "2026-08-29T14:03:30Z", outputId: "rrp_main" },
    { runId: "run_demo1", stage: "portfolio_manager", status: "complete", startedAt: "2026-08-29T14:04:00Z", completedAt: "2026-08-29T14:04:30Z", outputId: "rec_final" },
    { runId: "run_demo1", stage: "bear_critic", status: "complete", startedAt: "2026-08-29T14:04:30Z", completedAt: "2026-08-29T14:05:00Z", outputId: "bear_main" },
    { runId: "run_demo1", stage: "report_writer", status: "complete", startedAt: "2026-08-29T14:05:30Z", completedAt: "2026-08-29T14:06:00Z", outputId: "rpt_main" },
  ],

  fundamentalReports: [
    {
      id: "frp_nvidia",
      instrumentId: "inst_nvidia",
      quality: "Dominant AI accelerator franchise with wide software moat.",
      valuation: "Rich on trailing multiples; justified only if data-center demand persists.",
      financialStrength: "Strong balance sheet, high gross margins.",
      catalysts: ["GlobalCloud capex cycle", "Next-gen accelerator launch"],
      risks: ["Demand air-pocket if AI capex slows", "Supply constraint at ASML"],
      claims: [
        { id: "clm_nvda1", statement: "Nvidia data-center revenue is growing on hyperscaler capex.", stance: "bull", evidenceIds: ["ev_nvda_fund"] },
      ],
    },
    {
      id: "frp_siemens",
      instrumentId: "inst_siemens",
      quality: "Leading grid and power-equipment supplier.",
      valuation: "Reasonable versus a multi-year electrification backlog.",
      financialStrength: "Improving margins, growing orders backlog.",
      catalysts: ["Datacenter grid demand", "Electrification capex"],
      risks: ["Project execution", "Grid permitting delays"],
      claims: [
        { id: "clm_sie1", statement: "Datacenter power demand supports Siemens Energy grid orders.", stance: "bull", evidenceIds: ["ev_power_demand", "ev_siemens_fund"] },
      ],
    },
  ],

  marketContext: {
    id: "mrp_main",
    summary: "AI datacenter capex is the dominant driver; grid power is the under-priced second-order dependency.",
    drivers: ["Hyperscaler AI capex", "Grid power constraints"],
    sectorView: "Semiconductors extended; energy/grid names earlier in their re-rating.",
    macroView: "Rates stable; capex cycle intact for now.",
    claims: [
      { id: "clm_ctx1", statement: "The capex headline names GPUs but not the downstream grid dependency.", stance: "context", evidenceIds: ["ev_capex", "ev_power_demand"] },
    ],
  },

  riskReport: {
    id: "rrp_main",
    metrics: {
      volatility: 0.18,
      beta: 1.2,
      concentration: 0.3,
      sectorExposure: { Semiconductors: 0.3, Energy: 0.2 },
    },
    stress: [
      { scenario: "AI capex slowdown (-20%)", navImpact: { amount: -80, currency: "EUR" }, navImpactPct: -0.08 },
    ],
    checks: [
      { id: "rsk_sie", actionId: "acn_sie_v0", result: "pass", detail: "Siemens 20% within the 30% position limit and 45% sector limit.", numbers: { positionWeight: 0.2, sectorExposure: 0.2 } },
      { id: "rsk_nvda", actionId: "acn_nvda_v0", result: "resize", breachCode: "POSITION_LIMIT_BREACH", detail: "Nvidia 35% exceeds the 30% max-position limit; resized to 30% (€300).", numbers: { proposedWeight: 0.35, positionLimit: 0.3, resizedWeight: 0.3 }, resizedAmount: { amount: 300, currency: "EUR" } },
    ],
    comparison: {
      currentNav: { amount: 1000, currency: "EUR" },
      proposedInvested: { amount: 500, currency: "EUR" },
      proposedCash: { amount: 500, currency: "EUR" },
      deltas: [
        { instrumentId: "inst_nvidia", currentWeight: 0, proposedWeight: 0.3 },
        { instrumentId: "inst_siemens", currentWeight: 0, proposedWeight: 0.2 },
      ],
    },
    hardBlocks: [],
  },

  finalRecommendation: {
    id: "rec_final",
    revision: 1,
    actions: [
      { id: "acn_sie_final", instrumentId: "inst_siemens", side: "buy", targetWeight: 0.2, amount: { amount: 200, currency: "EUR" }, evidenceIds: ["ev_power_demand"] },
      { id: "acn_nvda_final", instrumentId: "inst_nvidia", side: "buy", targetWeight: 0.3, amount: { amount: 300, currency: "EUR" }, evidenceIds: ["ev_nvda_supplier", "ev_nvda_fund"] },
    ],
    bull: [
      { id: "clm_bull1", statement: "Nvidia benefits directly from GlobalCloud's GPU spend.", stance: "bull", evidenceIds: ["ev_nvda_supplier", "ev_nvda_fund"] },
    ],
    context: [
      { id: "clm_ctx2", statement: "Siemens Energy is the second-order grid beneficiary the headline omits.", stance: "context", evidenceIds: ["ev_power_demand"] },
    ],
    bear: [
      { id: "clm_bear1", statement: "ASML supply constraints could cap Nvidia unit growth.", stance: "bear", evidenceIds: ["ev_asml_supplier"] },
    ],
    confidence: 0.62,
    invalidationConditions: ["GlobalCloud delays or cuts the capex plan", "Grid permitting stalls Siemens orders"],
    expectedCashAfter: { amount: 500, currency: "EUR" },
  },

  bearCase: {
    id: "bear_main",
    targetRecommendationId: "rec_final",
    weaknesses: ["Nvidia already priced for durable data-center growth"],
    failureScenarios: ["An AI capex slowdown compresses multiples across both names"],
    claims: [
      { id: "clm_bear2", statement: "Consensus already assumes strong Nvidia data-center revenue.", stance: "bear", evidenceIds: ["ev_nvda_fund"] },
    ],
  },

  proposedActions: [
    { id: "acn_sie_final", instrumentId: "inst_siemens", side: "buy", targetWeight: 0.2, amount: { amount: 200, currency: "EUR" }, evidenceIds: ["ev_power_demand"] },
    { id: "acn_nvda_final", instrumentId: "inst_nvidia", side: "buy", targetWeight: 0.3, amount: { amount: 300, currency: "EUR" }, evidenceIds: ["ev_nvda_supplier", "ev_nvda_fund"] },
  ],

  riskChecks: [
    { id: "rsk_sie", actionId: "acn_sie_v0", result: "pass", detail: "Siemens 20% within the 30% position limit and 45% sector limit.", numbers: { positionWeight: 0.2, sectorExposure: 0.2 } },
    { id: "rsk_nvda", actionId: "acn_nvda_v0", result: "resize", breachCode: "POSITION_LIMIT_BREACH", detail: "Nvidia 35% exceeds the 30% max-position limit; resized to 30% (€300).", numbers: { proposedWeight: 0.35, positionLimit: 0.3, resizedWeight: 0.3 }, resizedAmount: { amount: 300, currency: "EUR" } },
  ],

  userDecision: {
    decision: "approved",
    decidedAt: "2026-08-29T14:05:20Z",
    note: "Approved the resized allocation.",
  },

  appliedOrders: [
    { id: "ord_sie", actionId: "acn_sie_final", instrumentId: "inst_siemens", side: "buy", quantity: 10, price: { amount: 20, currency: "EUR" }, notional: { amount: 200, currency: "EUR" }, appliedAt: "2026-08-29T14:05:25Z" },
    { id: "ord_nvda", actionId: "acn_nvda_final", instrumentId: "inst_nvidia", side: "buy", quantity: 2.5, price: { amount: 120, currency: "EUR" }, notional: { amount: 300, currency: "EUR" }, appliedAt: "2026-08-29T14:05:25Z" },
  ],

  portfolioAfter: {
    id: "pf_after",
    asOf: "2026-08-29T14:05:30Z",
    baseCurrency: "EUR",
    cash: { amount: 500, currency: "EUR" },
    nav: { amount: 1000, currency: "EUR" },
    positions: [
      { instrumentId: "inst_siemens", quantity: 10, avgPrice: { amount: 20, currency: "EUR" }, marketValue: { amount: 200, currency: "EUR" }, weight: 0.2 },
      { instrumentId: "inst_nvidia", quantity: 2.5, avgPrice: { amount: 120, currency: "EUR" }, marketValue: { amount: 300, currency: "EUR" }, weight: 0.3 },
    ],
    label: "synthetic",
  },

  report: {
    id: "rpt_main",
    narrative:
      "The committee traced the GlobalCloud capex event to its first-order name (Nvidia) and a non-obvious second-order beneficiary (Siemens Energy, via datacenter grid demand). Risk resized the Nvidia allocation to the 30% position limit. A human approved the resized plan.",
    decisionSummary: "Approved: buy Siemens Energy 20% and Nvidia 30%; hold 50% cash.",
    disclaimers: ["Paper trading only.", "Synthetic scenario. Not investment advice."],
  },

  activities: [
    { id: "act_1", kind: "phase_changed", message: "Committee run started.", at: "2026-08-29T14:00:05Z", evidenceIds: [] },
    { id: "act_2", stage: "market_context", kind: "source_read", message: "Read GlobalCloud capex announcement.", at: "2026-08-29T14:01:10Z", evidenceIds: ["ev_capex"], refId: "evt_capex" },
    { id: "act_3", stage: "fundamental_analyst", kind: "relationship_added", message: "Traced Siemens Energy as a second-order grid beneficiary.", at: "2026-08-29T14:02:00Z", evidenceIds: ["ev_power_demand"], refId: "edg_siemens_event" },
    { id: "act_4", stage: "risk_officer", kind: "risk_changed_action", message: "Resized Nvidia from 35% to the 30% position limit.", at: "2026-08-29T14:03:20Z", evidenceIds: [], refId: "rsk_nvda" },
    { id: "act_5", stage: "portfolio_manager", kind: "recommendation_made", message: "Proposed Siemens 20% and Nvidia 30%, holding 50% cash.", at: "2026-08-29T14:04:20Z", evidenceIds: [], refId: "rec_final" },
    { id: "act_6", kind: "paper_trade", message: "Applied 2 paper orders after approval.", at: "2026-08-29T14:05:25Z", evidenceIds: [], refId: "rcpt_main" },
  ],

  receipt: {
    id: "rcpt_main",
    runId: "run_demo1",
    createdAt: "2026-08-29T14:06:00Z",
    event: {
      id: "evt_capex",
      headline: "GlobalCloud announces €40B AI datacenter buildout for 2027",
      summary:
        "GlobalCloud Inc. commits €40B to AI datacenter capacity, naming GPU suppliers but not the downstream power and grid dependencies.",
      occurredAt: "2026-08-28T09:00:00Z",
      label: "synthetic",
      evidenceIds: ["ev_capex"],
    },
    portfolioBefore: {
      id: "pf_before",
      asOf: "2026-08-29T14:00:00Z",
      baseCurrency: "EUR",
      cash: { amount: 1000, currency: "EUR" },
      nav: { amount: 1000, currency: "EUR" },
      positions: [],
      label: "synthetic",
    },
    portfolioAfter: {
      id: "pf_after",
      asOf: "2026-08-29T14:05:30Z",
      baseCurrency: "EUR",
      cash: { amount: 500, currency: "EUR" },
      nav: { amount: 1000, currency: "EUR" },
      positions: [
        { instrumentId: "inst_siemens", quantity: 10, avgPrice: { amount: 20, currency: "EUR" }, marketValue: { amount: 200, currency: "EUR" }, weight: 0.2 },
        { instrumentId: "inst_nvidia", quantity: 2.5, avgPrice: { amount: 120, currency: "EUR" }, marketValue: { amount: 300, currency: "EUR" }, weight: 0.3 },
      ],
      label: "synthetic",
    },
    recommendation: {
      id: "rec_final",
      revision: 1,
      actions: [
        { id: "acn_sie_final", instrumentId: "inst_siemens", side: "buy", targetWeight: 0.2, amount: { amount: 200, currency: "EUR" }, evidenceIds: ["ev_power_demand"] },
        { id: "acn_nvda_final", instrumentId: "inst_nvidia", side: "buy", targetWeight: 0.3, amount: { amount: 300, currency: "EUR" }, evidenceIds: ["ev_nvda_supplier", "ev_nvda_fund"] },
      ],
      bull: [{ id: "clm_bull1", statement: "Nvidia benefits directly from GlobalCloud's GPU spend.", stance: "bull", evidenceIds: ["ev_nvda_supplier", "ev_nvda_fund"] }],
      context: [{ id: "clm_ctx2", statement: "Siemens Energy is the second-order grid beneficiary the headline omits.", stance: "context", evidenceIds: ["ev_power_demand"] }],
      bear: [{ id: "clm_bear1", statement: "ASML supply constraints could cap Nvidia unit growth.", stance: "bear", evidenceIds: ["ev_asml_supplier"] }],
      confidence: 0.62,
      invalidationConditions: ["GlobalCloud delays or cuts the capex plan", "Grid permitting stalls Siemens orders"],
      expectedCashAfter: { amount: 500, currency: "EUR" },
    },
    riskReport: {
      id: "rrp_main",
      metrics: { volatility: 0.18, beta: 1.2, concentration: 0.3, sectorExposure: { Semiconductors: 0.3, Energy: 0.2 } },
      stress: [{ scenario: "AI capex slowdown (-20%)", navImpact: { amount: -80, currency: "EUR" }, navImpactPct: -0.08 }],
      checks: [
        { id: "rsk_sie", actionId: "acn_sie_v0", result: "pass", detail: "Siemens 20% within the 30% position limit and 45% sector limit.", numbers: { positionWeight: 0.2, sectorExposure: 0.2 } },
        { id: "rsk_nvda", actionId: "acn_nvda_v0", result: "resize", breachCode: "POSITION_LIMIT_BREACH", detail: "Nvidia 35% exceeds the 30% max-position limit; resized to 30% (€300).", numbers: { proposedWeight: 0.35, positionLimit: 0.3, resizedWeight: 0.3 }, resizedAmount: { amount: 300, currency: "EUR" } },
      ],
      comparison: {
        currentNav: { amount: 1000, currency: "EUR" },
        proposedInvested: { amount: 500, currency: "EUR" },
        proposedCash: { amount: 500, currency: "EUR" },
        deltas: [
          { instrumentId: "inst_nvidia", currentWeight: 0, proposedWeight: 0.3 },
          { instrumentId: "inst_siemens", currentWeight: 0, proposedWeight: 0.2 },
        ],
      },
      hardBlocks: [],
    },
    bearCase: {
      id: "bear_main",
      targetRecommendationId: "rec_final",
      weaknesses: ["Nvidia already priced for durable data-center growth"],
      failureScenarios: ["An AI capex slowdown compresses multiples across both names"],
      claims: [{ id: "clm_bear2", statement: "Consensus already assumes strong Nvidia data-center revenue.", stance: "bear", evidenceIds: ["ev_nvda_fund"] }],
    },
    userDecision: {
      decision: "approved",
      decidedAt: "2026-08-29T14:05:20Z",
      note: "Approved the resized allocation.",
    },
    appliedOrders: [
      { id: "ord_sie", actionId: "acn_sie_final", instrumentId: "inst_siemens", side: "buy", quantity: 10, price: { amount: 20, currency: "EUR" }, notional: { amount: 200, currency: "EUR" }, appliedAt: "2026-08-29T14:05:25Z" },
      { id: "ord_nvda", actionId: "acn_nvda_final", instrumentId: "inst_nvidia", side: "buy", quantity: 2.5, price: { amount: 120, currency: "EUR" }, notional: { amount: 300, currency: "EUR" }, appliedAt: "2026-08-29T14:05:25Z" },
    ],
    report: {
      id: "rpt_main",
      narrative:
        "The committee traced the GlobalCloud capex event to its first-order name (Nvidia) and a non-obvious second-order beneficiary (Siemens Energy, via datacenter grid demand). Risk resized the Nvidia allocation to the 30% position limit. A human approved the resized plan.",
      decisionSummary: "Approved: buy Siemens Energy 20% and Nvidia 30%; hold 50% cash.",
      disclaimers: ["Paper trading only.", "Synthetic scenario. Not investment advice."],
    },
    evidence: [
      { id: "ev_capex", kind: "cala", title: "GlobalCloud €40B AI datacenter buildout", sourceName: "Cala / GlobalCloud press", sourceUrl: "https://example.com/globalcloud-capex", observedAt: "2026-08-28T09:00:00Z", label: "synthetic" },
      { id: "ev_nvda_supplier", kind: "cala", title: "GlobalCloud sources AI GPUs from Nvidia", sourceName: "Cala relationship graph", observedAt: "2026-08-20T00:00:00Z", label: "synthetic" },
      { id: "ev_asml_supplier", kind: "cala", title: "Nvidia advanced nodes depend on ASML EUV lithography", sourceName: "Cala relationship graph", observedAt: "2026-07-15T00:00:00Z", label: "synthetic" },
      { id: "ev_power_demand", kind: "cala", title: "AI datacenters lift grid power demand; Siemens Energy supplies grid tech", sourceName: "Cala relationship graph", observedAt: "2026-08-10T00:00:00Z", label: "synthetic" },
      { id: "ev_nvda_fund", kind: "filing", title: "Nvidia data-center revenue growth (synthetic 10-Q)", sourceName: "Synthetic filing", observedAt: "2026-08-01T00:00:00Z", label: "synthetic" },
      { id: "ev_siemens_fund", kind: "filing", title: "Siemens Energy grid-orders backlog (synthetic)", sourceName: "Synthetic filing", observedAt: "2026-08-05T00:00:00Z", label: "synthetic" },
    ],
  },
};
