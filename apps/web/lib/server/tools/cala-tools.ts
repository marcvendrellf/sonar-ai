import { createHash } from "node:crypto";
import { EvidenceSchema, type Evidence } from "@sonar-ai/core";
import { z, type ZodType } from "zod";
import type { CalaProvider } from "../cala/client";
import {
  CalaEntityIntrospectionSchema,
  CalaEntityProfileSchema,
  CalaEntitySummarySchema,
  CalaKnowledgeQueryResponseSchema,
  CalaKnowledgeSearchResponseSchema,
  type CalaEntityProfile,
  type CalaSource,
} from "../cala/schemas";
import {
  CalaTraversalInputSchema,
  CalaTraversalResultSchema,
  traverseCalaGraph,
} from "../cala/traversal";
import { defineTool, type ToolRegistry } from "./types";

const FindEntitiesInputSchema = z.object({
  name: z.string().min(1),
  entityTypes: z.array(z.string().min(1)),
  limit: z.number().int().min(1).max(25),
});

const InspectEntityInputSchema = z.object({
  entityId: z.string().min(1),
  metricNameContains: z.string().min(1).nullable(),
  metricOffset: z.number().int().min(0).max(10000),
  maxMetricDefinitions: z.number().int().min(1).max(100),
});

const EntityProfileInputSchema = z.object({
  entityId: z.string().min(1),
  properties: z.array(z.string().min(1)).nullable(),
  incomingRelationshipTypes: z.array(z.string().min(1)).nullable(),
  outgoingRelationshipTypes: z.array(z.string().min(1)).nullable(),
  numericalObservationIds: z.array(z.string().min(1)).nullable(),
  perFieldLimit: z.number().int().min(1).max(50),
});

const QueryInputSchema = z.object({ query: z.string().min(3).max(4000) });

const FundamentalsInputSchema = z.object({
  companyName: z.string().min(1),
  entityId: z.string().min(1).nullable(),
  maxMetrics: z.number().int().min(1).max(50),
});

function selectedFields(
  available: string[],
  selected: string[] | null,
  limit: number,
) {
  const fields = selected ?? available;
  return Object.fromEntries(fields.map((field) => [field, { limit }]));
}

function selectedNumericalObservations(
  available: Record<string, Array<{ id: string }>>,
  selectedIds: string[] | null,
  maxMetrics: number,
): Record<string, string[]> {
  const selected = selectedIds ? new Set(selectedIds) : null;
  let remaining = maxMetrics;
  const result: Record<string, string[]> = {};
  for (const [type, definitions] of Object.entries(available)) {
    const ids = definitions
      .map((definition) => definition.id)
      .filter((id) => !selected || selected.has(id))
      .slice(0, remaining);
    if (ids.length) result[type] = ids;
    remaining -= ids.length;
    if (remaining === 0) break;
  }
  return result;
}

function filteredIntrospection(
  introspection: Awaited<ReturnType<CalaProvider["introspectEntity"]>>,
  nameContains: string | null,
  offset: number,
  maxDefinitions: number,
) {
  const needle = nameContains?.toLowerCase();
  const flattened = Object.entries(introspection.numerical_observations).flatMap(
    ([type, definitions]) =>
      definitions
        .filter((definition) =>
          needle ? definition.name.toLowerCase().includes(needle) : true,
        )
        .map((definition) => ({ type, definition })),
  );
  const page = flattened.slice(offset, offset + maxDefinitions);
  const numerical_observations: typeof introspection.numerical_observations = {};
  for (const { type, definition } of page) {
    (numerical_observations[type] ??= []).push(definition);
  }
  return { ...introspection, numerical_observations };
}

function envelope<T>(schema: ZodType<T>) {
  return z.object({ data: schema, evidence: z.array(EvidenceSchema) });
}

