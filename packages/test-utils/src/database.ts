import {
  cpSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";

import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Client, Pool } from "pg";

const defaultTestDatabaseUrl =
  "postgres://zentro:zentro@localhost:5434/zentro_test";

// Works from any package directory (and under both ESM and CJS loaders).
function findRepoRoot(start = process.cwd()): string {
  let current = start;

  while (!existsSync(path.join(current, "pnpm-workspace.yaml"))) {
    const parent = path.dirname(current);

    if (parent === current) {
      throw new Error("Could not find the repository root.");
    }

    current = parent;
  }

  return current;
}

const repoRoot = findRepoRoot();

/**
 * Reads only `TEST_DATABASE_URL` (from the environment, then from the root
 * `.env` file). `DATABASE_URL` is never read, so tests cannot reach the dev
 * database.
 */
export function getTestDatabaseUrl(): string {
  const fromEnv = process.env.TEST_DATABASE_URL;

  if (fromEnv) {
    return fromEnv;
  }

  try {
    const line = readFileSync(path.join(repoRoot, ".env"), "utf8")
      .split("\n")
      .find((entry) => entry.startsWith("TEST_DATABASE_URL="));

    if (line) {
      return line.slice("TEST_DATABASE_URL=".length).trim();
    }
  } catch {
    // No .env file; fall through to the default.
  }

  return defaultTestDatabaseUrl;
}

export function getDatabaseName(connectionString: string): string {
  return decodeURIComponent(new URL(connectionString).pathname.slice(1));
}

/** Throws unless the database name ends with `_test`. Runs before any connection. */
export function assertTestDatabaseUrl(connectionString: string): void {
  const name = getDatabaseName(connectionString);

  if (!name.endsWith("_test")) {
    throw new Error(
      `Refusing to run tests: TEST_DATABASE_URL points at database "${name}", ` +
        'but test database names must end with "_test".',
    );
  }
}

function withDatabase(connectionString: string, database: string): string {
  const url = new URL(connectionString);
  url.pathname = `/${database}`;

  return url.toString();
}

/**
 * Creates the test database when it is missing and applies the repository's
 * migrations to it.
 */
export async function ensureTestDatabase(
  connectionString = getTestDatabaseUrl(),
): Promise<void> {
  assertTestDatabaseUrl(connectionString);

  const databaseName = getDatabaseName(connectionString);
  const admin = new Client({
    connectionString: withDatabase(connectionString, "postgres"),
  });

  try {
    await admin.connect();
  } catch (error) {
    throw new Error(
      "Could not reach the test Postgres server. Start it with: " +
        "docker compose --profile test up -d test-db\n" +
        `(${(error as Error).message})`,
    );
  }

  try {
    const { rowCount } = await admin.query(
      "select 1 from pg_database where datname = $1",
      [databaseName],
    );

    if (!rowCount) {
      await admin.query(
        `create database "${databaseName.replace(/"/g, '""')}"`,
      );
    }
  } finally {
    await admin.end();
  }

  const pool = new Pool({ connectionString, max: 1 });

  try {
    await migrate(drizzle({ client: pool }), {
      migrationsFolder: path.join(repoRoot, "packages/db/migrations"),
    });
  } finally {
    await pool.end();
  }
}

/** Runs one query against the test database (never the dev database). */
export async function queryTestDatabase<T extends Record<string, unknown>>(
  sql: string,
  values: unknown[] = [],
): Promise<T[]> {
  const connectionString = getTestDatabaseUrl();

  assertTestDatabaseUrl(connectionString);

  const client = new Client({ connectionString });

  await client.connect();

  try {
    const result = await client.query(sql, values);

    return result.rows as T[];
  } finally {
    await client.end();
  }
}

/**
 * A scratch database (name ending in `_test`) migrated only up to the first
 * `count` migrations, for testing a migration against data from before it.
 * Any previous database of that name is dropped first.
 */
export async function createDatabaseAtMigration(
  databaseName: string,
  count: number,
) {
  const base = getTestDatabaseUrl();
  const connectionString = withDatabase(base, databaseName);

  assertTestDatabaseUrl(connectionString);

  const admin = new Client({
    connectionString: withDatabase(base, "postgres"),
  });

  await admin.connect();

  try {
    await admin.query(
      `drop database if exists "${databaseName.replace(/"/g, '""')}" with (force)`,
    );
    await admin.query(`create database "${databaseName.replace(/"/g, '""')}"`);
  } finally {
    await admin.end();
  }

  const folder = path.join(repoRoot, "packages/db/migrations");
  const partial = mkdtempSync(path.join(os.tmpdir(), "migrations-"));

  cpSync(folder, partial, { recursive: true });

  const journalPath = path.join(partial, "meta/_journal.json");
  const journal = JSON.parse(readFileSync(journalPath, "utf8")) as {
    entries: unknown[];
  };

  journal.entries = journal.entries.slice(0, count);
  writeFileSync(journalPath, JSON.stringify(journal));

  const pool = new Pool({ connectionString, max: 1 });

  try {
    await migrate(drizzle({ client: pool }), { migrationsFolder: partial });
  } finally {
    await pool.end();
    rmSync(partial, { recursive: true, force: true });
  }

  return {
    connectionString,
    /** Applies every migration the database is missing. */
    async migrateToLatest() {
      const latest = new Pool({ connectionString, max: 1 });

      try {
        await migrate(drizzle({ client: latest }), {
          migrationsFolder: folder,
        });
      } finally {
        await latest.end();
      }
    },
    async query<T extends Record<string, unknown>>(
      sql: string,
      values: unknown[] = [],
    ) {
      const client = new Client({ connectionString });

      await client.connect();

      try {
        return (await client.query(sql, values)).rows as T[];
      } finally {
        await client.end();
      }
    },
  };
}
