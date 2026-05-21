import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@zentro/api/server";
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
        };
      }

      const activeOrganization = await auth.api.getFullOrganization({
        headers: request.headers,
      });

      return {
        db,
        session,
        user: session.user,
        activeOrganization,
      };
    },
  });
};

export { handler as GET, handler as POST };
