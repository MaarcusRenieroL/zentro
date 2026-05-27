import { publicProcedure, router } from "../trpc";

export const taskRouter = router({
  getTaskById: publicProcedure.query(() => {
    return null;
  }),
});
