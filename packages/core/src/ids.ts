import { IdSchema } from "./primitives";

/**
 * Stable-ID helpers. Every persisted entity carries a prefixed, collision-free
 * ID so records stay traceable across stages, fixtures, and the receipt.
 *
 * IDs are deterministic in shape (`<prefix>_<uuid>`) but the uuid is random,
 * so callers that need reproducible fixtures pass an explicit id instead of
 * generating one. The prefix makes an ID self-describing in logs and receipts.
 */

export const ID_PREFIXES = {
  run: "run",
  scenario: "scn",
  mandate: "mnd",
  portfolio: "pf",
  instrument: "inst",
  evidence: "ev",
  claim: "clm",
  event: "evt",
  activity: "act",
  node: "nd",
  edge: "edg",
  action: "acn",
  order: "ord",
  riskCheck: "rsk",
  fundamentalReport: "frp",
  marketContextReport: "mrp",
  riskReport: "rrp",
  recommendation: "rec",
  bearCase: "bear",
  report: "rpt",
  stageOutput: "stg",
  receipt: "rcpt",
} as const;

export type IdPrefix = (typeof ID_PREFIXES)[keyof typeof ID_PREFIXES];

/**
 * Generate a fresh prefixed ID. Uses the platform crypto UUID.
 * Pass a known prefix from {@link ID_PREFIXES}.
 */
export function newId(prefix: IdPrefix): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

/** Re-export the shared ID schema for convenience at validation boundaries. */
export { IdSchema };
