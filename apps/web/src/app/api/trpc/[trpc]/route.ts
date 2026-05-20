import { appRouter } from "@zentro/api";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

const handler = (request: Request) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: request,
    router: appRouter,
    createContext: async () => {
      return {
        userId: "test user id",
        organizationId: "test organization id",
      };
    },
  });
};

export { handler as GET, handler as POST };
