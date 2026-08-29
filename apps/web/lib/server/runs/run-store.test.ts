import type { InvestmentCommitteeState } from "@sonar-ai/core";
import { describe, expect, it } from "vitest";

import { goldenState } from "../../../../../packages/core/src/__fixtures__/golden-state";
import { InMemoryRunStore } from "./run-store";

function entry(id: string) {
  const state = structuredClone(goldenState) as InvestmentCommitteeState;
  state.run = { ...state.run, id };
  return { state, updatedAt: "2026-08-29T15:00:00Z" };
}

describe("InMemoryRunStore", () => {
  it("saves and retrieves by run id", () => {
    const store = new InMemoryRunStore();
    store.save(entry("run_a"));
    expect(store.get("run_a")?.state.run.id).toBe("run_a");
    expect(store.get("missing")).toBeUndefined();
  });

  it("overwrites an existing run and lists all", () => {
    const store = new InMemoryRunStore();
    store.save(entry("run_a"));
    store.save(entry("run_b"));
    store.save({ ...entry("run_a"), updatedAt: "2026-08-29T16:00:00Z" });
    expect(store.list()).toHaveLength(2);
    expect(store.get("run_a")?.updatedAt).toBe("2026-08-29T16:00:00Z");
  });

  it("clears", () => {
    const store = new InMemoryRunStore();
    store.save(entry("run_a"));
    store.clear();
    expect(store.list()).toEqual([]);
  });
});
