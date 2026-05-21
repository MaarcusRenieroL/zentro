import { router, publicProcedure } from "./trpc";
import { organizationRouter } from "./routers/organization";

export const appRouter = router({
  health: publicProcedure.query(() => {
    return {
      status: "ok",
      message: "tRPC is working",
    };
  }),
  organization: organizationRouter,
});

export type AppRouter = typeof appRouter;
