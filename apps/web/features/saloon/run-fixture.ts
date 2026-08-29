/**
 * The Saloon fixture runs one prepared event end to end.
 *
 * Everything here is fixture data. The trace is an execution log: an entry
 * exists only because something observable happened. There are no filler
 * messages and no agent small talk.
 */

export type AgentId =
  | "scout"
  | "cartographer"
  | "analyst"
  | "skeptic"
  | "marshal"
  | "trader"

export type AgentState =
  | "idle"
  | "reading"
  | "tracing"
  | "debating"
  | "checking-risk"
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

export type PathNodeId = "event" | "edge" | "position"

export type CheckResult = "pass" | "resize" | "reject"

export type Agent = {
  id: AgentId
  name: string
  initials: string
  role: string
  idleTask: string
  /** Seat index around the table, clockwise from the far side. */
  seat: number
  /** Orb material colour. Mirrors --agent-<id> in saloon.css; keep both in step. */
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
  /** Milliseconds from the start of the run. Drives playback pacing. */
  at: number
  clock: string
  agent: AgentId
  kind: TraceKind
  text: string
  /** Id of a Source. Renders a clickable source badge. */
  source?: string
  /** Label for a system badge, used when no external source backs the entry. */
  system?: string
  /** Agent states this entry sets. Folded forward to give live roster state. */
  states?: Partial<Record<AgentId, AgentState>>
  /** Task line shown on the roster for the acting agent. */
  task?: string
  /** Relationship path node this entry reveals. */
  reveals?: PathNodeId
  /** Deterministic check this entry records. */
  check?: RiskCheck
}

export const agents: readonly Agent[] = [
  {
    id: "scout",
    name: "Scout",
    initials: "SC",
    role: "Reads the event",
    idleTask: "Waiting for the event to open",
    seat: 0,
    color: "#4a7e9a",
  },
  {
    id: "cartographer",
    name: "Cartographer",
    initials: "CA",
    role: "Traces relationships",
    idleTask: "Waiting for the event brief",
    seat: 1,
    color: "#087f9d",
  },
  {
    id: "analyst",
    name: "Analyst",
    initials: "AN",
    role: "Builds the bull case",
    idleTask: "Waiting for a sourced path",
    seat: 2,
    color: "#397567",
  },
  {
    id: "skeptic",
    name: "Skeptic",
    initials: "SK",
    role: "Attacks the bull case",
    idleTask: "Waiting for a claim to test",
    seat: 3,
    color: "#8b651f",
  },
  {
    id: "marshal",
    name: "Marshal",
    initials: "MA",
    role: "Enforces risk limits",
    idleTask: "Waiting for a proposed order",
    seat: 4,
    color: "#625d77",
  },
  {
    id: "trader",
    name: "Trader",
    initials: "TR",
    role: "Applies paper orders",
    idleTask: "Waiting for an approved order",
    seat: 5,
    color: "#39485a",
  },
]

export const sources: Record<string, Source> = {
  "SRC-01": {
    id: "SRC-01",
    title: "Export-control notice EV-104",
    publisher: "Official journal replay fixture",
    url: "https://fixtures.sonar.local/events/ev-104",
    observedAt: "2026-08-29 09:41 UTC",
    edge: "EV-104 restricts the low-power radio component line",
    note: "Prepared historical replay. The notice is dated, not live.",
  },
  "SRC-02": {
    id: "SRC-02",
    title: "Nordic Semiconductor 2025 annual report, supplier note",
    publisher: "Company filing replay fixture",
    url: "https://fixtures.sonar.local/filings/nod-ol-2025-ar",
    observedAt: "2026-08-28 22:10 UTC",
    edge: "ED-208 supplies low-power chips to two named integrators",
    note: "The supplier note is 11 months old. No newer filing is in the fixture set.",
  },
  "SRC-03": {
    id: "SRC-03",
    title: "Cala relationship record ED-208",
    publisher: "Cala fixture export",
    url: "https://fixtures.sonar.local/cala/ed-208",
    observedAt: "2026-08-28 22:14 UTC",
    edge: "ED-208 connects EV-104 to paper position POS-02",
    note: "Association observed in the graph. Causal certainty is not claimed.",
  },
}

export const pathNodes: readonly PathNode[] = [
  {
    id: "event",
    kind: "Event",
    label: "Export-control replay",
    meta: "EV-104 · historical",
  },
  {
    id: "edge",
    kind: "Relationship",
    label: "Supplies low-power chips",
    meta: "ED-208 · Cala fixture",
  },
  {
    id: "position",
    kind: "Position",
    label: "Nordic Semiconductor",
    meta: "POS-02 · 18.6% paper weight",
  },
]

export const receipt = {
  id: "SR-042",
  writtenAt: "09:43:12 UTC",
  thesis:
    "The prepared event raises second-order demand risk for a current semiconductor exposure. The relationship is evidence, not proof of causation.",
  acceptedOrder: "Sell €41,500 NOD.OL at fixture price 118.40",
  rejectedAlternative: "Sell €62,000 NOD.OL. Rejected because it breached the turnover cap.",
  conviction: "Reduced. The supporting filing is 11 months old.",
} as const

