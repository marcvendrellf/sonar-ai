import { zodResponsesFunction } from "openai/helpers/zod";
import { describe, expect, it } from "vitest";
import { createCalaTools } from "./cala-tools";
import { createAlpacaTools, type ReadonlyAlpacaProvider } from "./alpaca-tools";
import type { CalaProvider } from "../cala/client";

/**
 * Every tool's INPUT schema is sent to OpenAI as a strict function schema. Strict
 * mode forbids `.optional()` without `.nullable()` (all fields must be present),
 * so a tool that violates it makes the model request throw at build time and
 * blocks the whole stage — with no obvious signal. Guard the whole registry.
 */
describe("tool input schemas convert to OpenAI strict function schemas", () => {
  // The definitions only need the schemas; execution is never called here.
  const cala = createCalaTools({ mode: "fixture" } as unknown as CalaProvider);
  const alpaca = createAlpacaTools({} as unknown as ReadonlyAlpacaProvider);
  const tools = { ...cala, ...alpaca };

  for (const [name, tool] of Object.entries(tools)) {
    it(`${name} is strict-compatible`, () => {
      expect(() =>
        zodResponsesFunction({
          name: tool.name,
          description: tool.description,
          parameters: tool.inputSchema,
        }),
      ).not.toThrow();
    });
  }
});
