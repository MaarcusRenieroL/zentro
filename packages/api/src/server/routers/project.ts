import { TRPCError } from "@trpc/server";
import {
  archiveProjectBySlugSchema,
  checkSlugSchema,
  createProjectSchema,
  deleteProjectBySlugSchema,
  getProjectBySlugSchema,
  updateProjectBySlugSchema,
} from "../../types/zod-schema";
import { authorizedProcedure, organizationProcedure, router } from "../trpc";
import { members, projects, users } from "@zentro/db/schema";
import { and, asc, count, eq } from "@zentro/db/drizzle";

const createTaskKeyPrefixBase = (slug: string) => {
  const parts = slug.split("-").filter(Boolean);
  const prefix =
    parts.length > 1
      ? parts.map((part) => part[0]).join("")
      : parts[0]?.slice(0, 6);

  return (prefix ?? "task").replace(/[^a-z0-9]/gi, "").toUpperCase() || "TASK";
};

const createUniqueTaskKeyPrefix = async ({
  db,
  organizationId,
  slug,
}: {
  db: typeof import("@zentro/db").db;
  organizationId: string;
  slug: string;
}) => {
  const basePrefix = createTaskKeyPrefixBase(slug);
  const existingProjects = await db
    .select({ taskKeyPrefix: projects.taskKeyPrefix })
    .from(projects)
    .where(eq(projects.organizationId, organizationId));

  const existingPrefixes = new Set(
    existingProjects.map((project) => project.taskKeyPrefix),
  );

  if (!existingPrefixes.has(basePrefix)) {
    return basePrefix;
  }

  let suffix = 2;

  while (true) {
    const suffixText = String(suffix);
    const candidate = `${basePrefix.slice(0, 6 - suffixText.length)}${suffixText}`;

    if (!existingPrefixes.has(candidate)) {
      return candidate;
    }

    suffix += 1;
  }
};

export const projectRouter = router({
  createProject: authorizedProcedure({ project: ["create"] })
    .input(createProjectSchema)
    .mutation(async ({ ctx, input }) => {
      const { name, slug, description } = input;
      const { db, user, activeOrganization } = ctx;
      const taskKeyPrefix = await createUniqueTaskKeyPrefix({
        db,
        organizationId: activeOrganization.id,
        slug,
      });

      const [project] = await db
        .insert(projects)
        .values({
          name,
          slug,
          taskKeyPrefix,
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
  checkSlug: authorizedProcedure({ project: ["create"] })
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
      .select({
        id: projects.id,
        organizationId: projects.organizationId,
        name: projects.name,
        slug: projects.slug,
        taskKeyPrefix: projects.taskKeyPrefix,
        description: projects.description,
        status: projects.status,
        createdById: projects.createdById,
        archivedAt: projects.archivedAt,
        deletedAt: projects.deletedAt,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
      })
      .from(projects)
      .where(eq(projects.organizationId, activeOrganization.id))
      .orderBy(asc(projects.name));

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
  updateProjectBySlug: authorizedProcedure({ project: ["update"] })
    .input(updateProjectBySlugSchema)
    .mutation(async ({ ctx, input }) => {
      const { db, activeOrganization } = ctx;
      const { currentSlug, name, slug, description } = input;

      const [existingProject] = await db
        .select({
          id: projects.id,
          slug: projects.slug,
          organizationId: projects.organizationId,
        })
        .from(projects)
        .where(
          and(
            eq(projects.slug, currentSlug),
            eq(projects.organizationId, activeOrganization.id),
          ),
        )
        .limit(1);

      if (!existingProject) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        });
      }

      if (slug !== currentSlug) {
        const [slugConflict] = await db
          .select({
            id: projects.id,
          })
          .from(projects)
          .where(
            and(
              eq(projects.slug, slug),
              eq(projects.organizationId, activeOrganization.id),
            ),
          )
          .limit(1);

        if (slugConflict) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Project slug is already taken",
          });
        }
      }

      const [updatedProject] = await db
        .update(projects)
        .set({
          name,
          slug,
          description: description || null,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(projects.id, existingProject.id),
            eq(projects.organizationId, activeOrganization.id),
          ),
        )
        .returning();

      if (!updatedProject) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update project",
        });
      }

      return updatedProject;
    }),
  archiveProject: authorizedProcedure({ project: ["archive"] })
    .input(archiveProjectBySlugSchema)
    .mutation(async ({ ctx, input }) => {
      const { db, activeOrganization } = ctx;
      const { slug } = input;

      const [existingProject] = await db
        .select({
          id: projects.id,
          slug: projects.slug,
          organizationId: projects.organizationId,
          status: projects.status,
        })
        .from(projects)
        .where(
          and(
            eq(projects.slug, slug),
            eq(projects.organizationId, activeOrganization.id),
          ),
        )
        .limit(1);

      if (!existingProject) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        });
      }

      const nextStatus =
        existingProject.status === "archived" ? "active" : "archived";

      const [updatedProject] = await db
        .update(projects)
        .set({
          status: nextStatus,
          archivedAt: nextStatus === "archived" ? new Date() : null,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(projects.id, existingProject.id),
            eq(projects.organizationId, activeOrganization.id),
          ),
        )
        .returning();

      if (!updatedProject) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            nextStatus === "archived"
              ? "Failed to archive project"
              : "Failed to restore project",
        });
      }

      return updatedProject;
    }),
  deleteProject: authorizedProcedure({ project: ["delete"] })
    .input(deleteProjectBySlugSchema)
    .mutation(async ({ ctx, input }) => {
      const { db, activeOrganization } = ctx;
      const { slug } = input;

      const [existingProject] = await db
        .select()
        .from(projects)
        .where(
          and(
            eq(projects.slug, slug),
            eq(projects.organizationId, activeOrganization.id),
          ),
        );

      if (!existingProject) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project with given slug not found",
        });
      }

      const [deletedProject] = await db
        .delete(projects)
        .where(
          and(
            eq(projects.slug, slug),
            eq(projects.organizationId, activeOrganization.id),
          ),
        )
        .returning();

      if (!deletedProject) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update project",
        });
      }

      return deletedProject;
    }),
});
