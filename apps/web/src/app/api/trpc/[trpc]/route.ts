import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import {
  appRouter,
  createAuditContext,
  createEnabledModulesLoader,
  createPermissionContext,
} from "@zentro/api/server";
import { auth } from "@zentro/auth";
import { db } from "@zentro/db";

const handler = (request: Request) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: request,
    router: appRouter,
    createContext: async () => {
      const session = await auth.api.getSession({
        headers: request.headers,
      });

      if (!session) {
        return {
          db,
          session: null,
          user: null,
          activeOrganization: null,
          enabledModules: createEnabledModulesLoader(db, null),
          permissions: createPermissionContext(db, null, null),
          audit: createAuditContext({
            organizationId: null,
            userId: null,
            headers: request.headers,
          }),
          headers: request.headers,
        };
      }

      // The active organization comes from the session, not from the host.
      const activeOrganization = await auth.api.getFullOrganization({
        headers: request.headers,
      });

      return {
        db,
        session,
        user: session.user,
        activeOrganization,
        enabledModules: createEnabledModulesLoader(
          db,
          activeOrganization?.id ?? null,
        ),
        permissions: createPermissionContext(
          db,
          activeOrganization?.id ?? null,
          session.user.id,
        ),
        audit: createAuditContext({
          organizationId: activeOrganization?.id ?? null,
          userId: session.user.id,
          headers: request.headers,
        }),
        headers: request.headers,
      };
    },
  });
};

export { handler as GET, handler as POST };
