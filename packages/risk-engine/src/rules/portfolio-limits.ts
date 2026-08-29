import type { Mandate } from "@sonar-ai/core";

const EPS = 1e-9;

export interface SectorBreach {
  sector: string;
  exposure: number;
  limit: number;
}

/**
 * Sector exposures over `maxSectorExposure`. Unlike the position limit, a sector
 * breach is a HARD BLOCK — the Risk Officer stops the proposal and the Portfolio
 * Manager must revise; the engine does not silently trim it.
 */
export function checkSectorLimits(
  sectorExposure: Record<string, number>,
  mandate: Mandate,
): SectorBreach[] {
  const limit = mandate.limits.maxSectorExposure;
  return Object.entries(sectorExposure)
    .filter(([, exposure]) => exposure > limit + EPS)
    .map(([sector, exposure]) => ({ sector, exposure, limit }))
    .sort((a, b) => a.sector.localeCompare(b.sector));
}

export interface CashFloorOutcome {
  ok: boolean;
  cashRatio: number;
  minCashRatio: number;
}

/** The minimum-cash floor. A breach is a hard block. */
export function checkCashFloor(
  investedWeight: number,
  mandate: Mandate,
): CashFloorOutcome {
  const minCashRatio = mandate.limits.minCashRatio;
  const cashRatio = 1 - investedWeight;
  return { ok: cashRatio >= minCashRatio - EPS, cashRatio, minCashRatio };
}

export interface TurnoverOutcome {
  ok: boolean;
  turnover: number;
  maxTurnover: number;
}

/**
 * Turnover measures churn of EXISTING holdings, not deployment of cash. It is
 * the sell-side notional rotated out of current positions, as a fraction of
 * NAV. Deploying an all-cash book into new positions therefore has turnover 0;
 * only later rebalances that sell existing holdings count. A breach is a hard
 * block.
 */
export function checkTurnover(
  sellNotional: number,
  nav: number,
  mandate: Mandate,
): TurnoverOutcome {
  const maxTurnover = mandate.limits.maxTurnoverPerEvent;
  const turnover = nav > 0 ? sellNotional / nav : 0;
  return { ok: turnover <= maxTurnover + EPS, turnover, maxTurnover };
}
