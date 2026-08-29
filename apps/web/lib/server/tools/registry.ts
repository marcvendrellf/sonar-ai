import type { ServerEnv } from "../env";
import { FixtureCalaProvider } from "../cala/fixture-provider";
import { createLiveCalaProvider, type CalaProvider } from "../cala/client";
import { createCalaTools } from "./cala-tools";
import type { ToolRegistry } from "./types";

export interface ToolRegistryDependencies {
  cala: CalaProvider;
}

export function createToolRegistry(
  dependencies: ToolRegistryDependencies,
): ToolRegistry {
  return {
    ...createCalaTools(dependencies.cala),
  };
}

export function createToolRegistryFromEnv(env: ServerEnv): ToolRegistry {
  const cala = env.SONAR_OFFLINE
    ? new FixtureCalaProvider()
    : createLiveCalaProvider(env);
  return createToolRegistry({ cala });
}
