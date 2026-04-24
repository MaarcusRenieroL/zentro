import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import postgres from "postgres";
import * as schema from "~/schema";

const pool = postgres(process.env.DATABASE_URL!, {
  max: 10,
});

export const db = drizzle({ client: pool, schema });
