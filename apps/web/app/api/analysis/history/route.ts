import { NextResponse } from "next/server";
import { listRuns } from "@/lib/server/runs/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const history = listRuns().map((state) => ({
    time: state.run.startedAt,
    nav: state.portfolioAfter?.nav.amount ?? state.portfolioSnapshot.nav.amount,
    currency: state.portfolioAfter?.nav.currency ?? state.portfolioSnapshot.nav.currency,
    runId: state.run.id,
  }));
  return NextResponse.json(history);
}
