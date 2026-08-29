import { z } from "zod";
import {
  ConfidenceSchema,
  ConfidenceScoreSchema,
  DataLabelSchema,
  IdSchema,
  IsoDateTimeSchema,
} from "./primitives";

/**
 * A single source-linked fact. Every material graph edge and thesis claim must
 * resolve to one or more of these. The model produces hypotheses and
 * explanations; it never invents the underlying evidence.
 */
export const EvidenceSchema = z.object({
  id: IdSchema,
  kind: z.enum(["cala", "alpaca", "news", "filing", "market", "derived"]),
  title: z.string().min(1),
  sourceName: z.string().min(1),
  sourceUrl: z.url().optional(),
  /** When the underlying fact was observed/valid, per its source. */
  observedAt: IsoDateTimeSchema,
  label: DataLabelSchema,
  /** Optional short excerpt. Never a full copyrighted document. */
  snippet: z.string().optional(),
});
export type Evidence = z.infer<typeof EvidenceSchema>;

/**
 * A claim asserted by an agent. Invalid until every listed evidence ID resolves
 * to a known {@link Evidence} record (enforced by the orchestrator's evidence
 * gate, not by this schema alone).
 */
export const ClaimSchema = z.object({
  id: IdSchema,
  statement: z.string().min(1),
  stance: z.enum(["bull", "bear", "neutral", "context"]).default("neutral"),
  evidenceIds: z.array(IdSchema).min(1),
});
export type Claim = z.infer<typeof ClaimSchema>;

// ── Relationship graph ──────────────────────────────────────────────────────

export const GraphNodeTypeSchema = z.enum([
  "event",
  "company",
  "person",
  "relationship",
  "position",
]);
export type GraphNodeType = z.infer<typeof GraphNodeTypeSchema>;

export const GraphNodeSchema = z.object({
  id: IdSchema,
  type: GraphNodeTypeSchema,
  label: z.string().min(1),
  /** Present when the node is (or maps to) a tradable instrument. */
  instrumentId: IdSchema.optional(),
  evidenceIds: z.array(IdSchema).default([]),
});
export type GraphNode = z.infer<typeof GraphNodeSchema>;

export const GraphEdgeRelationSchema = z.enum([
  "owner_of",
  "supplier_of",
  "customer_of",
  "competitor_of",
  "related_issuer",
  "exposed_to",
  "affects",
]);
export type GraphEdgeRelation = z.infer<typeof GraphEdgeRelationSchema>;

/** Visual treatment of an edge, derived from its role in the current path. */
export const GraphEdgeTreatmentSchema = z.enum(["known", "active", "uncertain"]);
export type GraphEdgeTreatment = z.infer<typeof GraphEdgeTreatmentSchema>;

/**
 * A directed relationship between two graph nodes. Material edges must carry at
 * least one evidence ID — relationships are evidence, never proof of causation.
 */
export const GraphEdgeSchema = z.object({
  id: IdSchema,
  source: IdSchema,
  target: IdSchema,
  relation: GraphEdgeRelationSchema,
  confidence: ConfidenceSchema,
  confidenceScore: ConfidenceScoreSchema,
  treatment: GraphEdgeTreatmentSchema.default("known"),
  evidenceIds: z.array(IdSchema).min(1),
});
export type GraphEdge = z.infer<typeof GraphEdgeSchema>;

export const RelationshipGraphSchema = z.object({
  nodes: z.array(GraphNodeSchema),
  edges: z.array(GraphEdgeSchema),
});
export type RelationshipGraph = z.infer<typeof RelationshipGraphSchema>;
