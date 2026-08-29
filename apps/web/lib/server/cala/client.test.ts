import { describe, expect, it, vi } from "vitest";
import { CalaClient } from "./client";

describe("CalaClient", () => {
  it("uses fixed Cala API host, X-API-KEY, and validates entity search", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify([
          { id: "company_1", name: "Example Corp", entity_type: "Company" },
        ]),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    const client = new CalaClient({ apiKey: "secret", timeoutMs: 1000, fetchImpl });

    await expect(client.findEntities("Example", ["Company"], 5)).resolves.toEqual([
      expect.objectContaining({ id: "company_1", name: "Example Corp" }),
    ]);
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://api.cala.ai/v1/entities?name=Example&limit=5&entity_types=Company",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({ "X-API-KEY": "secret" }),
      }),
    );
  });

  it("does not leak provider response bodies in errors", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response("private provider detail", { status: 401 }),
    );
    const client = new CalaClient({ apiKey: "secret", timeoutMs: 1000, fetchImpl });

    await expect(client.query("revenue")).rejects.toThrow(
      "Cala API request failed with status 401.",
    );
  });

  it("sends numerical observation IDs grouped by Cala entity type", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "company_1",
          name: "Example Corp",
          entity_type: "Company",
          numerical_observations: [],
          properties: {},
          relationships: { incoming: {}, outgoing: {} },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    const client = new CalaClient({ apiKey: "secret", timeoutMs: 1000, fetchImpl });

    await client.retrieveEntity("company_1", {
      numerical_observations: { FinancialMetric: ["metric_1", "metric_2"] },
    });

    const request = fetchImpl.mock.calls[0]?.[1] as RequestInit;
    expect(JSON.parse(String(request.body))).toEqual({
      numerical_observations: { FinancialMetric: ["metric_1", "metric_2"] },
    });
  });
});
