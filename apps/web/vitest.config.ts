import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

// Server-lane unit tests only. Runs the pure TypeScript under lib/ in a node
// environment; React component testing is out of scope for now.
export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname),
      "server-only": resolve(__dirname, "lib/server-only-test.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts", "app/api/**/*.test.ts"],
  },
});
