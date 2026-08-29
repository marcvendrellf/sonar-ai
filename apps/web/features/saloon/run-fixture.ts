import { committeeDemo } from "@/fixtures/committee-demo"

/**
 * Saloon adapter for the validated synthetic committee run. The six spheres
 * map one-to-one to the five decision agents and post-decision Report Writer.
 */
export type AgentId =
  | "portfolio-manager"
  | "fundamental-analyst"
  | "market-context"
  | "risk-officer"
  | "bear-critic"
  | "report-writer"

export type AgentState =
  | "idle"
  | "reading"
  | "tracing"
  | "debating"
  | "checking-risk"
  | "awaiting-approval"
  | "executing"
  | "blocked"
  | "complete"

export type TraceKind =
  | "source"
  | "relationship"
  | "claim"
  | "contradiction"
  | "risk"
  | "gate"
  | "trade"
  | "checkpoint"

export type PathNodeId = "event" | "nvidia" | "siemens" | "portfolio"
export type CheckResult = "pass" | "resize" | "reject"

export type Agent = {
  id: AgentId
  name: string
  initials: string
  role: string
  idleTask: string
  seat: number
  color: string
}

export type Source = {
  id: string
  title: string
  publisher: string
  url: string
  observedAt: string
  edge: string
  note: string
}

export type PathNode = {
  id: PathNodeId
  kind: string
  label: string
  meta: string
}

export type RiskCheck = {
  id: string
  label: string
  result: CheckResult
  detail: string
}

export type TraceEntry = {
  id: string
  at: number
  clock: string
  /** Omitted for deterministic system events such as approval and paper orders. */
  agent?: AgentId
  kind: TraceKind
  text: string
  source?: string
  system?: string
  states?: Partial<Record<AgentId, AgentState>>
  tasks?: Partial<Record<AgentId, string>>
  task?: string
  reveals?: PathNodeId
  check?: RiskCheck
}

export const agents: readonly Agent[] = [
  {
    id: "portfolio-manager",
    name: "Portfolio Manager",
    initials: "PM",
    role: "Owns allocation and revision",
    idleTask: "Waiting for research and risk outputs",
    seat: 0,
    color: "#69b9d6",
  },
  {
    id: "fundamental-analyst",
    name: "Fundamental Analyst",
    initials: "FA",
    role: "Tests quality, valuation and catalysts",
    idleTask: "Waiting for an isolated company evidence pack",
    seat: 1,
    color: "#c99b62",
  },
  {
    id: "market-context",
    name: "Market Context Analyst",
    initials: "MC",
    role: "Traces news, sector and macro context",
    idleTask: "Waiting for the material event",
    seat: 2,
    color: "#9da99f",
  },
  {
    id: "risk-officer",
    name: "Risk Officer",
    initials: "RO",
    role: "Enforces deterministic mandate limits",
    idleTask: "Waiting for a proposed allocation",
    seat: 3,
    color: "#a6a39d",
  },
  {
    id: "bear-critic",
    name: "Bear / Critic",
    initials: "BC",
    role: "Attacks assumptions and failure scenarios",
    idleTask: "Waiting for a risk-checked recommendation",
    seat: 4,
    color: "#ded1b8",
  },
  {
    id: "report-writer",
    name: "Report Writer",
    initials: "RW",
    role: "Documents the decision after human review",
    idleTask: "Blocked until a human decision exists",
    seat: 5,
    color: "#c3a47b",
  },
]

const evidenceById = Object.fromEntries(
  committeeDemo.evidence.map((evidence) => [evidence.id, evidence])
)

