import { z } from "zod";
import { DataLabelSchema, IdSchema, IsoDateTimeSchema } from "./primitives";

/**
 * A material event or change that enters the committee run. Prepared as
 * historical or synthetic for the demo; always labeled.
 */
export const MaterialEventSchema = z.object({
  id: IdSchema,
  headline: z.string().min(1),
  summary: z.string().min(1),
  occurredAt: IsoDateTimeSchema,
  label: DataLabelSchema,
  evidenceIds: z.array(IdSchema).default([]),
});
export type MaterialEvent = z.infer<typeof MaterialEventSchema>;

/**
 * A human-readable trace entry for the Saloon. Only emitted when an observable
 * event occurs — never filler. Each material entry links to evidence, a graph
 * edge, or a record so the UI never has to parse prose to discover state.
 */
export const ActivityKindSchema = z.enum([
  "phase_changed",
  "source_read",
  "relationship_added",
  "claim_created",
  "contradiction_found",
  "risk_changed_action",
  "recommendation_made",
  "paper_trade",
  "note",
]);
export type ActivityKind = z.infer<typeof ActivityKindSchema>;

export const ActivityEventSchema = z.object({
  id: IdSchema,
  /** The committee stage that produced this activity, if any. */
  stage: z.string().optional(),
  kind: ActivityKindSchema,
  message: z.string().min(1),
  at: IsoDateTimeSchema,
  /** Optional links to the record this activity refers to. */
  evidenceIds: z.array(IdSchema).default([]),
  refId: IdSchema.optional(),
});
export type ActivityEvent = z.infer<typeof ActivityEventSchema>;
