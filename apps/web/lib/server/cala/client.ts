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
      { method: "POST", body: JSON.stringify({ query }) },
      CalaKnowledgeQueryResponseSchema.parse,
    );
  }

  search(query: string): Promise<CalaKnowledgeSearchResponse> {
    return this.request(
      "/knowledge/search",
      { method: "POST", body: JSON.stringify({ query }) },
      CalaKnowledgeSearchResponseSchema.parse,
    );
  }

  async findEntities(
    name: string,
    entityTypes: string[],
    limit: number,
  ): Promise<CalaEntitySummary[]> {
    const params = new URLSearchParams({ name, limit: String(limit) });
    if (entityTypes.length) params.set("entity_types", entityTypes.join(","));
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
      if (!response.ok) {
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
}

export function createLiveCalaProvider(env: ServerEnv): CalaProvider {
  if (!env.CALA_API_KEY) {
    throw new Error("Live Cala mode requires CALA_API_KEY.");
  }
  return new CalaClient({ apiKey: env.CALA_API_KEY, timeoutMs: env.CALA_TIMEOUT_MS });
}
