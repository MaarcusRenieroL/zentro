import type { auth } from "@zentro/auth";
import type { db } from "@zentro/db";

export type AuthSession = typeof auth.$Infer.Session;
export type AuthUser = AuthSession["user"];

export type TRPCContext = {
  db: typeof db;
  session: AuthSession | null;
  user: AuthUser | null;
  activeOrganization: unknown | null;
};
