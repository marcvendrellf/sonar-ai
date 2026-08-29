import {
  findDanglingActionIds,
  findDanglingEvidenceIds,
  type InvestmentCommitteeState,
  type RiskReport,
  type UserDecision,
} from "@sonar-ai/core";

export interface EvidenceGateResult {
  ok: boolean;
  danglingEvidenceIds: string[];
  danglingActionIds: string[];
}

export function checkEvidenceGate(state: InvestmentCommitteeState): EvidenceGateResult {
  const danglingEvidenceIds = findDanglingEvidenceIds(state);
  const danglingActionIds = findDanglingActionIds(state);
  return {
    ok: danglingEvidenceIds.length === 0 && danglingActionIds.length === 0,
    danglingEvidenceIds,
    danglingActionIds,
  };
}

export function checkRiskGate(report: RiskReport): { ok: boolean; reason?: string } {
  if (report.hardBlocks.length === 0) return { ok: true };
  return {
    ok: false,
    reason: `Risk Officer hard-blocked proposal: ${report.hardBlocks.join(", ")}.`,
  };
}

export function checkHumanApprovalGate(
  state: InvestmentCommitteeState,
  decision: UserDecision,
): { ok: boolean; reason?: string } {
  if (state.phase !== "awaiting_approval") {
    return { ok: false, reason: `Human approval requires awaiting_approval phase, got "${state.phase}".` };
  }
  if (!state.finalRecommendation || !state.riskReport) {
    return { ok: false, reason: "Human approval requires final recommendation and risk report." };
  }
  if (state.riskReport.hardBlocks.length > 0) {
    return { ok: false, reason: "Human approval cannot override a deterministic risk hard block." };
  }
  if (decision.decision !== "approved" && decision.decision !== "rejected") {
    return { ok: false, reason: "Human decision must be approved or rejected." };
  }
  return { ok: true };
}
