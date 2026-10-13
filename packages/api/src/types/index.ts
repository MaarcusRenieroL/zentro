import type { auth } from "@zentro/auth";
import type { db } from "@zentro/db";
import type { ModuleId } from "@zentro/modules";

import type { AuditContext } from "../server/audit";
import type { PermissionContext } from "../server/permissions";

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
  /** What the caller may do in the active organization (loaded once per request). */
  permissions: PermissionContext;
  /** Writes activity events for the caller, with the request's context. */
  audit: AuditContext;
  /** Headers of the request, for calling Better Auth on the caller's behalf. */
  headers: Headers;
};
