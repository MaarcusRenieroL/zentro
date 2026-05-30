import { TRPCError } from "@trpc/server";
import {
  checkSlugSchema,
  createProjectSchema,
  getProjectBySlugSchema,
} from "../../types/zod-schema";
import { adminProcedure, organizationProcedure, router } from "../trpc";
import { members, projects, users } from "@zentro/db/schema";
import { and, count, eq } from "@zentro/db/drizzle";

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
  getProjectBySlug: organizationProcedure
    .input(getProjectBySlugSchema)
    .query(async ({ ctx, input }) => {
      const { slug } = input;
      const { activeOrganization, db } = ctx;

      const [project] = await db
        .select({
          name: projects.name,
          description: projects.description,
          slug: projects.slug,
          createdAt: projects.createdAt,
          updatedAt: projects.updatedAt,
          status: projects.status,
          owner: users.name,
        })
        .from(projects)
        .leftJoin(users, eq(users.id, projects.createdById))
        .where(
          and(
            eq(projects.slug, slug),
            eq(projects.organizationId, activeOrganization.id),
          ),
        )
        .limit(1);

      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        });
      }

      const [memberCount] = await db
        .select({ count: count() })
        .from(members)
        .where(eq(members.organizationId, activeOrganization.id));

      return {
        ...project,
        owner: project.owner ?? "Unknown owner",
        openTasks: 0,
        totalTasks: 0,
        totalDocs: 0,
        totalMembers: memberCount?.count ?? 0,
      };
    }),
});
