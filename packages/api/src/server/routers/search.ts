import { protectedProcedure, router } from "../trpc";

export const searchRouter = router({
  searchById: protectedProcedure.query(() => {
    return null;
  }),
});