export const sources: Record<string, Source> = {
  ev_capex: {
    id: "ev_capex",
    title: evidenceById.ev_capex.title,
    publisher: evidenceById.ev_capex.sourceName,
    url: evidenceById.ev_capex.sourceUrl ?? "https://fixtures.sonar.local/evidence/ev_capex",
    observedAt: evidenceById.ev_capex.observedAt,
    edge: "GlobalCloud's synthetic €40B AI datacenter event opens the research run.",
    note: "Synthetic fixture evidence. The event is not live and is not investment advice.",
  },
  ev_nvda_supplier: {
    id: "ev_nvda_supplier",
    title: evidenceById.ev_nvda_supplier.title,
    publisher: evidenceById.ev_nvda_supplier.sourceName,
    url: "https://fixtures.sonar.local/evidence/ev_nvda_supplier",
    observedAt: evidenceById.ev_nvda_supplier.observedAt,
    edge: "GlobalCloud sources AI GPUs from Nvidia—the first-order relationship.",
    note: "Synthetic Cala relationship fixture. Association is evidence, not proof of causation.",
  },
  ev_asml_supplier: {
    id: "ev_asml_supplier",
    title: evidenceById.ev_asml_supplier.title,
    publisher: evidenceById.ev_asml_supplier.sourceName,
    url: "https://fixtures.sonar.local/evidence/ev_asml_supplier",
    observedAt: evidenceById.ev_asml_supplier.observedAt,
    edge: "Nvidia's advanced-node supply chain depends on ASML EUV lithography.",
    note: "Synthetic inferred relationship with 0.85 fixture confidence.",
  },
  ev_power_demand: {
    id: "ev_power_demand",
    title: evidenceById.ev_power_demand.title,
    publisher: evidenceById.ev_power_demand.sourceName,
    url: "https://fixtures.sonar.local/evidence/ev_power_demand",
    observedAt: evidenceById.ev_power_demand.observedAt,
    edge: "Datacenter grid demand exposes Siemens Energy as a second-order beneficiary.",
    note: "Synthetic inferred relationship with 0.75 fixture confidence.",
  },
  ev_nvda_fund: {
    id: "ev_nvda_fund",
    title: evidenceById.ev_nvda_fund.title,
    publisher: evidenceById.ev_nvda_fund.sourceName,
    url: "https://fixtures.sonar.local/evidence/ev_nvda_fund",
    observedAt: evidenceById.ev_nvda_fund.observedAt,
    edge: "Supports the Nvidia quality and demand thesis.",
    note: "Synthetic filing fixture, not a real company filing.",
  },
  ev_siemens_fund: {
    id: "ev_siemens_fund",
    title: evidenceById.ev_siemens_fund.title,
    publisher: evidenceById.ev_siemens_fund.sourceName,
    url: "https://fixtures.sonar.local/evidence/ev_siemens_fund",
    observedAt: evidenceById.ev_siemens_fund.observedAt,
    edge: "Supports the Siemens Energy backlog and grid-demand thesis.",
    note: "Synthetic filing fixture, not a real company filing.",
  },
}

export const pathNodes: readonly PathNode[] = [
  {
    id: "event",
    kind: "Synthetic event",
    label: "GlobalCloud AI buildout",
    meta: "€40B fixture · 2027 capacity",
  },
  {
    id: "nvidia",
    kind: "First-order exposure",
    label: "Nvidia",
    meta: "GPU supplier · extracted",
  },
  {
    id: "siemens",
    kind: "Second-order exposure",
    label: "Siemens Energy",
    meta: "Grid demand · inferred 0.75",
  },
  {
    id: "portfolio",
    kind: "Approved paper allocation",
    label: "30% NVDA · 20% SIEGY",
    meta: "50% cash retained",
  },
]

export const receipt = {
  id: committeeDemo.receipt?.id ?? "rcpt_main",
  writtenAt: "14:06 UTC",
  thesis:
    committeeDemo.report?.narrative ??
    "The committee traced the event to first- and second-order exposures.",
  acceptedOrder: "Buy €300 NVDA and €200 SIEGY in the paper ledger.",
  rejectedAlternative: "NVDA at 35% was resized to the 30% maximum-position limit.",
  conviction: "62% after risk resize and Bear / Critic review.",
} as const