function sourceEvidence(
  provider: CalaProvider,
  title: string,
  snippet: string,
  source: CalaSource,
): Evidence {
  const rawDate = source.published_time ?? source.date;
  const parsedDate = rawDate ? new Date(rawDate) : null;
  const observedAt =
    parsedDate && !Number.isNaN(parsedDate.getTime())
      ? parsedDate.toISOString()
      : provider.mode === "fixture"
        ? "2026-08-29T00:00:00.000Z"
        : new Date().toISOString();
  const documentUrl = typeof source.document === "string" ? source.document : null;
  const candidateUrl = source.url ?? documentUrl;
  let sourceUrl: string | undefined;
  if (candidateUrl) {
    try {
      sourceUrl = new URL(candidateUrl).toString();
    } catch {
      sourceUrl = undefined;
    }
  }
  const id = `ev_cala_${createHash("sha256")
    .update(JSON.stringify({ title, snippet, source, observedAt }))
    .digest("hex")
    .slice(0, 16)}`;
  return EvidenceSchema.parse({
    id,
    kind: "cala",
    title,
    sourceName: source.name ?? source.source ?? "Cala",
    ...(sourceUrl ? { sourceUrl } : {}),
    observedAt,
    label:
      provider.mode === "fixture"
        ? "synthetic"
        : source.published_time || source.date
          ? "historical"
          : "live",
    snippet: snippet.slice(0, 300),
  });
}

function profileEvidence(
  provider: CalaProvider,
  profile: CalaEntityProfile,
): Evidence[] {
  const evidence: Evidence[] = [];
  for (const [property, value] of Object.entries(profile.properties)) {
    for (const source of value.sources) {
      evidence.push(
        sourceEvidence(
          provider,
          `${profile.name}: ${property}`,
          `${property} = ${JSON.stringify(value.value)}`,
          source,
        ),
      );
    }
  }
  for (const metric of profile.numerical_observations) {
    if (metric.data?.length) {
      for (const point of metric.data) {
        if (!point.origin) continue;
        evidence.push(
          sourceEvidence(
            provider,
            `${profile.name}: ${metric.name ?? metric.id ?? "metric"}`,
            `value ${String(point.value)} at ${point.time ?? "unknown time"}`,
            point.origin,
          ),
        );
      }
    } else if (metric.origin) {
      evidence.push(
        sourceEvidence(
          provider,
          `${profile.name}: ${metric.name ?? metric.id ?? "metric"}`,
          `value ${String(metric.value)} at ${metric.time ?? metric.period ?? "unknown time"}`,
          metric.origin,
        ),
      );
    }
  }
  for (const direction of ["incoming", "outgoing"] as const) {
    for (const [relationshipType, relatedEntities] of Object.entries(
      profile.relationships[direction],
    )) {
      for (const related of relatedEntities) {
        for (const source of related.sources) {
          evidence.push(
            sourceEvidence(
              provider,
              `${profile.name}: ${relationshipType} ${related.name}`,
              `${direction} Cala relationship ${relationshipType}.`,
              source,
            ),
          );
        }
      }
    }
  }
  return [...new Map(evidence.map((item) => [item.id, item])).values()];
}

function result<T>(data: T, evidence: Evidence[]) {
  return { data, evidence };
}

