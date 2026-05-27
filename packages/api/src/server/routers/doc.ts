import { publicProcedure, router } from "../trpc";

export const docsRouter = router({
  getDocs: publicProcedure.query(() => {
    return null;
  }),
});
