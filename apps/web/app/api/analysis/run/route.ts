import { NextResponse } from "next/server";

import { RiskPreferencesSchema } from "@/lib/server/analysis/build-state";
import { startAnalysisRun } from "@/lib/server/analysis/service";
import { NoRecordingError, loadAlpacaSnapshot, resolveRunPlan } from "@/lib/server/analysis/wiring";
import { getServerEnv } from "@/lib/server/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/analysis/run
 *
 * Body: risk preferences only (the committee picks the companies).
 *   { "riskTolerance": "conservative" | "balanced" | "aggressive",
 *     "limits"?: { ...per-limit tightening overrides } }
 *
 * Loads the Alpaca Paper account, runs discovery → fundamentals → allocation →
 * deterministic risk → critique → revision, and STOPS at the human-approval
 * gate. Nothing is traded here. Returns the run id to approve next.
 */
export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = {}; // Empty body = all defaults (balanced).
  }

  const parsed = RiskPreferencesSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid risk preferences.", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const env = getServerEnv();
  try {
    const plan = await resolveRunPlan(env);
    const alpacaSnapshot = await loadAlpacaSnapshot(env);

    const state = await startAnalysisRun({
      riskPreferences: parsed.data,
      runner: plan.runner,
      scenario: plan.scenario,
      alpacaSnapshot,
      label: plan.label,
      ...(plan.instrumentStats ? { instrumentStats: plan.instrumentStats } : {}),
      ...(plan.stressScenarios ? { stressScenarios: plan.stressScenarios } : {}),
    });

    // A deterministic gate (evidence/risk) may have blocked the run — surface it
    // as 422 rather than pretending it's awaiting approval.
    const status = state.phase === "blocked" ? 422 : 201;
    return NextResponse.json(
      { runId: state.run.id, phase: state.phase, state },
      { status },
    );
  } catch (error) {
    if (error instanceof NoRecordingError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Analysis run failed." },
      { status: 500 },
    );
  }
}
