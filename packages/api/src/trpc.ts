import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";

import { TRPCContext } from "./types";

const trpc = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
});

export const router = trpc.router;
export const publicProcedure = trpc.procedure;

export const protectedProcedure = trpc.procedure.use(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in",
    });
  }

  return next({
    ctx: {
      ...ctx,
      userId: ctx.userId,
    },
  });
});
