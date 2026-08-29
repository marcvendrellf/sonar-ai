import type { InvestmentCommitteeState } from "./analysis";
import type { Claim } from "./evidence";
import { PORTFOLIO_LEVEL_ACTION_ID } from "./portfolio";
import type { DecisionReceipt } from "./receipts";

/**
 * Referential-integrity helpers for evidence.
 *
 * The core invariant of Sonar AI: every material graph edge and thesis claim
 * resolves to a known evidence record. A model output is invalid until this
 * holds. These pure functions let both the contract tests and the orchestrator's
 * evidence gate enforce it the same way.
 */

function claimEvidenceIds(claims: readonly Claim[] | undefined): string[] {
  return (claims ?? []).flatMap((c) => c.evidenceIds);
}

/**
 * Every evidence ID referenced anywhere in the committee state — events, graph
 * nodes and edges, proposed actions, agent claims, and activities.
 */
export function collectReferencedEvidenceIds(
  state: InvestmentCommitteeState,
): Set<string> {
  const ids: string[] = [];

  for (const event of state.materialEvents) ids.push(...event.evidenceIds);
  for (const node of state.graph.nodes) ids.push(...node.evidenceIds);
  for (const edge of state.graph.edges) ids.push(...edge.evidenceIds);
  for (const action of state.proposedActions) ids.push(...action.evidenceIds);
  for (const report of state.fundamentalReports)
    ids.push(...claimEvidenceIds(report.claims));
  ids.push(...claimEvidenceIds(state.marketContext?.claims));

  for (const rec of [state.proposal, state.finalRecommendation]) {
    if (!rec) continue;
    ids.push(...claimEvidenceIds(rec.bull));
    ids.push(...claimEvidenceIds(rec.context));
    ids.push(...claimEvidenceIds(rec.bear));
    for (const action of rec.actions) ids.push(...action.evidenceIds);
  }

  ids.push(...claimEvidenceIds(state.bearCase?.claims));
  for (const activity of state.activities) ids.push(...activity.evidenceIds);

  return new Set(ids);
}

/**
 * Referenced evidence IDs that do not resolve to a record in `state.evidence`.
 * An empty array means the state is referentially sound.
 */
export function findDanglingEvidenceIds(
  state: InvestmentCommitteeState,
): string[] {
  const known = new Set(state.evidence.map((e) => e.id));
  const referenced = collectReferencedEvidenceIds(state);
  return [...referenced].filter((id) => !known.has(id));
}

// ── Action referential integrity ────────────────────────────────────────────

/**
 * Every action ID a risk check can legitimately point at: the initial proposal,
 * the revised recommendation, the flattened proposed actions, and any applied
 * order. A risk check may also use the {@link PORTFOLIO_LEVEL_ACTION_ID}
 * sentinel for portfolio-wide breaches.
 */
export function collectKnownActionIds(
  state: InvestmentCommitteeState,
): Set<string> {
  const ids = new Set<string>();
  for (const a of state.proposal?.actions ?? []) ids.add(a.id);
  for (const a of state.finalRecommendation?.actions ?? []) ids.add(a.id);
  for (const a of state.proposedActions) ids.add(a.id);
  for (const o of state.appliedOrders) ids.add(o.actionId);
  return ids;
}

/**
 * Risk-check `actionId`s that resolve to no known action (excluding the
 * portfolio-level sentinel). Guards the failure the evidence gate cannot see: a
 * check pointing at an action that was revised away.
 */
export function findDanglingActionIds(
  state: InvestmentCommitteeState,
): string[] {
  const known = collectKnownActionIds(state);
  const checks = [...(state.riskReport?.checks ?? []), ...state.riskChecks];
  return checks
    .map((c) => c.actionId)
    .filter((id) => id !== PORTFOLIO_LEVEL_ACTION_ID && !known.has(id));
}

// ── Receipt referential integrity ───────────────────────────────────────────

function collectReceiptEvidenceIds(receipt: DecisionReceipt): Set<string> {
  const ids: string[] = [];
  if (receipt.event) ids.push(...receipt.event.evidenceIds);
  for (const rec of [receipt.proposal, receipt.recommendation]) {
    if (!rec) continue;
    ids.push(...claimEvidenceIds(rec.bull));
    ids.push(...claimEvidenceIds(rec.context));
    ids.push(...claimEvidenceIds(rec.bear));
    for (const a of rec.actions) ids.push(...a.evidenceIds);
  }
  ids.push(...claimEvidenceIds(receipt.bearCase?.claims));
  return new Set(ids);
}

/**
 * Evidence IDs referenced inside the receipt that do not resolve to a record in
 * the receipt's own `evidence[]`. The receipt is the durable artifact, so its
 * integrity is checked independently of the live committee state.
 */
export function findDanglingEvidenceIdsInReceipt(
  receipt: DecisionReceipt,
): string[] {
  const known = new Set(receipt.evidence.map((e) => e.id));
  return [...collectReceiptEvidenceIds(receipt)].filter((id) => !known.has(id));
}

/** Risk-check `actionId`s inside the receipt that resolve to no known action. */
export function findDanglingActionIdsInReceipt(
  receipt: DecisionReceipt,
): string[] {
  const known = new Set<string>();
  for (const a of receipt.proposal?.actions ?? []) known.add(a.id);
  for (const a of receipt.recommendation.actions) known.add(a.id);
  for (const o of receipt.appliedOrders) known.add(o.actionId);
  return receipt.riskReport.checks
    .map((c) => c.actionId)
    .filter((id) => id !== PORTFOLIO_LEVEL_ACTION_ID && !known.has(id));
}
