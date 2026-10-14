import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  archiveProjectBySlugSchema,
  checkSlugSchema,
  createProjectSchema,
  deleteProjectBySlugSchema,
  getProjectBySlugSchema,
  updateProjectBySlugSchema,
} from "../../types/zod-schema";
import { listProcedure, permissionProcedure, router } from "../trpc";
import { assignCreatorLeadRole } from "../access";
import { buildChanges } from "@zentro/audit";
import { loadProjectBySlug, projectBySlug } from "../resources";
import {
  docs,
  members,
  projects,
  roleAssignments,
  roles,
  tasks,
  teams,
  users,
} from "@zentro/db/schema";
import { and, asc, count, eq, inArray, isNull, sql } from "@zentro/db/drizzle";

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
  createProject: permissionProcedure("projects.create", undefined, {
    module: "projects",
    audit: ["project.created"],
  })
    .input(createProjectSchema)
    .mutation(async ({ ctx, input }) => {
      const { name, slug, description } = input;
      const { db, user, activeOrganization } = ctx;
      let teamId = input.teamId ?? null;
      const taskKeyPrefix = await createUniqueTaskKeyPrefix({
        db,
        organizationId: activeOrganization.id,
        slug,
      });

      if (teamId) {
        const [team] = await db
          .select({ id: teams.id })
          .from(teams)
          .where(
            and(
              eq(teams.id, teamId),
              eq(teams.organizationId, activeOrganization.id),
            ),
          )
          .limit(1);

        if (!team) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Team not found",
          });
        }

        teamId = team.id;
      }

      const project = await db.transaction(async (tx) => {
        const [created] = await tx
          .insert(projects)
          .values({
            name,
            slug,
            taskKeyPrefix,
            description: description || null,
            teamId,
            organizationId: activeOrganization.id,
            createdById: user.id,
            status: "active",
          })
          .returning();

        if (!created) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create project",
          });
        }

        await ctx.audit.record(tx, {
          action: "project.created",
          target: { id: created.id, label: created.name },
          projectId: created.id,
          teamId: created.teamId,
          metadata: { slug: created.slug },
        });

        // Whoever creates a project leads it.
        await assignCreatorLeadRole(tx, ctx.audit, {
          organizationId: activeOrganization.id,
          userId: user.id,
          systemKey: "project_lead",
          scopeType: "project",
          scopeId: created.id,
          scopeName: created.name,
        });

        return created;
      });

      return project;
    }),
  checkSlug: permissionProcedure("projects.create", undefined, {
    module: "projects",
  })
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
  getProjectsByOrgId: listProcedure("projects.view", "projects").query(
    async ({ ctx }) => {
      const { activeOrganization, db } = ctx;
      const visibleProjectIds =
        await ctx.permissions.viewableProjectIds("projects.view");

      if (!visibleProjectIds.length) {
        return [];
      }

      const projectList = await db
        .select({
          id: projects.id,
          organizationId: projects.organizationId,
          name: projects.name,
          slug: projects.slug,
          taskKeyPrefix: projects.taskKeyPrefix,
          description: projects.description,
          teamId: projects.teamId,
          teamName: teams.name,
          teamColor: teams.color,
          status: projects.status,
          createdById: projects.createdById,
          archivedAt: projects.archivedAt,
          deletedAt: projects.deletedAt,
          createdAt: projects.createdAt,
          updatedAt: projects.updatedAt,
        })
        .from(projects)
        .leftJoin(teams, eq(teams.id, projects.teamId))
        .where(
          and(
            eq(projects.organizationId, activeOrganization.id),
            inArray(projects.id, visibleProjectIds),
          ),
        )
        .orderBy(asc(projects.name));

      // Task progress per project, only for projects whose tasks the caller can see.
      const taskProjectIds = new Set(
        await ctx.permissions.viewableProjectIds("tasks.view"),
      );
      const countable = projectList
        .map((project) => project.id)
        .filter((id) => taskProjectIds.has(id));
      const progress = countable.length
        ? await db
            .select({
              projectId: tasks.projectId,
              total: count(),
              done: sql<number>`count(*) filter (where ${tasks.status} = 'done')`.mapWith(
                Number,
              ),
            })
            .from(tasks)
            .where(
              and(
                eq(tasks.organizationId, activeOrganization.id),
                inArray(tasks.projectId, countable),
                isNull(tasks.deletedAt),
                isNull(tasks.archivedAt),
              ),
            )
            .groupBy(tasks.projectId)
        : [];
      const byProject = new Map(
        progress.map((row) => [row.projectId, row] as const),
      );

      return projectList.map((project) => ({
        ...project,
        // Null when the caller cannot see this project's tasks.
        totalTasks: taskProjectIds.has(project.id)
          ? (byProject.get(project.id)?.total ?? 0)
          : null,
        doneTasks: taskProjectIds.has(project.id)
          ? (byProject.get(project.id)?.done ?? 0)
          : null,
      }));
    },
  ),
  getProjectBySlug: permissionProcedure(
    "projects.view",
    projectBySlug("slug"),
    {
      module: "projects",
    },
  )
    .input(getProjectBySlugSchema)
    .query(async ({ ctx, input }) => {
      const { slug } = input;
      const { activeOrganization, db } = ctx;

      const [project] = await db
        .select({
          id: projects.id,
          name: projects.name,
          description: projects.description,
          slug: projects.slug,
          visibility: projects.visibility,
          teamId: projects.teamId,
          teamName: teams.name,
          teamColor: teams.color,
          createdAt: projects.createdAt,
          updatedAt: projects.updatedAt,
          status: projects.status,
          owner: users.name,
        })
        .from(projects)
        .leftJoin(users, eq(users.id, projects.createdById))
        .leftJoin(teams, eq(teams.id, projects.teamId))
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

      // Counts only cover what the caller may see inside the project.
      const access = (await loadProjectBySlug(ctx, slug)) ?? null;
      const canSeeTasks = await ctx.permissions.can("tasks.view", {
        project: access,
      });
      const canSeeDocs = await ctx.permissions.can("docs.view", {
        project: access,
      });

      // The organization's headcount is for people who may see members;
      // everyone else sees the people with a role on this project.
      const [memberCount] = (await ctx.permissions.can("members.view"))
        ? await db
            .select({ count: count() })
            .from(members)
            .where(eq(members.organizationId, activeOrganization.id))
        : await db
            .select({
              count:
                sql<number>`count(distinct ${roleAssignments.principalId})`.mapWith(
                  Number,
                ),
            })
            .from(roleAssignments)
            .where(
              and(
                eq(roleAssignments.organizationId, activeOrganization.id),
                eq(roleAssignments.scopeType, "project"),
                eq(roleAssignments.scopeId, project.id),
                eq(roleAssignments.principalType, "user"),
              ),
            );

      const [taskCounts] = canSeeTasks
        ? await db
            .select({
              total: count(),
              open: sql<number>`count(*) filter (where ${tasks.status} <> 'done')`.mapWith(
                Number,
              ),
            })
            .from(tasks)
            .innerJoin(projects, eq(projects.id, tasks.projectId))
            .where(
              and(
                eq(projects.slug, slug),
                eq(tasks.organizationId, activeOrganization.id),
                isNull(tasks.deletedAt),
              ),
            )
        : [];

      const [docCount] = canSeeDocs
        ? await db
            .select({ total: count() })
            .from(docs)
            .innerJoin(projects, eq(projects.id, docs.projectId))
            .where(
              and(
                eq(projects.slug, slug),
                eq(docs.organizationId, activeOrganization.id),
                isNull(docs.deletedAt),
              ),
            )
        : [];

      return {
        ...project,
        owner: project.owner ?? "Unknown owner",
        openTasks: taskCounts?.open ?? 0,
        totalTasks: taskCounts?.total ?? 0,
        totalDocs: docCount?.total ?? 0,
        totalMembers: memberCount?.count ?? 0,
      };
    }),
  updateProjectBySlug: permissionProcedure(
    "projects.update",
    projectBySlug("currentSlug"),
    { module: "projects", audit: ["project.updated"] },
  )
    .input(updateProjectBySlugSchema)
    .mutation(async ({ ctx, input }) => {
      const { db, activeOrganization } = ctx;
      const { currentSlug, name, slug, description } = input;
      let teamId = input.teamId ?? null;

      const [existingProject] = await db
        .select({
          id: projects.id,
          slug: projects.slug,
          name: projects.name,
          description: projects.description,
          teamId: projects.teamId,
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

      if (teamId) {
        const [team] = await db
          .select({ id: teams.id })
          .from(teams)
          .where(
            and(
              eq(teams.id, teamId),
              eq(teams.organizationId, activeOrganization.id),
            ),
          )
          .limit(1);

        if (!team) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Team not found",
          });
        }

        teamId = team.id;
      }

      const updatedProject = await db.transaction(async (tx) => {
        const [project] = await tx
          .update(projects)
          .set({
            name,
            slug,
            description: description || null,
            teamId,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(projects.id, existingProject.id),
              eq(projects.organizationId, activeOrganization.id),
            ),
          )
          .returning();

        if (!project) {
          return null;
        }

        await tx
          .update(tasks)
          .set({
            teamId,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(tasks.projectId, existingProject.id),
              eq(tasks.organizationId, activeOrganization.id),
            ),
          );

        await tx
          .update(docs)
          .set({
            teamId,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(docs.projectId, existingProject.id),
              eq(docs.organizationId, activeOrganization.id),
            ),
          );

        const changes = buildChanges(
          {
            name: existingProject.name,
            slug: existingProject.slug,
            description: existingProject.description,
            teamId: existingProject.teamId,
          },
          { name, slug, description: description || null, teamId },
        );

        if (changes.length) {
          await ctx.audit.record(tx, {
            action: "project.updated",
            target: { id: project.id, label: project.name },
            projectId: project.id,
            teamId: project.teamId,
            metadata: { slug: project.slug },
            changes,
          });
        } else {
          ctx.audit.skipped("project.updated");
        }

        return project;
      });

      if (!updatedProject) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update project",
        });
      }

      return updatedProject;
    }),
  getAccess: permissionProcedure("projects.view", projectBySlug("slug"), {
    module: "projects",
  })
    .input(getProjectBySlugSchema)
    .query(async ({ ctx, input }) => {
      const { db, activeOrganization } = ctx;
      const [project] = await db
        .select({
          id: projects.id,
          visibility: projects.visibility,
          teamId: projects.teamId,
        })
        .from(projects)
        .where(
          and(
            eq(projects.slug, input.slug),
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

      const assignments = await db
        .select({
          id: roleAssignments.id,
          roleId: roleAssignments.roleId,
          roleName: roles.name,
          principalType: roleAssignments.principalType,
          principalId: roleAssignments.principalId,
        })
        .from(roleAssignments)
        .innerJoin(roles, eq(roles.id, roleAssignments.roleId))
        .where(
          and(
            eq(roleAssignments.organizationId, activeOrganization.id),
            eq(roleAssignments.scopeType, "project"),
            eq(roleAssignments.scopeId, project.id),
          ),
        );

      const userIds = assignments
        .filter((assignment) => assignment.principalType === "user")
        .map((assignment) => assignment.principalId);
      const teamIds = assignments
        .filter((assignment) => assignment.principalType === "team")
        .map((assignment) => assignment.principalId);
      const [userRows, teamRows] = await Promise.all([
        userIds.length
          ? db
              .select({ id: users.id, name: users.name, email: users.email })
              .from(users)
              .where(inArray(users.id, userIds))
          : [],
        teamIds.length
          ? db
              .select({ id: teams.id, name: teams.name })
              .from(teams)
              .where(inArray(teams.id, teamIds))
          : [],
      ]);

      // Project roles are listed here so project leads can assign them
      // without needing the organization-level roles.view permission.
      const projectRoles = await db
        .select({ id: roles.id, name: roles.name })
        .from(roles)
        .where(
          and(
            eq(roles.organizationId, activeOrganization.id),
            eq(roles.scope, "project"),
          ),
        )
        .orderBy(asc(roles.name));

      return {
        projectId: project.id,
        visibility: project.visibility,
        teamId: project.teamId,
        availableRoles: projectRoles,
        assignments: assignments.map((assignment) => ({
          ...assignment,
          principalName:
            assignment.principalType === "user"
              ? (userRows.find((user) => user.id === assignment.principalId)
                  ?.name ?? "Unknown user")
              : (teamRows.find((team) => team.id === assignment.principalId)
                  ?.name ?? "Unknown team"),
        })),
      };
    }),
  updateAccess: permissionProcedure(
    "projects.settings.manage",
    projectBySlug("slug"),
    { module: "projects", audit: ["project.visibility_changed"] },
  )
    .input(
      getProjectBySlugSchema.extend({
        visibility: z.enum(["organization", "team", "private"]),
        teamId: z.string().uuid().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { db, user, activeOrganization } = ctx;
      const [existing] = await db
        .select({
          id: projects.id,
          name: projects.name,
          visibility: projects.visibility,
          teamId: projects.teamId,
        })
        .from(projects)
        .where(
          and(
            eq(projects.slug, input.slug),
            eq(projects.organizationId, activeOrganization.id),
          ),
        )
        .limit(1);

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        });
      }

      if (input.teamId) {
        const [team] = await db
          .select({ id: teams.id })
          .from(teams)
          .where(
            and(
              eq(teams.id, input.teamId),
              eq(teams.organizationId, activeOrganization.id),
            ),
          )
          .limit(1);

        if (!team) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Team not found" });
        }
      }

      if (input.visibility === "team" && !input.teamId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Choose the team that can see this project.",
        });
      }

      await db.transaction(async (tx) => {
        await tx
          .update(projects)
          .set({
            visibility: input.visibility,
            teamId: input.teamId,
            updatedAt: new Date(),
          })
          .where(eq(projects.id, existing.id));

        await ctx.audit.record(tx, {
          action: "project.visibility_changed",
          target: { id: existing.id, label: existing.name },
          projectId: existing.id,
          teamId: input.teamId,
          changes: buildChanges(
            { visibility: existing.visibility, teamId: existing.teamId },
            { visibility: input.visibility, teamId: input.teamId },
          ),
          metadata: {
            before: {
              visibility: existing.visibility,
              teamId: existing.teamId,
            },
            after: { visibility: input.visibility, teamId: input.teamId },
          },
        });
      });

      return { projectId: existing.id };
    }),
  archiveProject: permissionProcedure(
    "projects.archive",
    projectBySlug("slug"),
    { module: "projects", audit: ["project.archived", "project.restored"] },
  )
    .input(archiveProjectBySlugSchema)
    .mutation(async ({ ctx, input }) => {
      const { db, activeOrganization } = ctx;
      const { slug } = input;

      const [existingProject] = await db
        .select({
          id: projects.id,
          slug: projects.slug,
          name: projects.name,
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

      const updatedProject = await db.transaction(async (tx) => {
        const [row] = await tx
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

        if (row) {
          await ctx.audit.record(tx, {
            action:
              nextStatus === "archived"
                ? "project.archived"
                : "project.restored",
            target: { id: row.id, label: row.name },
            projectId: row.id,
            teamId: row.teamId,
            metadata: { slug: row.slug },
          });
        }

        return row;
      });

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
  deleteProject: permissionProcedure("projects.delete", projectBySlug("slug"), {
    module: "projects",
    audit: ["project.deleted"],
  })
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

      const deletedProject = await db.transaction(async (tx) => {
        const [row] = await tx
          .delete(projects)
          .where(
            and(
              eq(projects.slug, slug),
              eq(projects.organizationId, activeOrganization.id),
            ),
          )
          .returning();

        if (row) {
          // The event outlives the project: it keeps the project id and name.
          await ctx.audit.record(tx, {
            action: "project.deleted",
            target: { id: row.id, label: row.name },
            projectId: row.id,
            teamId: row.teamId,
            metadata: { slug: row.slug },
          });
        }

        return row;
      });

      if (!deletedProject) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update project",
        });
      }

      return deletedProject;
    }),
});
