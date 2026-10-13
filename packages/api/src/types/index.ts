import type { auth } from "@zentro/auth";
import type { db } from "@zentro/db";
import type { ModuleId } from "@zentro/modules";

export type AuthSession = typeof auth.$Infer.Session;
export type AuthUser = AuthSession["user"];

export type ActiveOrganization = Awaited<
  ReturnType<typeof auth.api.getFullOrganization>
>;

export type TRPCContext = {
  db: typeof db;
  session: AuthSession | null;
  user: AuthUser | null;
  activeOrganization: ActiveOrganization | null;
  /** Enabled modules of the active organization, loaded once per request. */
  enabledModules: () => Promise<ReadonlySet<ModuleId>>;
};
