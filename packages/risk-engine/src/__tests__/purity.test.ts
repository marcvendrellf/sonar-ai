import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * The risk engine must stay pure: no filesystem, network, framework, or
 * randomness imports. This guard walks the source (excluding tests) and fails
 * if any module reaches for IO or a UI runtime.
 */

const SRC_DIR = join(fileURLToPath(new URL("..", import.meta.url)));

const FORBIDDEN = [
  /from\s+["']node:/,
  /from\s+["'](fs|net|http|https|dns|child_process|crypto)["']/,
  /from\s+["']react/,
  /from\s+["']next/,
  /require\(\s*["'](fs|net|http|crypto|node:)/,
];

function collectSourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === "__tests__") continue;
      out.push(...collectSourceFiles(full));
    } else if (entry.endsWith(".ts")) {
      out.push(full);
    }
  }
  return out;
}

describe("purity", () => {
  it("has no IO, framework, or randomness imports in engine source", () => {
    const offenders: string[] = [];
    for (const file of collectSourceFiles(SRC_DIR)) {
      const text = readFileSync(file, "utf8");
      for (const pattern of FORBIDDEN) {
        if (pattern.test(text)) offenders.push(`${file} :: ${pattern}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
