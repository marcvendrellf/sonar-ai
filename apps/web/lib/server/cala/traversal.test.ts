import { describe, expect, it } from "vitest";
import { FixtureCalaProvider } from "./fixture-provider";
import { traverseCalaGraph, type CalaTraversalInput } from "./traversal";

const baseInput: CalaTraversalInput = {
  rootEntityId: "cala_company_novachip",
  depth: 1,
  directions: ["incoming", "outgoing"],
  relationshipTypes: null,
  perRelationshipLimit: 10,
  maxNodes: 10,
};

describe("traverseCalaGraph", () => {
  it("returns bounded, directed, source-linked fixture relationships", async () => {
    const result = await traverseCalaGraph(
      new FixtureCalaProvider(),
      baseInput,
      () => new Date("2026-08-29T00:00:00Z"),
    );

    expect(result.nodes).toHaveLength(4);
    expect(result.edges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source: "cala_company_lithosupply",
          target: "cala_company_novachip",
          relationshipType: "IS_SUPPLIER_OF",
        }),
      ]),
    );
    expect(result.evidence.length).toBeGreaterThan(0);
    expect(
      result.nodes.some((node) => node.id === "cala_industry_semiconductor_equipment"),
    ).toBe(false);
    expect(result.evidence.every((item) => item.label === "synthetic")).toBe(true);
    expect(
      result.evidence.some((item) =>
        item.title.startsWith("LithoSupply NV IS_SUPPLIER_OF NovaChip Systems"),
      ),
    ).toBe(true);
    expect(result.normalizedGraph.edges.length).toBe(result.edges.length);
    const evidenceIds = new Set(result.evidence.map((item) => item.id));
    expect(
      result.edges.every((edge) => edge.evidenceIds.every((id) => evidenceIds.has(id))),
    ).toBe(true);
  });

  it("does not expand relationships beyond requested depth", async () => {
    const result = await traverseCalaGraph(new FixtureCalaProvider(), {
      ...baseInput,
      depth: 2,
    });

    expect(
      result.nodes.some((node) => node.id === "cala_industry_semiconductor_equipment"),
    ).toBe(true);
  });

  it("marks traversal truncated at the node cap", async () => {
    const result = await traverseCalaGraph(new FixtureCalaProvider(), {
      ...baseInput,
      maxNodes: 2,
    });

    expect(result.nodes).toHaveLength(2);
    expect(result.truncated).toBe(true);
  });
});
