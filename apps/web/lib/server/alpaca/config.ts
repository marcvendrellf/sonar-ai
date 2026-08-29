export interface AlpacaPaperConfig {
  apiKey: string;
  secretKey: string;
  timeoutMs: number;
}

export function getAlpacaPaperConfig(): AlpacaPaperConfig {
  const apiKey = process.env.ALPACA_API_KEY;
  const secretKey = process.env.ALPACA_SECRET_KEY;

  if (!apiKey || !secretKey) {
    throw new Error("ALPACA_API_KEY and ALPACA_SECRET_KEY are required for paper trading");
  }
  if (process.env.ALPACA_PAPER_TRADE !== "true") {
    throw new Error("ALPACA_PAPER_TRADE must be true; live trading is disabled");
  }

  return {
    apiKey,
    secretKey,
    timeoutMs: Number(process.env.ALPACA_TIMEOUT_MS || 15_000),
  };
}
