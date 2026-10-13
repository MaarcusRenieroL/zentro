import { protectedProcedure, router } from "../trpc";

export const fileRouter = router({
  getFiles: protectedProcedure.query(() => {
    return null;
  }),
});
