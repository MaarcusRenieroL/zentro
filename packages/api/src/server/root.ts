import { router, publicProcedure } from "./trpc";
import { organizationRouter } from "./routers/organization";
import { permissionsRouter } from "./routers/permissions";
import { userRouter } from "./routers/user";
import { activityRouter } from "./routers/activity";
import { auditRouter } from "./routers/audit";
import { commentRouter } from "./routers/comment";
import { docsRouter } from "./routers/doc";
import { fileRouter } from "./routers/file";
import { favoriteRouter } from "./routers/favorite";
import { invitationRouter } from "./routers/invitation";
import { linkRouter } from "./routers/link";
import { notificationRouter } from "./routers/notification";
import { memberRouter } from "./routers/member";
import { modulesRouter } from "./routers/modules";
import { projectRouter } from "./routers/project";
import { searchRouter } from "./routers/search";
import { taskRouter } from "./routers/task";
import { teamRouter } from "./routers/team";

export const appRouter = router({
  health: publicProcedure.query(() => {
    return {
      status: "ok",
      message: "tRPC is working",
    };
  }),
  activity: activityRouter,
  audit: auditRouter,
  comment: commentRouter,
  docs: docsRouter,
  file: fileRouter,
  favorite: favoriteRouter,
  invitation: invitationRouter,
  link: linkRouter,
  member: memberRouter,
  notification: notificationRouter,
  modules: modulesRouter,
  organization: organizationRouter,
  permissions: permissionsRouter,
  project: projectRouter,
  search: searchRouter,
  task: taskRouter,
  team: teamRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;
