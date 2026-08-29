import { z } from "zod";

const DynamicRecordSchema = z.record(z.string(), z.unknown());

export const CalaSourceSchema = z
  .object({
    name: z.string().optional(),
    source: z.string().optional(),
    url: z.string().url().optional(),
    published_time: z.string().optional(),
    date: z.string().optional(),
    document: z.union([z.string(), DynamicRecordSchema]).optional(),
  })
  .passthrough();
export type CalaSource = z.infer<typeof CalaSourceSchema>;

export const CalaEntitySummarySchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    entity_type: z.string().min(1),
    description: z.string().nullish(),
  })
  .passthrough();
export type CalaEntitySummary = z.infer<typeof CalaEntitySummarySchema>;

export const CalaRelationshipValueSchema = CalaEntitySummarySchema.extend({
  valid_since: z.string().nullish(),
  valid_until: z.string().nullish(),
  sources: z.array(CalaSourceSchema).optional(),
  properties: z
    .object({
      valid_since: z.string().nullish(),
      valid_until: z.string().nullish(),
      sources: z.array(CalaSourceSchema).default([]),
    })
    .passthrough()
    .optional(),
})
  .passthrough()
  .transform((value) => ({
    ...value,
    valid_since: value.valid_since ?? value.properties?.valid_since ?? null,
    valid_until: value.valid_until ?? value.properties?.valid_until ?? null,
    sources: value.sources ?? value.properties?.sources ?? [],
  }));
export type CalaRelationshipValue = z.infer<typeof CalaRelationshipValueSchema>;

export const CalaPropertyValueSchema = z
  .object({
    value: z.unknown().optional(),
    sources: z.array(CalaSourceSchema).default([]),
  })
  .passthrough();

export const CalaNumericalObservationSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().optional(),
    type: z.string().optional(),
    value: z.union([z.number(), z.string()]).optional(),
    unit: z.string().nullish(),
    currency: z.string().nullish(),
    time: z.string().nullish(),
    period: z.string().nullish(),
    origin: CalaSourceSchema.optional(),
    sources: z.array(CalaSourceSchema).optional(),
    properties: DynamicRecordSchema.optional(),
    data: z
      .array(
        z
          .object({
            origin: CalaSourceSchema.optional(),
            time: z.string().nullish(),
            value: z.union([z.number(), z.string()]).optional(),
          })
          .passthrough(),
      )
      .optional(),
  })
  .passthrough();
export type CalaNumericalObservation = z.infer<
  typeof CalaNumericalObservationSchema
>;

export const CalaNumericalObservationDefinitionSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
  })
  .passthrough();

export const CalaEntityIntrospectionSchema = z
  .object({
    properties: z.array(z.string()).default([]),
    relationships: z
      .object({
        incoming: z.array(z.string()).default([]),
        outgoing: z.array(z.string()).default([]),
      })
      .default({ incoming: [], outgoing: [] }),
    numerical_observations: z
      .record(z.string(), z.array(CalaNumericalObservationDefinitionSchema))
      .default({}),
  })
  .passthrough();
export type CalaEntityIntrospection = z.infer<
  typeof CalaEntityIntrospectionSchema
>;

export const CalaEntityProfileSchema = CalaEntitySummarySchema.extend({
  properties: z.record(z.string(), CalaPropertyValueSchema).default({}),
  relationships: z
    .object({
      incoming: z
        .record(z.string(), z.array(CalaRelationshipValueSchema))
        .default({}),
      outgoing: z
        .record(z.string(), z.array(CalaRelationshipValueSchema))
        .default({}),
    })
    .default({ incoming: {}, outgoing: {} }),
  numerical_observations: z.array(CalaNumericalObservationSchema).default([]),
}).passthrough();
export type CalaEntityProfile = z.infer<typeof CalaEntityProfileSchema>;

export const CalaEntitySearchResponseSchema = z.union([
  z.array(CalaEntitySummarySchema),
  z.object({ entities: z.array(CalaEntitySummarySchema).default([]) }).passthrough(),
]);

export const CalaKnowledgeQueryResponseSchema = z
  .object({
    entities: z.array(CalaEntitySummarySchema).default([]),
    results: z.array(DynamicRecordSchema).default([]),
  })
  .passthrough();
export type CalaKnowledgeQueryResponse = z.infer<
  typeof CalaKnowledgeQueryResponseSchema
>;

export const CalaKnowledgeSearchResponseSchema = z
  .object({
    content: z.string().default(""),
    context: z
      .array(
        z
          .object({ id: z.string().min(1), content: z.string() })
          .passthrough(),
      )
      .default([]),
    entities: z.array(CalaEntitySummarySchema).nullish(),
    explainability: z.array(DynamicRecordSchema).default([]),
  })
  .passthrough();
export type CalaKnowledgeSearchResponse = z.infer<
  typeof CalaKnowledgeSearchResponseSchema
>;