export function createCalaTools(provider: CalaProvider): ToolRegistry {
  return {
    find_cala_entities: defineTool({
      name: "find_cala_entities",
      description:
        "Resolve Cala entity IDs by name. Use before introspection, profile retrieval, or graph traversal. entityTypes may be empty; limit is 1-25.",
      inputSchema: FindEntitiesInputSchema,
      outputSchema: envelope(z.array(CalaEntitySummarySchema)),
      execute: async (input) =>
        result(
          await provider.findEntities(input.name, input.entityTypes, input.limit),
          [],
        ),
    }),
    inspect_cala_entity: defineTool({
      name: "inspect_cala_entity",
      description:
        "List every property and relationship type Cala exposes for one entity plus a paged metric-definition catalog. Narrow with metricNameContains; use metricOffset and maxMetricDefinitions to inspect further pages.",
      inputSchema: InspectEntityInputSchema,
      outputSchema: envelope(CalaEntityIntrospectionSchema),
      execute: async ({ entityId, metricNameContains, metricOffset, maxMetricDefinitions }) =>
        result(filteredIntrospection(
          await provider.introspectEntity(entityId),
          metricNameContains,
          metricOffset,
          maxMetricDefinitions,
        ), []),
    }),
    get_cala_entity_profile: defineTool({
      name: "get_cala_entity_profile",
      description:
        "Retrieve selected Cala properties, incoming/outgoing relationships, and numerical observations for one entity. numericalObservationIds come from introspection; null selections mean all discovered fields up to perFieldLimit.",
      inputSchema: EntityProfileInputSchema,
      outputSchema: envelope(CalaEntityProfileSchema),
      execute: async (input) => {
        const introspection = await provider.introspectEntity(input.entityId);
        const data = await provider.retrieveEntity(input.entityId, {
          properties: input.properties ?? introspection.properties,
          relationships: {
            incoming: selectedFields(
              introspection.relationships.incoming,
              input.incomingRelationshipTypes,
              input.perFieldLimit,
            ),
            outgoing: selectedFields(
              introspection.relationships.outgoing,
              input.outgoingRelationshipTypes,
              input.perFieldLimit,
            ),
          },
          numerical_observations: selectedNumericalObservations(
            introspection.numerical_observations,
            input.numericalObservationIds,
            input.perFieldLimit,
          ),
        });
        const evidence = profileEvidence(provider, data);
        return result(data, evidence);
      },
    }),
    traverse_cala_relationships: defineTool({
      name: "traverse_cala_relationships",
      description:
        "Run bounded breadth-first traversal over Cala relationships. Returns source-linked nodes and directed edges. Use relationshipTypes null to inspect all available types; depth max 3 and maxNodes max 50.",
      inputSchema: CalaTraversalInputSchema,
      outputSchema: envelope(CalaTraversalResultSchema),
      execute: async (input) => {
        const data = await traverseCalaGraph(provider, input);
        return result(data, data.evidence);
      },
    }),
    query_financial_knowledge: defineTool({
      name: "query_financial_knowledge",
      description:
        "Query Cala structured financial knowledge for dynamic rows and resolved entities. Use for discovery and comparisons; verify material claims with profile or traversal tools whose evidence records link underlying sources.",
      inputSchema: QueryInputSchema,
      outputSchema: envelope(CalaKnowledgeQueryResponseSchema),
      execute: async ({ query }) =>
        result(await provider.query(query), []),
    }),
    search_company_information: defineTool({
      name: "search_company_information",
      description:
        "Search Cala for narrative context and explainability. Use for discovery; verify material facts and relationships with profile/traversal tools whose evidence records link underlying sources.",
      inputSchema: QueryInputSchema,
      outputSchema: envelope(CalaKnowledgeSearchResponseSchema),
      execute: async ({ query }) =>
        result(await provider.search(query), []),
    }),
    get_company_fundamentals: defineTool({
      name: "get_company_fundamentals",
      description:
        "Resolve a company and retrieve Cala-discoverable company properties and up to maxMetrics numerical metrics. Pass entityId when already resolved; otherwise pass null. Includes source metadata where Cala provides it.",
      inputSchema: FundamentalsInputSchema,
      outputSchema: envelope(CalaEntityProfileSchema),
      execute: async (input) => {
        const entityId =
          input.entityId ??
          (
            await provider.findEntities(input.companyName, ["Company"], 1)
          )[0]?.id;
        if (!entityId) throw new Error(`Cala found no company named "${input.companyName}".`);
        const introspection = await provider.introspectEntity(entityId);
        const data = await provider.retrieveEntity(entityId, {
          properties: introspection.properties,
          numerical_observations: selectedNumericalObservations(
            introspection.numerical_observations,
            null,
            input.maxMetrics,
          ),
        });
        const evidence = profileEvidence(provider, data);
        return result(data, evidence);
      },
    }),
  };
}
