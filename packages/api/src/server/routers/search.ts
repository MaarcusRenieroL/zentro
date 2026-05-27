import { publicProcedure, router } from "../trpc";

export const searchRouter = router({
  searchById: publicProcedure.query(() => {
    return null;
  }),
});
