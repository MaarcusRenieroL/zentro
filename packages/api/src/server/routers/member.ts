import { publicProcedure, router } from "../trpc";

export const memberRouter = router({
  getMembers: publicProcedure.query(() => {
    return null;
  }),
});
