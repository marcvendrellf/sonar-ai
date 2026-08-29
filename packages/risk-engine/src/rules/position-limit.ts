import type { Mandate, ProposedAction } from "@sonar-ai/core";

const EPS = 1e-9;

export interface PositionLimitOutcome {
  /** Effective weight after applying the limit. */
  weight: number;
  /** Effective notional after applying the limit. */
  amount: number;
  resized: boolean;
  numbers: Record<string, number>;
}

/**
 * The single-position limit is enforced by RESIZING, not rejecting: an action
 * over `maxGrossExposurePerPosition` is trimmed to the limit so the demo shows
 * the mandate constraining a trade rather than dead-ending the run.
 */
export function applyPositionLimit(
  action: ProposedAction,
  mandate: Mandate,
  nav: number,
): PositionLimitOutcome {
  const limit = mandate.limits.maxGrossExposurePerPosition;

  if (action.targetWeight > limit + EPS) {
    const amount = Math.round(limit * nav * 100) / 100;
    return {
      weight: limit,
      amount,
      resized: true,
      numbers: {
        proposedWeight: action.targetWeight,
        positionLimit: limit,
        resizedWeight: limit,
      },
    };
  }

  return {
    weight: action.targetWeight,
    amount: action.amount.amount,
    resized: false,
    numbers: { positionWeight: action.targetWeight, positionLimit: limit },
  };
}
