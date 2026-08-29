import type { ServerEnv } from "../env";
import {
  CalaEntityIntrospectionSchema,
  CalaEntityProfileSchema,
  CalaEntitySearchResponseSchema,
  CalaKnowledgeQueryResponseSchema,
  CalaKnowledgeSearchResponseSchema,
  type CalaEntityIntrospection,
  type CalaEntityProfile,
  type CalaEntitySummary,
  type CalaKnowledgeQueryResponse,
  type CalaKnowledgeSearchResponse,
} from "./schemas";

const CALA_API_BASE = "https://api.cala.ai/v1";

export interface CalaEntityRetrievalRequest {
  properties?: string[];
  relationships?: {
    incoming?: Record<string, { limit: number; offset?: number }>;
    outgoing?: Record<string, { limit: number; offset?: number }>;
  };
  numerical_observations?: Record<string, string[]>;
}

export interface CalaProvider {
  readonly mode: "live" | "fixture";
  query(query: string): Promise<CalaKnowledgeQueryResponse>;
  search(query: string): Promise<CalaKnowledgeSearchResponse>;
  findEntities(
    name: string,
    entityTypes: string[],
    limit: number,
  ): Promise<CalaEntitySummary[]>;
  introspectEntity(id: string): Promise<CalaEntityIntrospection>;
  retrieveEntity(
    id: string,
    request: CalaEntityRetrievalRequest,
  ): Promise<CalaEntityProfile>;
}

export interface CalaClientOptions {
  apiKey: string;
  timeoutMs: number;
  fetchImpl?: typeof fetch;
}

export class CalaClient implements CalaProvider {
  readonly mode = "live" as const;
  private readonly fetchImpl: typeof fetch;

  constructor(private readonly options: CalaClientOptions) {
    if (!options.apiKey) throw new Error("CalaClient requires CALA_API_KEY.");
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  query(query: string): Promise<CalaKnowledgeQueryResponse> {
    return this.request(
      "/knowledge/query",
      // The live Cala API names the body field `input`, not `query`.
      { method: "POST", body: JSON.stringify({ input: query }) },
      CalaKnowledgeQueryResponseSchema.parse,
    );
  }

  search(query: string): Promise<CalaKnowledgeSearchResponse> {
    return this.request(
      "/knowledge/search",
      // The live Cala API names the body field `input`, not `query`.
      { method: "POST", body: JSON.stringify({ input: query }) },
      CalaKnowledgeSearchResponseSchema.parse,
    );
  }

  async findEntities(
    name: string,
    entityTypes: string[],
    limit: number,
  ): Promise<CalaEntitySummary[]> {
    const params = new URLSearchParams({ name, limit: String(limit) });
    // Cala expects `entity_types` as a REPEATED query param — one key per type,
    // each from its fixed enum. A single comma-joined value is rejected (422).
    for (const type of entityTypes) params.append("entity_types", type);
    const result = await this.request(
      `/entities?${params.toString()}`,
      { method: "GET" },
      CalaEntitySearchResponseSchema.parse,
    );
    return Array.isArray(result) ? result : result.entities;
  }

  introspectEntity(id: string): Promise<CalaEntityIntrospection> {
    return this.request(
      `/entities/${encodeURIComponent(id)}/introspection`,
      { method: "GET" },
      CalaEntityIntrospectionSchema.parse,
    );
  }

  retrieveEntity(
    id: string,
    request: CalaEntityRetrievalRequest,
  ): Promise<CalaEntityProfile> {
    return this.request(
      `/entities/${encodeURIComponent(id)}`,
      { method: "POST", body: JSON.stringify(request) },
      CalaEntityProfileSchema.parse,
    );
  }

  private async request<T>(
    path: string,
    init: RequestInit,
    parse: (value: unknown) => T,
  ): Promise<T> {
    const maxAttempts = 4;
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.options.timeoutMs);
      try {
        const response = await this.fetchImpl(`${CALA_API_BASE}${path}`, {
          ...init,
          headers: {
            "Content-Type": "application/json",
            "X-API-KEY": this.options.apiKey,
          },
          signal: controller.signal,
        });
        // Rate limited / transiently unavailable: back off and retry. Cala's
        // relationship traversal fans out into many rapid calls, so bursts trip
        // the rate limit; respecting Retry-After keeps graph discovery reliable.
        if ((response.status === 429 || response.status === 503) && attempt < maxAttempts) {
          await response.text().catch(() => "");
          const retryAfter = Number(response.headers.get("retry-after"));
          const waitMs =
            Number.isFinite(retryAfter) && retryAfter > 0
              ? retryAfter * 1000
              : 500 * 2 ** (attempt - 1);
          console.error(`[CalaClient] ${path} -> ${response.status}, retrying in ${waitMs}ms`);
          await delay(waitMs);
          continue;
        }
        if (!response.ok) {
          // Cala's error body names the offending field/value (essential for
          // diagnosing 422 contract mismatches). Log it to the server console
          // (operator-only); keep the thrown message generic so provider details
          // never reach client-facing state.
          const detail = await response.text().catch(() => "");
          if (detail) {
            console.error(
              `[CalaClient] ${path} -> ${response.status}: ${detail.slice(0, 500)}`,
            );
          }
          throw new Error(`Cala API request failed with status ${response.status}.`);
        }
        return parse(await response.json());
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          throw new Error("Cala API request timed out.");
        }
        if (error instanceof Error && error.message.startsWith("Cala API")) {
          throw error;
        }
        throw new Error("Cala API request failed.");
      } finally {
        clearTimeout(timeout);
      }
    }
    throw new Error("Cala API request failed after retrying rate limits.");
  }
}

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export function createLiveCalaProvider(env: ServerEnv): CalaProvider {
  if (!env.CALA_API_KEY) {
    throw new Error("Live Cala mode requires CALA_API_KEY.");
  }
  return new CalaClient({ apiKey: env.CALA_API_KEY, timeoutMs: env.CALA_TIMEOUT_MS });
}
