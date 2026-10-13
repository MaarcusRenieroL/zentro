import { assertTestDatabaseUrl } from "@zentro/test-utils";

// Last line of defence: every worker must be pointed at the test database.
const databaseUrl = process.env.DATABASE_URL ?? "";

assertTestDatabaseUrl(databaseUrl);

if (databaseUrl !== process.env.TEST_DATABASE_URL) {
  throw new Error("DATABASE_URL must equal TEST_DATABASE_URL in tests.");
}
