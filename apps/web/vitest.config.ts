import { defineConfig } from "vitest/config";

// Server-lane unit tests only. Runs the pure TypeScript under lib/ in a node
// environment; React component testing is out of scope for now.
export default defineConfig({
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts"],
  },
});
