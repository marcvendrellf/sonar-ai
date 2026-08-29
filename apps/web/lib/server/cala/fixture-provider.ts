import {
  CalaEntityIntrospectionSchema,
  CalaEntityProfileSchema,
  type CalaEntityIntrospection,
  type CalaEntityProfile,
  type CalaEntitySummary,
  type CalaKnowledgeQueryResponse,
  type CalaKnowledgeSearchResponse,
} from "./schemas";
import type { CalaEntityRetrievalRequest, CalaProvider } from "./client";

const source = {
  name: "Sonar sanitized Cala fixture",
  url: "https://docs.cala.ai/",
  published_time: "2026-08-29T00:00:00Z",
};

const profiles = [
  {
    id: "cala_company_novachip",
    name: "NovaChip Systems",
    entity_type: "Company",
    description: "Synthetic semiconductor issuer used by Sonar offline replay.",
    properties: {
      industry: { value: "Semiconductors", sources: [source] },
      headquarters_country: { value: "Netherlands", sources: [source] },
    },
    relationships: {
      incoming: {
        IS_SUPPLIER_OF: [
          {
            id: "cala_company_lithosupply",
            name: "LithoSupply NV",
            entity_type: "Company",
            properties: { sources: [source] },
          },
        ],
      },
      outgoing: {
        OPERATES_IN_INDUSTRY: [
          {
            id: "cala_industry_semiconductors",
            name: "Semiconductors",
            entity_type: "Industry",
            properties: { sources: [source] },
          },
        ],
        PARTICIPATES_IN_CORPORATE_EVENT: [
          {
            id: "cala_event_export_controls",
            name: "Advanced-chip export controls",
            entity_type: "CorporateEvent",
            properties: { sources: [source] },
          },
        ],
      },
    },
    numerical_observations: [
      {
        id: "metric_novachip_revenue",
        name: "Revenue",
        type: "FinancialMetric",
        properties: { unit: "USD", cadence: "a" },
        data: [{ value: 18400000000, time: "2025-12-31T00:00:00Z", origin: source }],
      },
      {
        id: "metric_novachip_operating_margin",
        name: "Operating Margin",
        type: "FinancialMetric",
        properties: { unit: "ratio", cadence: "a" },
        data: [{ value: 0.27, time: "2025-12-31T00:00:00Z", origin: source }],
      },
    ],
  },
  {
    id: "cala_company_lithosupply",
    name: "LithoSupply NV",
    entity_type: "Company",
    description: "Synthetic upstream equipment supplier.",
    properties: { industry: { value: "Semiconductor Equipment", sources: [source] } },
    relationships: {
      incoming: {},
      outgoing: {
        IS_SUPPLIER_OF: [
          {
            id: "cala_company_novachip",
            name: "NovaChip Systems",
            entity_type: "Company",
            properties: { sources: [source] },
          },
        ],
        OPERATES_IN_INDUSTRY: [
          {
            id: "cala_industry_semiconductor_equipment",
            name: "Semiconductor Equipment",
            entity_type: "Industry",
            properties: { sources: [source] },
          },
        ],
      },
    },
    numerical_observations: [
      {
        id: "metric_lithosupply_revenue_growth",
        name: "Revenue Growth",
        type: "FinancialMetric",
        properties: { unit: "ratio", cadence: "a" },
        data: [{ value: 0.18, time: "2025-12-31T00:00:00Z", origin: source }],
      },
    ],
  },
  {
    id: "cala_industry_semiconductors",
    name: "Semiconductors",
    entity_type: "Industry",
    description: "Synthetic industry node.",
    properties: {},
    relationships: { incoming: {}, outgoing: {} },
    numerical_observations: [],
  },
  {
    id: "cala_industry_semiconductor_equipment",
    name: "Semiconductor Equipment",
    entity_type: "Industry",
    description: "Synthetic upstream equipment industry node.",
    properties: {},
    relationships: { incoming: {}, outgoing: {} },
    numerical_observations: [],
  },
  {
    id: "cala_event_export_controls",
    name: "Advanced-chip export controls",
    entity_type: "CorporateEvent",
    description: "Synthetic policy event affecting advanced semiconductor sales.",
    properties: { event_status: { value: "active", sources: [source] } },
    relationships: { incoming: {}, outgoing: {} },
    numerical_observations: [],
  },
].map((profile) => CalaEntityProfileSchema.parse(profile));

