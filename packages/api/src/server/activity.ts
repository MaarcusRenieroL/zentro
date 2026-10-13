import {
  and,
  eq,
  inArray,
  isNotNull,
  isNull,
  like,
  lt,
  notInArray,
  or,
  sql,
  type SQL,
} from "@zentro/db/drizzle";
import { activityEvents } from "@zentro/db/schema";
import { z } from "zod";

import type { ModuleId } from "@zentro/modules";

import type { PermissionContext } from "./permissions";

export const activityPageSize = 50;

/** A page position: the last event's time and id, joined as one opaque string. */
export const cursorSchema = z.string().max(100);

export function encodeCursor(row: { createdAt: Date; id: string }) {
  return `${row.createdAt.toISOString()}|${row.id}`;
}

export function cursorCondition(cursor: string | undefined): SQL | undefined {
  if (!cursor) {
    return undefined;
  }

  const [time, id] = cursor.split("|");
  const createdAt = new Date(time ?? "");

  if (!id || Number.isNaN(createdAt.getTime())) {
    return undefined;
  }

  return or(
    lt(activityEvents.createdAt, createdAt),
    and(eq(activityEvents.createdAt, createdAt), lt(activityEvents.id, id)),
  );
}

/**
 * SQL for the non-audit events the caller may see. Each kind of event follows
 * the permission of what it describes, in the project it belongs to:
 * tasks need `tasks.view` there, docs `docs.view`, projects `projects.view`,
 * and so a private project's tasks, docs and project events stay hidden from
 * people who cannot see the project. Events of a project that no longer exists
 * are shown only to people who can see every private project.
 */
export async function visibleActivityCondition(
  permissions: PermissionContext,
  enabledModules: ReadonlySet<ModuleId>,
): Promise<SQL> {
  const [
    taskProjects,
    docProjects,
    projectProjects,
    liveProjects,
    docsEverywhere,
    docTeams,
    teamsEverywhere,
    viewTeams,
    seeMembers,
    seeModules,
    seePrivate,
    seeOrgActivity,
  ] = await Promise.all([
    permissions.viewableProjectIds("tasks.view"),
    permissions.viewableProjectIds("docs.view"),
    permissions.viewableProjectIds("projects.view"),
    permissions.projects(),
    permissions.can("docs.view"),
    permissions.teamIdsWith("docs.view"),
    permissions.can("teams.view"),
    permissions.teamIdsWith("teams.view"),
    permissions.can("members.view"),
    permissions.can("modules.view"),
    permissions.can("projects.view_private"),
    permissions.can("activity.view_org"),
  ]);

  const liveIds = liveProjects.map((project) => project.id);
  // A project that is gone: the id is set but no live project has it.
  const orphaned: SQL | undefined = seePrivate
    ? and(
        isNotNull(activityEvents.projectId),
        liveIds.length
          ? notInArray(activityEvents.projectId, liveIds)
          : undefined,
      )
    : undefined;

  // `or` of nothing is "no condition", which would show everything; here it
  // must mean nothing is visible.
  const anyOf = (...parts: Array<SQL | undefined>) =>
    or(...parts.filter(Boolean)) ?? sql`false`;
  const inProjects = (ids: string[]) =>
    ids.length ? inArray(activityEvents.projectId, ids) : undefined;
  const conditions: Array<SQL | undefined> = [];

  if (enabledModules.has("tasks")) {
    conditions.push(
      and(
        like(activityEvents.action, "task.%"),
        anyOf(inProjects(taskProjects), orphaned),
      ),
    );
  }

  if (enabledModules.has("docs")) {
    conditions.push(
      and(
        like(activityEvents.action, "doc.%"),
        anyOf(
          inProjects(docProjects),
          orphaned,
          docsEverywhere ? isNull(activityEvents.projectId) : undefined,
          !docsEverywhere && docTeams.length
            ? and(
                isNull(activityEvents.projectId),
                inArray(activityEvents.teamId, docTeams),
              )
            : undefined,
        ),
      ),
    );
  }

  if (enabledModules.has("projects")) {
    conditions.push(
      and(
        like(activityEvents.action, "project.%"),
        anyOf(inProjects(projectProjects), orphaned),
      ),
    );
  }

  conditions.push(
    and(
      like(activityEvents.action, "team.%"),
      teamsEverywhere
        ? undefined
        : viewTeams.length
          ? inArray(activityEvents.teamId, viewTeams)
          : sql`false`,
    ),
  );

  // Members joining and modules turning on or off are organization-level
  // news, so they need the organization activity permission as well.
  if (seeMembers && seeOrgActivity) {
    conditions.push(eq(activityEvents.action, "member.joined"));
  }

  if (seeModules && seeOrgActivity) {
    conditions.push(like(activityEvents.action, "module.%"));
  }

  return or(...conditions.filter(Boolean)) ?? sql`false`;
}