export const trace: readonly TraceEntry[] = [
  {
    id: "t01",
    at: 0,
    clock: "14:01:10",
    agent: "market-context",
    kind: "source",
    text: "Read the synthetic GlobalCloud €40B AI datacenter announcement and isolated the named GPU spend.",
    source: "ev_capex",
    states: { "market-context": "reading" },
    task: "Mapping the material event to the candidate universe",
    reveals: "event",
  },
  {
    id: "t02",
    at: 4_000,
    clock: "14:01:34",
    agent: "market-context",
    kind: "relationship",
    text: "Traced Nvidia as the first-order GPU supplier and Siemens Energy as the less obvious grid-demand exposure.",
    source: "ev_power_demand",
    task: "Testing first- and second-order relationships",
    reveals: "siemens",
  },
  {
    id: "t03",
    at: 8_000,
    clock: "14:01:58",
    agent: "market-context",
    kind: "claim",
    text: "Context hypothesis: semiconductors are extended while grid-equipment names are earlier in their re-rating.",
    source: "ev_power_demand",
    states: { "market-context": "complete", "fundamental-analyst": "reading" },
    task: "Context report complete",
  },
  {
    id: "t04",
    at: 12_000,
    clock: "14:02:08",
    agent: "fundamental-analyst",
    kind: "source",
    text: "Reviewed the synthetic Nvidia filing for datacenter growth, margins and balance-sheet strength.",
    source: "ev_nvda_fund",
    task: "Reviewing Nvidia quality and valuation",
    reveals: "nvidia",
  },
  {
    id: "t05",
    at: 16_000,
    clock: "14:02:20",
    agent: "fundamental-analyst",
    kind: "source",
    text: "Reviewed the synthetic Siemens Energy filing for grid-order backlog and execution risk.",
    source: "ev_siemens_fund",
    task: "Comparing direct and second-order candidates",
  },
  {
    id: "t06",
    at: 20_000,
    clock: "14:02:44",
    agent: "fundamental-analyst",
    kind: "claim",
    text: "Fundamental hypothesis: Nvidia has the stronger moat; Siemens Energy offers the more reasonably valued second-order exposure.",
    source: "ev_siemens_fund",
    states: { "fundamental-analyst": "complete", "portfolio-manager": "debating" },
    task: "Fundamental reports complete",
  },
  {
    id: "t07",
    at: 24_000,
    clock: "14:04:20",
    agent: "portfolio-manager",
    kind: "claim",
    text: "Proposed 35% Nvidia and 20% Siemens Energy, retaining 45% cash from the €1,000 paper baseline.",
    system: "rec_proposal",
    states: { "risk-officer": "checking-risk", "report-writer": "blocked" },
    task: "Waiting for deterministic risk checks",
  },
  {
    id: "t08",
    at: 28_000,
    clock: "14:04:38",
    agent: "risk-officer",
    kind: "risk",
    text: "Passed Siemens Energy at 20%: inside both the 30% position limit and 45% sector limit.",
    system: "rsk_sie",
    task: "Checking the Core mandate",
    check: {
      id: "rsk_sie",
      label: "Siemens Energy allocation",
      result: "pass",
      detail: "20% position and 20% Energy exposure remain inside the Core mandate.",
    },
  },
  {
    id: "t09",
    at: 32_000,
    clock: "14:04:50",
    agent: "risk-officer",
    kind: "risk",
    text: "Resized Nvidia from 35% to the Core mandate's 30% maximum-position limit (€300).",
    system: "POSITION_LIMIT_BREACH",
    states: { "risk-officer": "complete", "bear-critic": "debating" },
    task: "Risk report complete; one action resized",
    check: {
      id: "rsk_nvda",
      label: "Nvidia allocation",
      result: "resize",
      detail: "35% requested · 30% maximum · resized to €300.",
    },
  },
  {
    id: "t10",
    at: 36_000,
    clock: "14:04:56",
    agent: "bear-critic",
    kind: "contradiction",
    text: "Challenged the Nvidia thesis: consensus already prices durable datacenter growth and ASML constraints can cap unit growth.",
    source: "ev_asml_supplier",
    task: "Testing the strongest assumptions",
  },
  {
    id: "t11",
    at: 40_000,
    clock: "14:05:02",
    agent: "bear-critic",
    kind: "contradiction",
    text: "Failure scenario: an AI capex slowdown compresses multiples across both approved names.",
    source: "ev_nvda_fund",
    states: { "bear-critic": "complete", "portfolio-manager": "debating" },
    task: "Counter-case recorded; no veto authority",
  },
  {
    id: "t12",
    at: 44_000,
    clock: "14:05:10",
    agent: "portfolio-manager",
    kind: "claim",
    text: "Revised the allocation to 30% Nvidia, 20% Siemens Energy and 50% cash, with 62% confidence and explicit invalidation conditions.",
    system: "rec_final",
    states: { "portfolio-manager": "awaiting-approval" },
    task: "Awaiting explicit human approval",
    reveals: "portfolio",
  },
  {
    id: "t13",
    at: 48_000,
    clock: "14:05:20",
    kind: "gate",
    text: "Human approved the resized recommendation. The deterministic paper ledger gate opened.",
    system: "approved",
    states: { "portfolio-manager": "complete", "report-writer": "executing" },
    tasks: {
      "portfolio-manager": "Final allocation approved and handed to the paper ledger",
      "report-writer": "Writing the post-decision internal report",
    },
  },
  {
    id: "t14",
    at: 52_000,
    clock: "14:05:25",
    kind: "trade",
    text: "Paper ledger applied two approved orders: €300 NVDA and €200 SIEGY. No real-money order was placed.",
    system: "paper only",
  },
  {
    id: "t15",
    at: 56_000,
    clock: "14:06:00",
    agent: "report-writer",
    kind: "checkpoint",
    text: "Generated the internal report from the final decision, evidence set, risk resize and human approval record.",
    system: "rpt_main",
    states: { "report-writer": "complete" },
    task: "Post-decision report complete",
  },
]

