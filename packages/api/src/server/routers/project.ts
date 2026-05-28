import { TRPCError } from "@trpc/server";
import { checkSlugSchema, createProjectSchema } from "../../types/zod-schema";
import { adminProcedure, organizationProcedure, router } from "../trpc";
import { projects } from "@zentro/db/schema";
import { and, eq } from "@zentro/db/drizzle";

export const projectRouter = router({
  createProject: adminProcedure
    .input(createProjectSchema)
    .mutation(async ({ ctx, input }) => {
      const { name, slug, description } = input;
      const { db, user, activeOrganization } = ctx;

      const [project] = await db
        .insert(projects)
        .values({
          name,
          slug,
          description: description || null,
          organizationId: activeOrganization.id,
          createdById: user.id,
          status: "active",
        })
        .returning();

      if (!project) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create project",
        });
      }

      return project;
    }),
  checkSlug: adminProcedure
    .input(checkSlugSchema)
    .query(async ({ ctx, input }) => {
      const { db, activeOrganization } = ctx;

      const [project] = await db
        .select({
          id: projects.id,
        })
        .from(projects)
        .where(
          and(
            eq(projects.organizationId, activeOrganization.id),
            eq(projects.slug, input.slug),
          ),
        )
        .limit(1);

      return {
        available: !project,
      };
    }),
  getProjectsByOrgId: organizationProcedure.query(async ({ ctx }) => {
    const { activeOrganization, db } = ctx;

    const projectList = await db
      .select()
      .from(projects)
      .where(eq(projects.organizationId, activeOrganization.id));

    return projectList;
  }),
});
