import { NextResponse } from "next/server";
import { z } from "zod";
import { UserDecisionSchema } from "@sonar-ai/core";
import { AnalysisOrchestrator } from "@/lib/server/analysis/orchestrator";
import { getServerEnv } from "@/lib/server/env";
import { createPaperExecutor, createRunner } from "@/lib/server/runs/runtime";
import { getRun, saveRun } from "@/lib/server/runs/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DecisionRequestSchema = z.object({ decision: UserDecisionSchema });

export async function GET(_request: Request, context: { params: Promise<{ runId: string }> }) {
  const { runId } = await context.params;
  const state = getRun(runId);
  return state ? NextResponse.json(state) : NextResponse.json({ error: "Run not found" }, { status: 404 });
}

export async function POST(request: Request, context: { params: Promise<{ runId: string }> }) {
  try {
    const { runId } = await context.params;
    const current = getRun(runId);
    if (!current) return NextResponse.json({ error: "Run not found" }, { status: 404 });
    const body = DecisionRequestSchema.parse(await request.json());
    const env = getServerEnv();
    const state = await new AnalysisOrchestrator({
      runner: createRunner(env),
      alpacaClient: createPaperExecutor(env),
    }).approve(current, body.decision);
    saveRun(state);
    return NextResponse.json(state);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid approval request" }, { status: 400 });
  }
}
