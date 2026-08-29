"use client"

import { useCallback, useEffect, useState } from "react"

import {
  AlpacaPaperPortfolioSnapshotSchema,
  type AlpacaPaperPortfolioSnapshot,
} from "@sonar-ai/core/alpaca"

type PortfolioState = {
  snapshot: AlpacaPaperPortfolioSnapshot | null
  error: string | null
  isLoading: boolean
}

export function useAlpacaPortfolio() {
  const [state, setState] = useState<PortfolioState>({
    snapshot: null,
    error: null,
    isLoading: true,
  })

  const refresh = useCallback(async () => {
    setState((current) => ({ ...current, error: null, isLoading: true }))

    try {
      const response = await fetch("/api/alpaca/portfolio", { cache: "no-store" })
      const payload: unknown = await response.json()

      if (!response.ok) {
        const message =
          typeof payload === "object" &&
          payload !== null &&
          "error" in payload &&
          typeof payload.error === "string"
            ? payload.error
            : "Unable to load Alpaca Paper portfolio."
        throw new Error(message)
      }

      const parsed = AlpacaPaperPortfolioSnapshotSchema.safeParse(payload)
      if (!parsed.success) {
        throw new Error("Alpaca portfolio response failed validation.")
      }

      setState({ snapshot: parsed.data, error: null, isLoading: false })
    } catch (error) {
      setState((current) => ({
        ...current,
        error: error instanceof Error ? error.message : "Unable to load Alpaca Paper portfolio.",
        isLoading: false,
      }))
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { ...state, refresh }
}
