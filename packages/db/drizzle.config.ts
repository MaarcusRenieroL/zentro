import "dotenv/config";
import { defineConfig } from "drizzle-kit";
import { dbEnv } from "./src/env";

export default defineConfig({
  out: "./migrations",
  schema: "./src/schema/index.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: dbEnv.DATABASE_URL,
  },
});
