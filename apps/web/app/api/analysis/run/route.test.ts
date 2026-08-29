import { describe, expect, it } from "vitest";
import { POST } from "./route";
import { POST as APPROVE } from "./[runId]/route";

describe("POST /api/analysis/run", () => {
  it("rejects company selection input", async () => {
    const response = await POST(new Request("http://localhost/api/analysis/run", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ companies: ["NVDA"] }),
    }));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ error: expect.stringContaining("Unrecognized key") });
  });

  it("runs offline discovery and requires explicit approval before completion", async () => {
    const response = await POST(new Request("http://localhost/api/analysis/run", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
    }));
    expect(response.status).toBe(201);
    const pending = await response.json();
    expect(pending.phase).toBe("awaiting_approval");
    expect(pending.marketContext.candidateOpportunities.length).toBeGreaterThan(0);

    const approved = await APPROVE(new Request("http://localhost/api/analysis/run/" + pending.run.id, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ decision: { decision: "approved", decidedAt: "2026-08-29T14:05:20Z", note: "Fixture approval" } }),
    }), { params: Promise.resolve({ runId: pending.run.id }) });
    expect(approved.status).toBe(200);
    await expect(approved.json()).resolves.toMatchObject({ phase: "complete", userDecision: { decision: "approved" } });
  });
});
