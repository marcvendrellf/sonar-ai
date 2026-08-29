import type { Mandate, ProposedAction } from "@sonar-ai/core";

const EPS = 1e-9;

export interface ActionValidation {
  ok: boolean;
  detail: string;
  numbers: Record<string, number>;
}

/**
 * DATA_INVALID guard for a single action. A proposal is only as trustworthy as
 * its inputs: the currency must match the mandate, the target weight must be a
 * fraction in [0, 1], and the stated amount must agree with `targetWeight × NAV`
 * within 1% of NAV. Anything else is rejected before it can size a trade.
 */
export function validateAction(
  action: ProposedAction,
  mandate: Mandate,
  nav: number,
): ActionValidation {
  const numbers: Record<string, number> = {
    targetWeight: action.targetWeight,
    amount: action.amount.amount,
  };

  if (action.amount.currency !== mandate.baseCurrency) {
    return {
      ok: false,
      detail: `Action currency ${action.amount.currency} does not match mandate base ${mandate.baseCurrency}.`,
      numbers,
    };
  }
  if (
    !Number.isFinite(action.targetWeight) ||
    action.targetWeight < -EPS ||
    action.targetWeight > 1 + EPS
  ) {
    return {
      ok: false,
      detail: `Target weight ${action.targetWeight} is outside [0, 1].`,
      numbers,
    };
  }

  const expected = action.targetWeight * nav;
  const tolerance = Math.max(1, 0.01 * nav);
  numbers.expectedAmount = expected;
  if (Math.abs(action.amount.amount - expected) > tolerance) {
    return {
      ok: false,
      detail: `Amount ${action.amount.amount} disagrees with targetWeight×NAV (${expected}).`,
      numbers,
    };
  }

  return { ok: true, detail: "Action inputs are consistent.", numbers };
}
