import "dotenv/config";
import { defineConfig } from "drizzle-kit";
import { dbEnv } from "./src/env";

export default defineConfig({
  out: "./migrations",
  schema: "./src/schema/index.ts",
  dialect: "postgresql",
  dbCredentials: {
    // Migrations need a direct (non-pooled) connection; Neon sets this one.
    url: process.env.DATABASE_URL_UNPOOLED ?? dbEnv.DATABASE_URL,
  },
});
