import { router, publicProcedure } from "./trpc";

export const appRouter = router({
  health: publicProcedure.query(() => {
    return {
      status: "ok",
      message: "tRPC is working",
    };
  }),
});

export type AppRouter = typeof appRouter;
