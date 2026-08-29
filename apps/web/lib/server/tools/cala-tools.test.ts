import { describe, expect, it } from "vitest";
import { FixtureCalaProvider } from "../cala/fixture-provider";
import { createCalaTools } from "./cala-tools";
import { requireTool } from "./types";

describe("Cala tools", () => {
  it("discovers metric IDs and returns source-linked fundamentals", async () => {
    const tool = requireTool(
      createCalaTools(new FixtureCalaProvider()),
      "get_company_fundamentals",
    );
    const output = tool.outputSchema.parse(
      await tool.execute(
        {
          companyName: "NovaChip",
          entityId: null,
          maxMetrics: 10,
        },
        { offline: true },
      ),
    ) as { data: { numerical_observations: unknown[] }; evidence: Array<{ id: string; sourceUrl?: string }> };

    expect(output.data.numerical_observations).toHaveLength(2);
    expect(output.evidence.length).toBeGreaterThanOrEqual(2);
    expect(output.evidence.every((item) => item.id.startsWith("ev_cala_"))).toBe(true);
    expect(output.evidence.some((item) => item.sourceUrl === "https://docs.cala.ai/")).toBe(true);
  });

  it("returns no false entity match and accepts empty traversal evidence", async () => {
    const tools = createCalaTools(new FixtureCalaProvider());
    const fundamentals = requireTool(tools, "get_company_fundamentals");
    await expect(
      fundamentals.execute(
        { companyName: "Unknown Public Company", entityId: null, maxMetrics: 10 },
        { offline: true },
      ),
    ).rejects.toThrow('Cala found no company named "Unknown Public Company".');

    const traversal = requireTool(tools, "traverse_cala_relationships");
    const output = await traversal.execute(
      {
        rootEntityId: "cala_event_export_controls",
        depth: 1,
        directions: ["incoming", "outgoing"],
        relationshipTypes: null,
        perRelationshipLimit: 10,
        maxNodes: 10,
      },
      { offline: true },
    );
    expect(() => traversal.outputSchema.parse(output)).not.toThrow();
    expect((output as { evidence: unknown[] }).evidence).toEqual([]);
  });
});
