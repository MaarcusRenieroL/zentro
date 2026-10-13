import { defineConfig } from "vitest/config";

// Relative import: the config is bundled by Vite, which would otherwise try to
// load the workspace package's TypeScript source through Node.
import {
  assertTestDatabaseUrl,
  getTestDatabaseUrl,
} from "../test-utils/src/database.ts";

const testDatabaseUrl = getTestDatabaseUrl();

// Aborts the whole run before anything connects.
assertTestDatabaseUrl(testDatabaseUrl);

export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    globalSetup: ["./test/global-setup.ts"],
    setupFiles: ["./test/setup.ts"],
    testTimeout: 30_000,
    hookTimeout: 60_000,
    // The app code reads DATABASE_URL; point it at the test database so it
    // can never fall back to a developer database from a local .env file.
    env: {
      DATABASE_URL: testDatabaseUrl,
      TEST_DATABASE_URL: testDatabaseUrl,
      BETTER_AUTH_SECRET: "test-secret-test-secret-test-secret-32",
      BETTER_AUTH_URL: "http://localhost:3000",
      NEXT_PUBLIC_BASE_URL: "http://localhost:3000",
      RESEND_API_KEY: "re_test_placeholder",
    },
  },
});
