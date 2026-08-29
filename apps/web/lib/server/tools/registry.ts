import type { ServerEnv } from "../env";
import { FixtureCalaProvider } from "../cala/fixture-provider";
import { createLiveCalaProvider, type CalaProvider } from "../cala/client";
import { createCalaTools } from "./cala-tools";
import { AlpacaPaperClient } from "../alpaca/client";
import { getAlpacaPaperConfig } from "../alpaca/config";
import { FixtureAlpacaPaperProvider } from "../alpaca/fixture-provider";
import { createAlpacaTools } from "./alpaca-tools";
import type { ReadonlyAlpacaProvider } from "./alpaca-tools";
import type { ToolRegistry } from "./types";

export interface ToolRegistryDependencies {
  cala: CalaProvider;
  alpaca: ReadonlyAlpacaProvider;
}

export function createToolRegistry(
  dependencies: ToolRegistryDependencies,
): ToolRegistry {
  return {
    ...createCalaTools(dependencies.cala),
    ...createAlpacaTools(dependencies.alpaca),
  };
}

export function createToolRegistryFromEnv(env: ServerEnv): ToolRegistry {
  const cala = env.SONAR_OFFLINE
    ? new FixtureCalaProvider()
    : createLiveCalaProvider(env);
  const alpaca = env.SONAR_OFFLINE
    ? new FixtureAlpacaPaperProvider()
    : new AlpacaPaperClient(getAlpacaPaperConfig());
  return createToolRegistry({ cala, alpaca });
}
