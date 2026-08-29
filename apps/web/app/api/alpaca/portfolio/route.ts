import { NextResponse } from "next/server"

import {
  normalizeAlpacaPaperPortfolio,
  type AlpacaPaperPortfolioSnapshot,
} from "@sonar-ai/core/alpaca"

import fixture from "@/fixtures/alpaca-paper-account.json"
import { AlpacaPaperClient } from "@/lib/server/alpaca/client"
import { getAlpacaPaperConfig } from "@/lib/server/alpaca/config"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  let snapshot: AlpacaPaperPortfolioSnapshot

  if (process.env.SONAR_OFFLINE === "true") {
    snapshot = normalizeAlpacaPaperPortfolio(fixture.account, fixture.positions, {
      source: "fixture",
      observedAt: new Date("2026-08-29T10:00:00.000Z"),
    })
  } else {
    snapshot = await new AlpacaPaperClient(getAlpacaPaperConfig()).getPortfolioSnapshot()
  }

  return NextResponse.json(snapshot)
}