/**
 * The run. Clock values are fixture timestamps; `at` drives playback pacing.
 */
export const trace: readonly TraceEntry[] = [
  {
    id: "t01",
    at: 0,
    clock: "09:42:04",
    agent: "scout",
    kind: "source",
    text: "Opened the prepared export-control notice and confirmed its publication timestamp.",
    source: "SRC-01",
    states: { scout: "reading" },
    task: "Reading EV-104",
    reveals: "event",
  },
  {
    id: "t02",
    at: 7000,
    clock: "09:42:11",
    agent: "scout",
    kind: "source",
    text: "Read the supplier note filed with the 2025 annual report of the position under review.",
    source: "SRC-02",
    task: "Reading supplier filings",
  },
  {
    id: "t03",
    at: 14000,
    clock: "09:42:18",
    agent: "scout",
    kind: "checkpoint",
    text: "Event brief ready. Two sources read, both dated before the run started.",
    system: "brief",
    states: { scout: "complete", cartographer: "tracing" },
    task: "Brief handed over",
  },
  {
    id: "t04",
    at: 18000,
    clock: "09:42:22",
    agent: "cartographer",
    kind: "relationship",
    text: "Added edge: the notice restricts the low-power radio component line.",
    source: "SRC-01",
    task: "Tracing entities in Cala",
  },
  {
    id: "t05",
    at: 25000,
    clock: "09:42:29",
    agent: "cartographer",
    kind: "relationship",
    text: "Added edge: Nordic Semiconductor supplies that component line to two named integrators.",
    source: "SRC-02",
    task: "Tracing supplier edges",
    reveals: "edge",
  },
  {
    id: "t06",
    at: 31000,
    clock: "09:42:35",
    agent: "cartographer",
    kind: "relationship",
    text: "Linked the traced entity to paper position POS-02, currently 18.6% of the book.",
    source: "SRC-03",
    task: "Linking graph to the book",
    reveals: "position",
  },
  {
    id: "t07",
    at: 34000,
    clock: "09:42:38",
    agent: "cartographer",
    kind: "checkpoint",
    text: "Sourced path complete: EV-104 → ED-208 → POS-02. Every edge carries a source.",
    system: "graph",
    states: { cartographer: "complete", analyst: "debating", skeptic: "debating" },
    task: "Path published",
  },
  {
    id: "t08",
    at: 39000,
    clock: "09:42:43",
    agent: "analyst",
    kind: "claim",
    text: "Claim: the demand risk is priced into the integrators but not into the component supplier.",
    source: "SRC-03",
    task: "Building the bull case",
  },
  {
    id: "t09",
    at: 45000,
    clock: "09:42:49",
    agent: "skeptic",
    kind: "contradiction",
    text: "Contradiction: the filing names two integrators, and neither appears on the restricted list in EV-104.",
    source: "SRC-02",
    task: "Testing the claim",
  },
  {
    id: "t10",
    at: 50000,
    clock: "09:42:54",
    agent: "analyst",
    kind: "claim",
    text: "Conceded. Narrowed the claim to the shared component line rather than the integrator relationship.",
    source: "SRC-02",
    task: "Narrowing the claim",
  },
  {
    id: "t11",
    at: 54000,
    clock: "09:42:58",
    agent: "skeptic",
    kind: "contradiction",
    text: "Standing objection: the supporting filing is 11 months old and no newer filing exists in the fixture set.",
    system: "no newer source",
    task: "Objection recorded",
  },
  {
    id: "t12",
    at: 55000,
    clock: "09:42:59",
    agent: "trader",
    kind: "gate",
    text: "Execution is blocked. No order reaches the book before the Marshal passes every deterministic check.",
    system: "gate",
    states: { trader: "blocked" },
    task: "Blocked at the risk gate",
  },
  {
    id: "t13",
    at: 58000,
    clock: "09:43:02",
    agent: "analyst",
    kind: "checkpoint",
    text: "Thesis accepted with reduced conviction. Proposed paper order: sell €62,000 NOD.OL.",
    system: "decision",
    states: { analyst: "complete", skeptic: "complete", marshal: "checking-risk" },
    task: "Thesis accepted",
  },
  {
    id: "t14",
    at: 61000,
    clock: "09:43:05",
    agent: "marshal",
    kind: "risk",
    text: "Position exposure after the sale would be 12.4%, inside the 30% limit.",
    system: "limit",
    task: "Checking exposure",
    check: {
      id: "RC-01",
      label: "Position exposure",
      result: "pass",
      detail: "12.4% after sale · limit 30%",
    },
  },
  {
    id: "t15",
    at: 63000,
    clock: "09:43:07",
    agent: "marshal",
    kind: "risk",
    text: "Cash after the sale would be €148,200, above the €120,000 floor.",
    system: "limit",
    task: "Checking cash floor",
    check: {
      id: "RC-02",
      label: "Minimum cash",
      result: "pass",
      detail: "€148,200 after sale · floor €120,000",
    },
  },
  {
    id: "t16",
    at: 65000,
    clock: "09:43:09",
    agent: "marshal",
    kind: "risk",
    text: "Turnover for this event would reach 7.1% against a 5.0% cap. Resized the sell from €62,000 to €41,500.",
    system: "limit",
    task: "Resizing the order",
    check: {
      id: "RC-03",
      label: "Turnover per event",
      result: "resize",
      detail: "7.1% requested · cap 5.0% · sell cut to €41,500",
    },
  },
  {
    id: "t17",
    at: 66000,
    clock: "09:43:10",
    agent: "marshal",
    kind: "risk",
    text: "Recorded the unresized €62,000 order as the rejected alternative.",
    system: "limit",
    task: "Recording the alternative",
    check: {
      id: "RC-04",
      label: "Unresized alternative",
      result: "reject",
      detail: "€62,000 sell rejected · breached turnover cap",
    },
  },
  {
    id: "t18",
    at: 67000,
    clock: "09:43:11",
    agent: "marshal",
    kind: "checkpoint",
    text: "A risk rule changed the order. The gate is now open for the resized sell only.",
    system: "risk",
    states: { marshal: "complete", trader: "executing" },
    task: "Gate opened",
  },
  {
    id: "t19",
    at: 68000,
    clock: "09:43:12",
    agent: "trader",
    kind: "trade",
    text: "Applied paper order: sell €41,500 NOD.OL at fixture price 118.40. No real-money order was placed.",
    system: "paper only",
    task: "Applying the paper order",
  },
  {
    id: "t20",
    at: 69000,
    clock: "09:43:12",
    agent: "trader",
    kind: "checkpoint",
    text: "Decision receipt SR-042 written with the accepted thesis, the evidence path, and the rejected alternative.",
    system: "receipt",
    states: { trader: "complete" },
    task: "Receipt written",
  },
]

