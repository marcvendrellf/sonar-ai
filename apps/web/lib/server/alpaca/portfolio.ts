import "server-only"

import {
  normalizeAlpacaPaperPortfolio,
  type AlpacaPaperPortfolioSnapshot,
} from "@sonar-ai/core/alpaca"

import fixture from "@/fixtures/alpaca-paper-account.json"
import { AlpacaPaperClient } from "@/lib/server/alpaca/client"
import { getAlpacaPaperConfig } from "@/lib/server/alpaca/config"

export async function getAlpacaPaperPortfolioSnapshot(): Promise<AlpacaPaperPortfolioSnapshot> {
  if (process.env.SONAR_OFFLINE === "true") {
    return normalizeAlpacaPaperPortfolio(fixture.account, fixture.positions, {
      source: "fixture",
      observedAt: new Date("2026-08-29T10:00:00.000Z"),
    })
  }

  return new AlpacaPaperClient(getAlpacaPaperConfig()).getPortfolioSnapshot()
}