const profileById = new Map(profiles.map((profile) => [profile.id, profile]));

export class FixtureCalaProvider implements CalaProvider {
  readonly mode = "fixture" as const;

  async query(query: string): Promise<CalaKnowledgeQueryResponse> {
    const entities = this.matchEntities(query, [], 10);
    return {
      entities,
      results: profiles
        .filter((profile) => entities.some((entity) => entity.id === profile.id))
        .flatMap((profile) =>
          profile.numerical_observations.map((observation) => ({
            entity_id: profile.id,
            entity_name: profile.name,
            ...observation,
          })),
        ),
    };
  }

  async search(query: string): Promise<CalaKnowledgeSearchResponse> {
    const entities = this.matchEntities(query, [], 10);
    return {
      content:
        "Offline synthetic replay: NovaChip has upstream equipment exposure through LithoSupply and policy exposure through advanced-chip export controls.",
      context: [
        {
          id: "fixture_cala_context_1",
          content: "Synthetic relationship chain for deterministic demo replay.",
        },
      ],
      entities,
      explainability: [],
    };
  }

  async findEntities(
    name: string,
    entityTypes: string[],
    limit: number,
  ): Promise<CalaEntitySummary[]> {
    return this.matchEntities(name, entityTypes, limit);
  }

  async introspectEntity(id: string): Promise<CalaEntityIntrospection> {
    const profile = this.requireProfile(id);
    return CalaEntityIntrospectionSchema.parse({
      properties: Object.keys(profile.properties),
      relationships: {
        incoming: Object.keys(profile.relationships.incoming),
        outgoing: Object.keys(profile.relationships.outgoing),
      },
      numerical_observations: {
        FinancialMetric: profile.numerical_observations
          .filter((item) => item.id && item.name)
          .map((item) => ({ id: item.id!, name: item.name! })),
      },
    });
  }

  async retrieveEntity(
    id: string,
    request: CalaEntityRetrievalRequest,
  ): Promise<CalaEntityProfile> {
    const profile = this.requireProfile(id);
    const filterRelations = (
      values: CalaEntityProfile["relationships"]["incoming"],
      selection: Record<string, { limit: number; offset?: number }> | undefined,
    ) =>
      Object.fromEntries(
        Object.entries(values)
          .filter(([type]) => !selection || type in selection)
          .map(([type, related]) => {
            const range = selection?.[type];
            const offset = range?.offset ?? 0;
            return [type, related.slice(offset, offset + (range?.limit ?? related.length))];
          }),
      );

    return CalaEntityProfileSchema.parse({
      ...profile,
      properties: request.properties
        ? Object.fromEntries(
            Object.entries(profile.properties).filter(([key]) =>
              request.properties?.includes(key),
            ),
          )
        : profile.properties,
      relationships: {
        incoming: filterRelations(
          profile.relationships.incoming,
          request.relationships?.incoming,
        ),
        outgoing: filterRelations(
          profile.relationships.outgoing,
          request.relationships?.outgoing,
        ),
      },
      numerical_observations: request.numerical_observations
        ? profile.numerical_observations.filter((item) =>
            Object.values(request.numerical_observations!).some((ids) =>
              item.id ? ids.includes(item.id) : false,
            ),
          )
        : profile.numerical_observations,
    });
  }

  private matchEntities(name: string, entityTypes: string[], limit: number) {
    const terms = name.toLowerCase().split(/\s+/).filter((term) => term.length > 2);
    const matches = profiles.filter((profile) => {
      const typeMatch =
        entityTypes.length === 0 || entityTypes.includes(profile.entity_type);
      const haystack = `${profile.name} ${profile.description ?? ""}`.toLowerCase();
      return typeMatch && (terms.length === 0 || terms.some((term) => haystack.includes(term)));
    });
    return matches.slice(0, limit).map((profile) => ({
      id: profile.id,
      name: profile.name,
      entity_type: profile.entity_type,
      description: profile.description,
    }));
  }

  private requireProfile(id: string): CalaEntityProfile {
    const profile = profileById.get(id);
    if (!profile) throw new Error(`Cala fixture has no entity "${id}".`);
    return profile;
  }
}
