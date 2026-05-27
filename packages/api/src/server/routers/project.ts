import { publicProcedure, router } from "../trpc";

export const projectRouter = router({
  getProjects: publicProcedure.query(() => {
    return null;
  }),
});
