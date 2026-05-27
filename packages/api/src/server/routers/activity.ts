import { publicProcedure, router } from "../trpc";

export const activityRouter = router({
  activityDetails: publicProcedure.query(() => {
    return null;
  }),
});
