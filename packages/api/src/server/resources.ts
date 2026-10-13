import { and, eq, isNull } from "@zentro/db/drizzle";
import {
  docComments,
  docs,
  members,
  projects,
  tasks,
  teams,
} from "@zentro/db/schema";
import type { ProjectAccessInfo, ResourceContext } from "@zentro/permissions";

import type { OrganizationContext, ScopeResolver } from "./trpc";

// Resolvers describe what a call targets so the permission engine can apply
// team and project scopes, ownership and project visibility. Inputs are the
// raw (unvalidated) procedure inputs, so every field is read defensively. A
// resource that does not exist resolves to nothing; the procedure itself then
// reports NOT_FOUND, exactly as it did before permissions existed.

function field(input: unknown, name: string): string | undefined {
  const value = (input as Record<string, unknown> | null | undefined)?.[name];

  return typeof value === "string" ? value : undefined;
}

export async function loadProjectBySlug(
  ctx: OrganizationContext,
  slug: string | undefined,
): Promise<ProjectAccessInfo | undefined> {
  if (!slug) {
    return undefined;
  }

  const [project] = await ctx.db
    .select({
      id: projects.id,
      teamId: projects.teamId,
      visibility: projects.visibility,
    })
    .from(projects)
    .where(
      and(
        eq(projects.organizationId, ctx.activeOrganization.id),
        eq(projects.slug, slug),
        isNull(projects.deletedAt),
      ),
    )
    .limit(1);

  return project;
}

export async function loadProjectById(
  ctx: OrganizationContext,
  id: string | undefined | null,
): Promise<ProjectAccessInfo | undefined> {
  if (!id) {
    return undefined;
  }

  const [project] = await ctx.db
    .select({
      id: projects.id,
      teamId: projects.teamId,
      visibility: projects.visibility,
    })
    .from(projects)
    .where(
      and(
        eq(projects.organizationId, ctx.activeOrganization.id),
        eq(projects.id, id),
        isNull(projects.deletedAt),
      ),
    )
    .limit(1);

  return project;
}

async function ownerUserId(
  ctx: OrganizationContext,
  memberId: string | null,
): Promise<string | null> {
  if (!memberId) {
    return null;
  }

  const [member] = await ctx.db
    .select({ userId: members.userId })
    .from(members)
    .where(eq(members.id, memberId))
    .limit(1);

  return member?.userId ?? null;
}

export const projectBySlug =
  (name = "slug"): ScopeResolver =>
  async ({ ctx, input }) => {
    const project = await loadProjectBySlug(ctx, field(input, name));

    return project ? { project } : undefined;
  };

/** A new task or doc: scoped by the project or team named in the input. */
export const projectFromInput: ScopeResolver = async ({ ctx, input }) => {
  const project = await loadProjectById(ctx, field(input, "projectId"));

  return {
    project: project ?? null,
    teamId: field(input, "teamId") ?? null,
  };
};

export const taskByKey =
  (name = "key"): ScopeResolver =>
  async ({ ctx, input }) => {
    const key = field(input, name);

    if (!key) {
      return undefined;
    }

    const [task] = await ctx.db
      .select({
        projectId: tasks.projectId,
        teamId: tasks.teamId,
        createdByMemberId: tasks.createdByMemberId,
      })
      .from(tasks)
      .where(
        and(
          eq(tasks.key, key),
          eq(tasks.organizationId, ctx.activeOrganization.id),
          isNull(tasks.deletedAt),
        ),
      )
      .limit(1);

    if (!task) {
      return undefined;
    }

    return {
      project: (await loadProjectById(ctx, task.projectId)) ?? null,
      teamId: task.teamId,
      ownerUserId: await ownerUserId(ctx, task.createdByMemberId),
    } satisfies ResourceContext;
  };

async function resourceOfDoc(
  ctx: OrganizationContext,
  where: ReturnType<typeof and>,
): Promise<ResourceContext | undefined> {
  const [doc] = await ctx.db
    .select({
      projectId: docs.projectId,
      teamId: docs.teamId,
      createdByMemberId: docs.createdByMemberId,
    })
    .from(docs)
    .where(where)
    .limit(1);

  if (!doc) {
    return undefined;
  }

  return {
    project: (await loadProjectById(ctx, doc.projectId)) ?? null,
    teamId: doc.teamId,
    ownerUserId: await ownerUserId(ctx, doc.createdByMemberId),
  };
}

export const docById =
  (name = "id"): ScopeResolver =>
  async ({ ctx, input }) => {
    const id = field(input, name);

    return id
      ? resourceOfDoc(
          ctx,
          and(
            eq(docs.id, id),
            eq(docs.organizationId, ctx.activeOrganization.id),
          ),
        )
      : undefined;
  };

export const docBySlug: ScopeResolver = async ({ ctx, input }) => {
  const slug = field(input, "slug");

  return slug
    ? resourceOfDoc(
        ctx,
        and(
          eq(docs.slug, slug),
          eq(docs.organizationId, ctx.activeOrganization.id),
        ),
      )
    : undefined;
};

export const teamById =
  (name = "id"): ScopeResolver =>
  async ({ ctx, input }) => {
    const id = field(input, name);

    if (!id) {
      return undefined;
    }

    const [team] = await ctx.db
      .select({ id: teams.id })
      .from(teams)
      .where(
        and(
          eq(teams.id, id),
          eq(teams.organizationId, ctx.activeOrganization.id),
        ),
      )
      .limit(1);

    return team ? { teamId: team.id } : undefined;
  };

export const docByCommentId =
  (name = "id"): ScopeResolver =>
  async ({ ctx, input }) => {
    const id = field(input, name);

    if (!id) {
      return undefined;
    }

    const [comment] = await ctx.db
      .select({ docId: docComments.docId })
      .from(docComments)
      .where(
        and(
          eq(docComments.id, id),
          eq(docComments.organizationId, ctx.activeOrganization.id),
        ),
      )
      .limit(1);

    return comment
      ? resourceOfDoc(
          ctx,
          and(
            eq(docs.id, comment.docId),
            eq(docs.organizationId, ctx.activeOrganization.id),
          ),
        )
      : undefined;
  };
