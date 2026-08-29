import OpenAI from "openai";
import { getServerEnv, type ServerEnv } from "../env";

/**
 * Build the server-only OpenAI client.
 *
 * SDK retries stay disabled. `OpenAIAgentRunner` owns the exact retry budget so
 * one configured retry always means at most two model requests.
 */
export function createOpenAIClient(env: ServerEnv = getServerEnv()): OpenAI {
  if (env.SONAR_OFFLINE) {
    throw new Error(
      "OpenAI client is disabled while SONAR_OFFLINE=true. Use StubAgentRunner.",
    );
  }
  if (!env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is required when SONAR_OFFLINE=false.");
  }

  return new OpenAI({
    apiKey: env.OPENAI_API_KEY,
    baseURL: env.OPENAI_BASE_URL,
    organization: env.OPENAI_ORG_ID,
    project: env.OPENAI_PROJECT_ID,
    maxRetries: 0,
    timeout: env.SONAR_AGENT_TIMEOUT_MS,
  });
}