export const kindLabels: Record<TraceKind, string> = {
  source: "source read",
  relationship: "relationship traced",
  claim: "model hypothesis",
  contradiction: "challenge",
  risk: "deterministic check",
  gate: "approval gate",
  trade: "paper order",
  checkpoint: "stage output",
}

export const stateLabels: Record<AgentState, string> = {
  idle: "Idle",
  reading: "Reading",
  tracing: "Tracing",
  debating: "Reviewing",
  "checking-risk": "Checking risk",
  "awaiting-approval": "Awaiting approval",
  executing: "Writing",
  blocked: "Blocked",
  complete: "Complete",
}

export type ReceiptAnswer = {
  id: string
  keywords: readonly string[]
  text: string
  cites: string
}

export const receiptAnswers: readonly ReceiptAnswer[] = [
  {
    id: "resize",
    keywords: ["resize", "resized", "reduce", "reduced", "smaller", "cut", "30%", "35%"],
    text: "The Risk Officer found that Nvidia at 35% breached the Core mandate's 30% maximum-position limit, so deterministic code resized it to €300. The Portfolio Manager accepted the limit in revision 1.",
    cites: "rsk_nvda",
  },
  {
    id: "evidence",
    keywords: ["evidence", "path", "source", "sources", "why", "graph", "relationship", "cala"],
    text: "The synthetic path runs from GlobalCloud's AI buildout to Nvidia as its first-order GPU supplier and Siemens Energy as a second-order grid-demand exposure. Every relationship carries an evidence ID and confidence label.",
    cites: "ev_power_demand",
  },
  {
    id: "risk",
    keywords: ["limit", "limits", "risk", "check", "checks", "rule", "cash", "mandate"],
    text: "The Core mandate allows 30% per position, 45% per sector, requires 10% cash, and caps sell-side turnover at 20% per event. The accepted plan holds 50% cash; Siemens passed and Nvidia was resized.",
    cites: "rrp_main",
  },
  {
    id: "critic",
    keywords: ["critic", "bear", "weakness", "failure", "challenge", "confidence"],
    text: "The Bear / Critic flagged rich Nvidia expectations, ASML supply constraints and a shared AI-capex slowdown scenario. It could challenge the proposal but not veto it; the final confidence was 62%.",
    cites: "bear_main",
  },
  {
    id: "approval",
    keywords: ["approve", "approved", "human", "order", "trade", "paper"],
    text: "A human approved the resized allocation at 14:05:20. Only then did the paper ledger apply €300 NVDA and €200 SIEGY. Report Writer ran after that decision.",
    cites: "rcpt_main",
  },
]

export const suggestedQuestions: readonly string[] = [
  "Why was Nvidia resized?",
  "What evidence supports Siemens Energy?",
  "What did the Bear / Critic challenge?",
]

export function answerFromReceipt(question: string): ReceiptAnswer | null {
  const normalized = question.toLowerCase()
  return (
    receiptAnswers.find((answer) =>
      answer.keywords.some((keyword) => normalized.includes(keyword))
    ) ?? null
  )
}
