import type { InvestmentCommitteeState } from "./analysis";
import type { Claim } from "./evidence";

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

  const rec = state.finalRecommendation;
  if (rec) {
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
