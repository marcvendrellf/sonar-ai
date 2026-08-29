import { NextResponse } from "next/server";
import { z } from "zod";
import { MandateSchema } from "@sonar-ai/core";
import { AnalysisOrchestrator } from "@/lib/server/analysis/orchestrator";
import { getServerEnv } from "@/lib/server/env";
import { createInitialState, createPaperExecutor, createRunner } from "@/lib/server/runs/runtime";
import { getLatestRun, saveRun } from "@/lib/server/runs/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RequestSchema = z.object({
  mandate: MandateSchema.optional(),
}).strict();

export async function POST(request: Request) {
  try {
    const body = RequestSchema.parse(await request.json().catch(() => ({})));
    const env = getServerEnv();
    if (!env.SONAR_OFFLINE && body.mandate?.baseCurrency !== "USD") {
      return NextResponse.json({ error: "Live Alpaca Paper runs require an explicit USD mandate." }, { status: 400 });
    }
    const orchestrator = new AnalysisOrchestrator({
      runner: createRunner(env),
      alpacaClient: createPaperExecutor(env),
      instrumentStats: {
        inst_nvidia: { volatility: 0.2, beta: 1.4 },
        inst_siemens: { volatility: 0.1, beta: 0.9 },
      },
      stressScenarios: [{ name: "AI capex slowdown", marketShock: -0.2 }],
    });
    const state = await orchestrator.run({ state: await createInitialState(env, body.mandate) });
    saveRun(state);
    return NextResponse.json(state, { status: state.phase === "blocked" ? 422 : 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid analysis request" }, { status: 400 });
  }
}

export async function GET() {
  const state = getLatestRun();
  return state
    ? NextResponse.json(state)
    : NextResponse.json({ error: "No analysis run exists" }, { status: 404 });
}
