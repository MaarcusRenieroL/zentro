import { defineConfig, devices } from "@playwright/test";

import {
  assertTestDatabaseUrl,
  getTestDatabaseUrl,
} from "./packages/test-utils/src/database";

// Tests only ever see TEST_DATABASE_URL; DATABASE_URL is never read here.
const testDatabaseUrl = getTestDatabaseUrl();

assertTestDatabaseUrl(testDatabaseUrl);

const baseURL = "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // A production build served by `next start`, against the test database.
  // `reuseExistingServer: false` makes the run fail instead of silently using
  // a dev server that may point at a different database.
  webServer: {
    // E2E_SKIP_BUILD=1 reuses the last build for quick local reruns.
    command: process.env.E2E_SKIP_BUILD
      ? "pnpm --filter @zentro/web start"
      : "pnpm --filter @zentro/web build && pnpm --filter @zentro/web start",
    url: `${baseURL}/auth/sign-in`,
    timeout: 600_000,
    reuseExistingServer: false,
    stdout: "pipe",
    stderr: "pipe",
    env: {
      DATABASE_URL: testDatabaseUrl,
      TEST_DATABASE_URL: testDatabaseUrl,
      BETTER_AUTH_SECRET: "e2e-secret-e2e-secret-e2e-secret-e2e-1",
      BETTER_AUTH_URL: baseURL,
      NEXT_PUBLIC_BASE_URL: baseURL,
      RESEND_API_KEY: "re_e2e_placeholder",
      // Mail goes nowhere; codes and tokens are read from the database.
      RESEND_BASE_URL: "http://127.0.0.1:9",
    },
  },
});
