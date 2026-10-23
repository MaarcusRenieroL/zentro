import { router, publicProcedure } from "./trpc";
import { organizationRouter } from "./routers/organization";
import { permissionsRouter } from "./routers/permissions";
import { userRouter } from "./routers/user";
import { activityRouter } from "./routers/activity";
import { auditRouter } from "./routers/audit";
import { calendarRouter } from "./routers/calendar";
import { commentRouter } from "./routers/comment";
import { docsRouter } from "./routers/doc";
import { fileRouter } from "./routers/file";
import { chatChannelProcedures } from "./routers/chat";
import { chatLinkProcedures } from "./routers/chat-links";
import { chatExtraProcedures } from "./routers/chat-extras";
import { chatMessageProcedures } from "./routers/chat-messages";
import { favoriteRouter } from "./routers/favorite";
import { filesRouterProcedures } from "./routers/files";
import { invitationRouter } from "./routers/invitation";
import { linkRouter } from "./routers/link";
import { notificationRouter } from "./routers/notification";
import { memberRouter } from "./routers/member";
import { modulesRouter } from "./routers/modules";
import { projectRouter } from "./routers/project";
import { searchRouter } from "./routers/search";
import { taskRouter } from "./routers/task";
import { whiteboardRouter } from "./routers/whiteboard";
import { teamRouter } from "./routers/team";
import { automationRouter } from "./routers/automation";

export const appRouter = router({
  health: publicProcedure.query(() => {
    return {
      status: "ok",
      message: "tRPC is working",
    };
  }),
  activity: activityRouter,
  audit: auditRouter,
  automation: automationRouter,
  calendar: calendarRouter,
  comment: commentRouter,
  docs: docsRouter,
  file: fileRouter,
  chat: router({
    ...chatChannelProcedures,
    ...chatMessageProcedures,
    ...chatExtraProcedures,
    ...chatLinkProcedures,
  }),
  favorite: favoriteRouter,
  files: router(filesRouterProcedures),
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
  whiteboard: whiteboardRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;
