import { NextResponse } from "next/server";

import { RiskPreferencesSchema } from "@/lib/server/analysis/build-state";
import { startAnalysisRun } from "@/lib/server/analysis/service";
import { NoRecordingError, loadAlpacaSnapshot, resolveRunPlan } from "@/lib/server/analysis/wiring";
import { getServerEnv } from "@/lib/server/env";
import { createInitialState, createRunner } from "@/lib/server/runs/runtime";
import { getLatestRun, saveRun } from "@/lib/server/runs/store";

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
      {
        error: parsed.error.issues.map((issue) => issue.message).join("; "),
        issues: parsed.error.issues,
      },
      { status: 400 },
    );
  }

  const env = getServerEnv();
  try {
    let state;
    try {
      const plan = await resolveRunPlan(env);
      const alpacaSnapshot = await loadAlpacaSnapshot(env);
      state = await startAnalysisRun({
        riskPreferences: parsed.data,
        runner: plan.runner,
        scenario: plan.scenario,
        alpacaSnapshot,
        label: plan.label,
        ...(plan.instrumentStats ? { instrumentStats: plan.instrumentStats } : {}),
        ...(plan.stressScenarios ? { stressScenarios: plan.stressScenarios } : {}),
      });
    } catch (error) {
      if (!(error instanceof NoRecordingError)) throw error;

      // Keep offline demo startup deterministic even before a model recording
      // exists. A recording, when present, still remains the preferred replay.
      const scenario = await createInitialState(env);
      state = await startAnalysisRun({
        riskPreferences: parsed.data,
        runner: createRunner(env),
        scenario,
        label: scenario.run.label,
        instrumentStats: {
          inst_nvidia: { volatility: 0.2, beta: 1.4 },
          inst_siemens: { volatility: 0.1, beta: 0.9 },
        },
        stressScenarios: [{ name: "AI capex slowdown", marketShock: -0.2 }],
      });
    }

    // Keep existing dashboard/read clients compatible while they migrate to
    // the run store used by the new approval endpoint.
    saveRun(state);

    // A deterministic gate (evidence/risk) may have blocked the run — surface it
    // as 422 rather than pretending it's awaiting approval.
    const status = state.phase === "blocked" ? 422 : 201;
    return NextResponse.json(
      { ...state, runId: state.run.id, phase: state.phase, state },
      { status },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Analysis run failed." },
      { status: 500 },
    );
  }
}

export async function GET(): Promise<Response> {
  const state = getLatestRun();
  return state
    ? NextResponse.json(state)
    : NextResponse.json({ error: "No analysis run exists" }, { status: 404 });
}
