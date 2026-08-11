import { defineConfig } from "vitest/config";
import path from "node:path";
import fs from "node:fs";

// Tests run against the real dev Supabase project, so they need the same
// .env.local the app uses (Next loads it automatically; vitest does not).
for (const line of fs.readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) {
    process.env[m[1]] = m[2].replace(/^["']|["']$/g, "").trim();
  }
}

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  test: {
    // Network round-trips to Supabase: generous timeouts, serial execution
    // so fixture setup/teardown can't race itself.
    testTimeout: 30_000,
    hookTimeout: 60_000,
    pool: "forks",
    maxConcurrency: 1,
  },
});
