export interface AlpacaPaperConfig {
  apiKey: string;
  secretKey: string;
  timeoutMs: number;
}

type AlpacaEnv = { ALPACA_API_KEY?: string; ALPACA_SECRET_KEY?: string; ALPACA_PAPER_TRADE?: string | boolean; ALPACA_TIMEOUT_MS?: string | number };

export function getAlpacaPaperConfig(env?: AlpacaEnv): AlpacaPaperConfig {
  const source = env ?? (process.env as unknown as AlpacaEnv);
  const apiKey = source.ALPACA_API_KEY;
  const secretKey = source.ALPACA_SECRET_KEY;

  if (!apiKey || !secretKey) {
    throw new Error("ALPACA_API_KEY and ALPACA_SECRET_KEY are required for paper trading");
  }
  if (source.ALPACA_PAPER_TRADE !== "true" && source.ALPACA_PAPER_TRADE !== true) {
    throw new Error("ALPACA_PAPER_TRADE must be true; live trading is disabled");
  }

  return {
    apiKey,
    secretKey,
    timeoutMs: Number(source.ALPACA_TIMEOUT_MS || 15_000),
  };
}
