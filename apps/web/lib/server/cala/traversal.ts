import { createHash } from "node:crypto";
import {
  EvidenceSchema,
  RelationshipGraphSchema,
  type Evidence,
  type GraphEdgeRelation,
  type GraphNodeType,
} from "@sonar-ai/core";
import { z } from "zod";
import type { CalaProvider } from "./client";
import type { CalaSource } from "./schemas";

export const CalaTraversalInputSchema = z.object({
  rootEntityId: z.string().min(1),
  depth: z.number().int().min(1).max(3),
  directions: z.array(z.enum(["incoming", "outgoing"])).min(1).max(2),
  relationshipTypes: z.array(z.string().min(1)).nullable(),
  perRelationshipLimit: z.number().int().min(1).max(20),
  maxNodes: z.number().int().min(2).max(50),
});
export type CalaTraversalInput = z.infer<typeof CalaTraversalInputSchema>;

export const CalaTraversalNodeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  entityType: z.string().min(1),
  description: z.string().nullable(),
});

export const CalaTraversalEdgeSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  target: z.string().min(1),
  relationshipType: z.string().min(1),
  directionFromVisitedNode: z.enum(["incoming", "outgoing"]),
  validSince: z.string().nullable(),
  validUntil: z.string().nullable(),
  evidenceIds: z.array(z.string().min(1)).min(1),
});

export const CalaTraversalResultSchema = z.object({
  rootEntityId: z.string().min(1),
  truncated: z.boolean(),
  nodes: z.array(CalaTraversalNodeSchema),
  edges: z.array(CalaTraversalEdgeSchema),
  evidence: z.array(EvidenceSchema),
  normalizedGraph: RelationshipGraphSchema,
});
export type CalaTraversalResult = z.infer<typeof CalaTraversalResultSchema>;

function stableId(prefix: string, value: string): string {
  return `${prefix}_${createHash("sha256").update(value).digest("hex").slice(0, 16)}`;
}

function observedAt(source: CalaSource, fallback: string): string {
  const candidate = source.published_time ?? source.date;
  if (!candidate) return fallback;
  const parsed = new Date(candidate);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed.toISOString();
}

function sourceUrl(source: CalaSource): string | undefined {
  const candidate =
    source.url ?? (typeof source.document === "string" ? source.document : undefined);
  if (!candidate) return undefined;
  try {
    return new URL(candidate).toString();
  } catch {
    return undefined;
  }
}

function normalizedNodeId(id: string): string {
  return `cala_node_${id}`;
}

function normalizedNodeType(entityType: string): GraphNodeType {
  switch (entityType.toLowerCase()) {
    case "company":
      return "company";
    case "person":
      return "person";
    case "corporateevent":
    case "event":
      return "event";
    default:
      return "relationship";
  }
}

function normalizedRelation(relationshipType: string): GraphEdgeRelation {
  const relation = relationshipType.toUpperCase();
  if (relation.includes("SUPPLIER")) return "supplier_of";
  if (relation.includes("CUSTOMER")) return "customer_of";
  if (relation.includes("COMPET")) return "competitor_of";
  if (
    relation.includes("OWNER") ||
    relation.includes("PARENT") ||
    relation.includes("SUBSIDIARY")
  ) {
    return "owner_of";
  }
  if (relation.includes("AFFECT")) return "affects";
  if (relation.includes("EVENT")) return "exposed_to";
  if (relation.includes("INDUSTRY") || relation.includes("REGISTERED")) {
    return "exposed_to";
  }
  return "related_issuer";
}

