import { z } from "zod";

/**
 * Validated, server-only environment. NEVER import this from a client
 * component — every value here is a secret or a server switch and must not
 * reach the browser. See `.env.example` for the full list and rules.
 */

const EnvSchema = z.object({
  // Runtime
  SONAR_OFFLINE: z
    .enum(["true", "false"])
    .default("true")
    .transform((v) => v === "true"),

  // OpenAI (all agents)
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_BASE_URL: z.url().optional(),
  OPENAI_ORG_ID: z.string().optional(),
  OPENAI_PROJECT_ID: z.string().optional(),
  SONAR_AGENT_MODEL: z.string().default("gpt-5"),
  SONAR_AGENT_MAX_TOKENS: z.coerce.number().int().positive().default(4096),
  SONAR_AGENT_MAX_RETRIES: z.coerce.number().int().min(0).default(1),
  SONAR_AGENT_TIMEOUT_MS: z.coerce.number().int().positive().default(30000),

  // Cala (server-only)
  CALA_API_KEY: z.string().optional(),
  CALA_MCP_ENDPOINT: z.string().default("https://api.cala.ai/mcp/"),
  CALA_TIMEOUT_MS: z.coerce.number().int().positive().default(15000),

  // Alpaca Paper Trading (server-only; live trading is forbidden)
  ALPACA_API_KEY: z.string().optional(),
  ALPACA_SECRET_KEY: z.string().optional(),
  ALPACA_PAPER_TRADE: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
  ALPACA_TIMEOUT_MS: z.coerce.number().int().positive().default(15000),
});

export type ServerEnv = z.infer<typeof EnvSchema>;

let cached: ServerEnv | undefined;

/**
 * Parse and cache the server environment. Empty-string variables are treated as
 * unset so defaults apply. Throws a readable error if a present value is
 * malformed (e.g. a non-URL `OPENAI_BASE_URL`).
 */
export function getServerEnv(): ServerEnv {
  if (cached) return cached;
  const raw = Object.fromEntries(
    Object.entries(process.env).filter(([, v]) => v !== undefined && v !== ""),
  );
  const parsed = EnvSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(
      `Invalid server environment:\n${JSON.stringify(parsed.error.flatten().fieldErrors, null, 2)}`,
    );
  }
  cached = parsed.data;
  return cached;
}

/** True when the app must run entirely from fixtures with no external calls. */
export function isOffline(): boolean {
  return getServerEnv().SONAR_OFFLINE;
}
