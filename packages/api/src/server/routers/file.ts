import { publicProcedure, router } from "../trpc";

export const fileRouter = router({
  getFiles: publicProcedure.query(() => {
    return null;
  }),
});
