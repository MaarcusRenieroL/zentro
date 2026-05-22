import { router, publicProcedure } from "./trpc";
import { organizationRouter } from "./routers/organization";
import { userRouter } from "./routers/user";

export const appRouter = router({
  health: publicProcedure.query(() => {
    return {
      status: "ok",
      message: "tRPC is working",
    };
  }),
  organization: organizationRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;