export async function traverseCalaGraph(
  provider: CalaProvider,
  rawInput: CalaTraversalInput,
  clock: () => Date = () => new Date(),
): Promise<CalaTraversalResult> {
  const input = CalaTraversalInputSchema.parse(rawInput);
  const nodes = new Map<string, z.infer<typeof CalaTraversalNodeSchema>>();
  const edges = new Map<string, z.infer<typeof CalaTraversalEdgeSchema>>();
  const evidence = new Map<string, Evidence>();
  const visited = new Set<string>();
  const queued = new Set<string>([input.rootEntityId]);
  const queue: Array<{ id: string; depth: number }> = [
    { id: input.rootEntityId, depth: 0 },
  ];
  let truncated = false;

  while (queue.length) {
    const current = queue.shift()!;
    queued.delete(current.id);
    if (visited.has(current.id)) continue;
    visited.add(current.id);
    // Endpoints discovered at the requested depth are retained as nodes, but
    // their own relationships are not expanded into an extra hop.
    if (current.depth >= input.depth) continue;

    const introspection = await provider.introspectEntity(current.id);
    const select = (direction: "incoming" | "outgoing") => {
      const available = introspection.relationships[direction];
      return available.filter(
        (type) => !input.relationshipTypes || input.relationshipTypes.includes(type),
      );
    };
    const incoming = input.directions.includes("incoming") ? select("incoming") : [];
    const outgoing = input.directions.includes("outgoing") ? select("outgoing") : [];
    const requestFor = (types: string[]) =>
      Object.fromEntries(
        types.map((type) => [type, { limit: input.perRelationshipLimit }]),
      );
    const profile = await provider.retrieveEntity(current.id, {
      relationships: {
        incoming: requestFor(incoming),
        outgoing: requestFor(outgoing),
      },
    });

    nodes.set(profile.id, {
      id: profile.id,
      name: profile.name,
      entityType: profile.entity_type,
      description: profile.description ?? null,
    });

    for (const direction of input.directions) {
      const groups = profile.relationships[direction];
      for (const [relationshipType, relatedEntities] of Object.entries(groups)) {
        if (input.relationshipTypes && !input.relationshipTypes.includes(relationshipType)) {
          continue;
        }
        for (const related of relatedEntities) {
          if (related.sources.length === 0) continue;
          if (!nodes.has(related.id) && nodes.size >= input.maxNodes) {
            truncated = true;
            continue;
          }
          nodes.set(related.id, {
            id: related.id,
            name: related.name,
            entityType: related.entity_type,
            description: related.description ?? null,
          });
          const sourceId = direction === "outgoing" ? profile.id : related.id;
          const targetId = direction === "outgoing" ? related.id : profile.id;
          const sourceName = direction === "outgoing" ? profile.name : related.name;
          const targetName = direction === "outgoing" ? related.name : profile.name;
          const sources = related.sources;
          const evidenceIds = sources.map((source, index) => {
            const key = JSON.stringify({ sourceId, targetId, relationshipType, source, index });
            const id = stableId("ev_cala", key);
            evidence.set(
              id,
              EvidenceSchema.parse({
                id,
                kind: "cala",
                title: `${sourceName} ${relationshipType} ${targetName}`,
                sourceName: source.name ?? source.source ?? "Cala",
                ...(sourceUrl(source) ? { sourceUrl: sourceUrl(source) } : {}),
                observedAt: observedAt(source, clock().toISOString()),
                label:
                  provider.mode === "fixture"
                    ? "synthetic"
                    : source.published_time || source.date
                      ? "historical"
                      : "live",
                snippet: `Cala relationship ${relationshipType}; direction ${direction}.`,
              }),
            );
            return id;
          });
          const edgeId = stableId(
            "edge_cala",
            `${sourceId}:${relationshipType}:${targetId}`,
          );
          edges.set(edgeId, {
            id: edgeId,
            source: sourceId,
            target: targetId,
            relationshipType,
            directionFromVisitedNode: direction,
            validSince: related.valid_since ?? null,
            validUntil: related.valid_until ?? null,
            evidenceIds,
          });
          if (
            current.depth < input.depth &&
            !visited.has(related.id) &&
            !queued.has(related.id)
          ) {
            queue.push({ id: related.id, depth: current.depth + 1 });
            queued.add(related.id);
          }
        }
      }
    }
  }

  const rawNodes = [...nodes.values()];
  const rawEdges = [...edges.values()];
  const normalizedGraph = RelationshipGraphSchema.parse({
    nodes: rawNodes.map((node) => ({
      id: normalizedNodeId(node.id),
      type: normalizedNodeType(node.entityType),
      label: node.name,
      evidenceIds: rawEdges
        .filter((edge) => edge.source === node.id || edge.target === node.id)
        .flatMap((edge) => edge.evidenceIds),
    })),
    edges: rawEdges.map((edge) => ({
      id: `cala_graph_${edge.id}`,
      source: normalizedNodeId(edge.source),
      target: normalizedNodeId(edge.target),
      relation: normalizedRelation(edge.relationshipType),
      confidence: "EXTRACTED",
      confidenceScore: 1,
      treatment: "known",
      evidenceIds: edge.evidenceIds,
    })),
  });

  return CalaTraversalResultSchema.parse({
    rootEntityId: input.rootEntityId,
    truncated,
    nodes: rawNodes,
    edges: rawEdges,
    evidence: [...evidence.values()],
    normalizedGraph,
  });
}
