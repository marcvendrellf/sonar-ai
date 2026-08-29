import { describe, expect, it } from "vitest";
import { findDanglingEvidenceIds } from "../integrity";
import { goldenState } from "../__fixtures__/golden-state";

describe("evidence referential integrity", () => {
  it("has no dangling evidence references in the golden state", () => {
    expect(findDanglingEvidenceIds(goldenState)).toEqual([]);
  });

  it("detects an injected dangling reference", () => {
    const broken = structuredClone(goldenState);
    broken.graph.edges[0]!.evidenceIds.push("ev_does_not_exist");
    expect(findDanglingEvidenceIds(broken)).toContain("ev_does_not_exist");
  });
});
