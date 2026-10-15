import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { attachDatabasePool } from "@vercel/functions";
import { Pool } from "pg";
import * as schema from "../schema";
import { dbEnv } from "../env";

const pool = new Pool({
  connectionString: dbEnv.DATABASE_URL,
});

// On Vercel, the pool is closed cleanly when a function instance is suspended
// so idle connections do not pile up on the Neon pooler.
if (process.env.VERCEL) {
  attachDatabasePool(pool);
}

export const db = drizzle({
  client: pool,
  schema,
});
