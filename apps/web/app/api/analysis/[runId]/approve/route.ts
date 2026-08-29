import { NextResponse } from "next/server";
import { z } from "zod";

import {
  RunConflictError,
  RunNotFoundError,
  approveAnalysisRun,
} from "@/lib/server/analysis/service";
import { resolveAlpacaExecutor, resolveRunPlan } from "@/lib/server/analysis/wiring";
import { getServerEnv } from "@/lib/server/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ApproveBodySchema = z.object({
  decision: z.enum(["approved", "rejected"]),
  decidedBy: z.string().min(1).optional(),
  note: z.string().max(2000).optional(),
});

/**
 * POST /api/analysis/:runId/approve
 *
 * Body: { "decision": "approved" | "rejected", "decidedBy"?, "note"? }
 *
 * Requires explicit human approval. Re-runs the deterministic risk checks on the
 * exact actions being approved (a hard block refuses the approval), then, on
 * approval, submits the orders to Alpaca Paper (live) or the internal ledger
 * (offline), and returns the decision receipt with any Alpaca order ids.
 */
export async function POST(
  request: Request,
  ctx: { params: Promise<{ runId: string }> },
): Promise<Response> {
  const { runId } = await ctx.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "A JSON body with a `decision` is required." },
      { status: 400 },
    );
  }

  const parsed = ApproveBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid approval decision.", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const env = getServerEnv();
  try {
    const plan = await resolveRunPlan(env);
    const alpacaClient = resolveAlpacaExecutor(env);

    const state = await approveAnalysisRun({
      runId,
      decision: parsed.data,
      runner: plan.runner,
      ...(alpacaClient ? { alpacaClient } : {}),
    });

    return NextResponse.json({
      runId: state.run.id,
      phase: state.phase,
      decision: state.userDecision,
      appliedOrders: state.appliedOrders,
      receipt: state.receipt,
      state,
    });
  } catch (error) {
    if (error instanceof RunNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof RunConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Approval failed." },
      { status: 500 },
    );
  }
}
