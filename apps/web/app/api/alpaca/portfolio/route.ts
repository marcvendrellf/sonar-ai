import { NextResponse } from "next/server";

import { AlpacaPaperClient } from "@/lib/server/alpaca/client";
import { getAlpacaPaperConfig } from "@/lib/server/alpaca/config";
import { FixtureAlpacaPaperProvider } from "@/lib/server/alpaca/fixture-provider";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (process.env.SONAR_OFFLINE === "true") {
    return NextResponse.json(
      await new FixtureAlpacaPaperProvider().getPortfolioSnapshot(),
    );
  }

  const snapshot = await new AlpacaPaperClient(getAlpacaPaperConfig()).getPortfolioSnapshot();
  return NextResponse.json(snapshot);
}
