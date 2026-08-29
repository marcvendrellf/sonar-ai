import { describe, expect, it } from "vitest";
import { CalaEntityProfileSchema } from "./schemas";

describe("Cala wire schemas", () => {
  it("normalizes documented nested relationship provenance", () => {
    const profile = CalaEntityProfileSchema.parse({
      id: "company_1",
      name: "Example Corp",
      entity_type: "Company",
      properties: {},
      relationships: {
        incoming: {},
        outgoing: {
          IS_REGISTERED_IN: [
            {
              id: "country_1",
              name: "Exampleland",
              entity_type: "Country",
              properties: {
                valid_since: "2020-01-01",
                sources: [
                  {
                    name: "Registry",
                    date: "2026-08-20",
                    document: "https://example.com/registry",
                  },
                ],
              },
            },
          ],
        },
      },
      numerical_observations: [
        {
          id: "metric_1",
          name: "Revenue",
          type: "FinancialMetric",
          properties: { unit: "USD" },
          data: [
            {
              value: 100,
              time: "2025-12-31T00:00:00Z",
              origin: { name: "10-K", source: "SEC" },
            },
          ],
        },
      ],
    });

    const relationship = profile.relationships.outgoing.IS_REGISTERED_IN?.[0];
    expect(relationship?.valid_since).toBe("2020-01-01");
    expect(relationship?.sources[0]?.name).toBe("Registry");
    expect(profile.numerical_observations[0]?.data?.[0]?.value).toBe(100);
  });
});
