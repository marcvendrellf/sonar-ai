import { NextResponse } from "next/server";

import { normalizeAlpacaPaperPortfolio } from "@sonar-ai/core/alpaca";

import fixture from "@/fixtures/alpaca-paper-account.json";
import { AlpacaPaperClient } from "@/lib/server/alpaca/client";
import { getAlpacaPaperConfig } from "@/lib/server/alpaca/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (process.env.SONAR_OFFLINE === "true") {
    return NextResponse.json(
      normalizeAlpacaPaperPortfolio(fixture.account, fixture.positions, {
        source: "fixture",
        observedAt: "2026-08-29T10:00:00Z",
      }),
    );
  }

  const snapshot = await new AlpacaPaperClient(getAlpacaPaperConfig()).getPortfolioSnapshot();
  return NextResponse.json(snapshot);
}