export const kindLabels: Record<TraceKind, string> = {
  source: "read",
  relationship: "traced",
  claim: "claim",
  contradiction: "challenge",
  risk: "risk check",
  gate: "blocked",
  trade: "paper order",
  checkpoint: "checkpoint",
}

export const stateLabels: Record<AgentState, string> = {
  idle: "Idle",
  reading: "Reading",
  tracing: "Tracing",
  debating: "Debating",
  "checking-risk": "Checking risk",
  executing: "Executing",
  blocked: "Blocked",
  complete: "Complete",
}

/**
 * Answers to the human question box come from the decision receipt, never from
 * unbounded chat history. A question the receipt does not cover is refused.
 */
export type ReceiptAnswer = {
  id: string
  keywords: readonly string[]
  text: string
  cites: string
}

export const receiptAnswers: readonly ReceiptAnswer[] = [
  {
    id: "resize",
    keywords: ["resize", "resized", "reduce", "reduced", "smaller", "cut", "41,500", "41500"],
    text: "Turnover for this event would have reached 7.1% against a 5.0% cap, so the Marshal resized the sell from €62,000 to €41,500. The unresized order is on file as the rejected alternative.",
    cites: "RC-03",
  },
  {
    id: "alternative",
    keywords: ["alternative", "reject", "rejected", "62,000", "62000", "instead"],
    text: "The rejected alternative was a €62,000 sell of NOD.OL. It was rejected for one reason: it breached the turnover cap. It is recorded in full so the order that did not happen stays inspectable.",
    cites: "RC-04",
  },
  {
    id: "evidence",
    keywords: ["evidence", "path", "source", "sources", "why", "graph", "relationship", "cala"],
    text: "The path is EV-104 → ED-208 → POS-02. The export-control notice restricts a component line, the Cala record connects that line to Nordic Semiconductor, and the position is 18.6% of the paper book. Each edge carries a source you can open.",
    cites: "SRC-03",
  },
  {
    id: "limits",
    keywords: ["limit", "limits", "risk", "check", "checks", "rule", "rules", "exposure", "cash"],
    text: "Three deterministic checks ran: position exposure at 12.4% against a 30% limit, cash at €148,200 against a €120,000 floor, and turnover at 7.1% against a 5.0% cap. The first two passed. The third resized the order.",
    cites: "SR-042",
  },
  {
    id: "blocked",
    keywords: ["block", "blocked", "gate", "stopped", "wait"],
    text: "The Trader was blocked from 09:42:59 until 09:43:11. No order reaches the book until every deterministic check has run, so a failing check stops execution rather than warning about it afterwards.",
    cites: "SR-042",
  },
  {
    id: "conviction",
    keywords: ["conviction", "confidence", "old", "stale", "age", "objection", "skeptic"],
    text: "Conviction was reduced because the supporting filing is 11 months old and no newer filing exists in the fixture set. The Skeptic's objection stands in the receipt rather than being resolved away.",
    cites: "SRC-02",
  },
]

export const suggestedQuestions: readonly string[] = [
  "Why did you reduce this position?",
  "What evidence supports it?",
  "What order was rejected?",
]

export function answerFromReceipt(question: string): ReceiptAnswer | null {
  const normalised = question.toLowerCase()
  for (const answer of receiptAnswers) {
    if (answer.keywords.some((keyword) => normalised.includes(keyword))) {
      return answer
    }
  }
  return null
}
