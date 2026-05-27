import { publicProcedure, router } from "../trpc";

export const commentRouter = router({
  getComments: publicProcedure.query(() => {
    return null;
  }),
});
