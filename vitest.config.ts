import path from "node:path";
import { defineConfig } from "vitest/config";

// Deliberately does not reuse vite.config.ts: the router/paraglide plugins are
// build-time codegen and add nothing to unit tests of pure logic.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
