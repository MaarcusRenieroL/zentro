import {
  createPermissionContext,
  visibleActivityCondition,
} from "@zentro/api/server";
import { db } from "@zentro/db";
import {
  and,
  asc,
  desc,
  eq,
  gte,
  inArray,
  isNull,
  ne,
  sql,
} from "@zentro/db/drizzle";
import {
  activityEvents,
  members,
  projects,
  tasks,
  users,
} from "@zentro/db/schema";
import type { ModuleId } from "@zentro/modules";
import { can, type PermissionSnapshot } from "@zentro/permissions";

import { paths } from "~/src/lib/paths";

export type TodayTask = {
  id: string;
  key: string;
  name: string;
  status: string;
  priority: string;
  dueAt: string | null;
  createdAt: string;
  projectName: string;
  projectSlug: string;
  /** When the current "in progress" stretch began, from the activity log. */
  startedAt: string | null;
  href: string;
};

export type TodayPulseItem = {
  id: string;
  actor: string;
  verb: "started" | "moved" | "finished" | "created";
  taskKey: string;
  title: string;
  href: string;
  at: string;
};

export type TodayData = {
  memberId: string | null;
  tasks: TodayTask[];
  /** Tasks this person finished since midnight. */
  doneToday: number;
  pulse: TodayPulseItem[];
  /** Task events per day for the last seven days, oldest first. */
  week: Array<{ label: string; count: number }>;
  /** The top open task nobody owns, offered when nothing is left. */
  unassignedNext: { key: string; name: string } | null;
};

function startOfToday() {
  const date = new Date();

  date.setHours(0, 0, 0, 0);

  return date;
}

const weekdayLetter = ["S", "M", "T", "W", "T", "F", "S"];

type StatusChange = { changes?: Array<{ to?: string | null }> };

function verbFor(action: string, metadata: StatusChange) {
  if (action === "task.created") return "created" as const;

  const to = metadata?.changes?.[0]?.to;

  if (to === "in-progress") return "started" as const;
  if (to === "done") return "finished" as const;

  return "moved" as const;
}

export async function getTodayData({
  organizationId,
  userId,
  enabledModules,
  snapshot,
}: {
  organizationId: string;
  userId: string;
  enabledModules: ReadonlySet<string>;
  snapshot: PermissionSnapshot;
}): Promise<TodayData> {
  const empty: TodayData = {
    memberId: null,
    tasks: [],
    doneToday: 0,
    pulse: [],
    week: [],
    unassignedNext: null,
  };

  if (!enabledModules.has("tasks")) return empty;

  const projectRows = await db
    .select({
      id: projects.id,
      teamId: projects.teamId,
      visibility: projects.visibility,
    })
    .from(projects)
    .where(
      and(
        eq(projects.organizationId, organizationId),
        isNull(projects.deletedAt),
      ),
    );
  const taskProjectIds = projectRows
    .filter((project) => can(snapshot, "tasks.view", { project }))
    .map((project) => project.id);
  const tasksVisible = taskProjectIds.length
    ? inArray(tasks.projectId, taskProjectIds)
    : sql`false`;

  const [member] = await db
    .select({ id: members.id })
    .from(members)
    .where(
      and(
        eq(members.organizationId, organizationId),
        eq(members.userId, userId),
      ),
    )
    .limit(1);
  const memberId = member?.id ?? null;
  const todayStart = startOfToday();
  const weekStart = new Date(todayStart);

  weekStart.setDate(weekStart.getDate() - 6);

  const visible = await visibleActivityCondition(
    createPermissionContext(db, organizationId, userId),
    enabledModules as ReadonlySet<ModuleId>,
  );
  const taskEvent = and(
    eq(activityEvents.organizationId, organizationId),
    eq(activityEvents.auditOnly, false),
    eq(activityEvents.targetType, "task"),
    sql`${activityEvents.action} in ('task.created', 'task.status_changed')`,
    visible,
  );

  const [open, doneRows, pulseRows, weekRows, unowned] = await Promise.all([
    memberId
      ? db
          .select({
            id: tasks.id,
            key: tasks.key,
            name: tasks.name,
            status: tasks.status,
            priority: tasks.priority,
            dueAt: tasks.dueAt,
            createdAt: tasks.createdAt,
            updatedAt: tasks.updatedAt,
            projectName: projects.name,
            projectSlug: projects.slug,
          })
          .from(tasks)
          .innerJoin(projects, eq(projects.id, tasks.projectId))
          .where(
            and(
              eq(tasks.organizationId, organizationId),
              tasksVisible,
              eq(tasks.assignedToMemberId, memberId),
              ne(tasks.status, "done"),
              isNull(tasks.deletedAt),
              isNull(tasks.archivedAt),
            ),
          )
          .orderBy(asc(tasks.createdAt))
          .limit(60)
      : Promise.resolve([]),
    db
      .select({ targetId: activityEvents.targetId })
      .from(activityEvents)
      .where(
        and(
          eq(activityEvents.organizationId, organizationId),
          eq(activityEvents.targetType, "task"),
          eq(activityEvents.action, "task.status_changed"),
          eq(activityEvents.actorUserId, userId),
          gte(activityEvents.createdAt, todayStart),
          sql`${activityEvents.metadata} -> 'changes' -> 0 ->> 'to' = 'done'`,
        ),
      )
      .groupBy(activityEvents.targetId),
    db
      .select({
        id: activityEvents.id,
        action: activityEvents.action,
        targetId: activityEvents.targetId,
        targetLabel: activityEvents.targetLabel,
        metadata: activityEvents.metadata,
        createdAt: activityEvents.createdAt,
        actorName: users.name,
        actorEmail: users.email,
      })
      .from(activityEvents)
      .leftJoin(users, eq(users.id, activityEvents.actorUserId))
      .where(and(taskEvent, gte(activityEvents.createdAt, todayStart)))
      .orderBy(desc(activityEvents.createdAt), desc(activityEvents.id))
      .limit(10),
    db
      .select({
        day: sql<string>`to_char(${activityEvents.createdAt}, 'YYYY-MM-DD')`,
        count: sql<number>`count(*)::int`,
      })
      .from(activityEvents)
      .where(and(taskEvent, gte(activityEvents.createdAt, weekStart)))
      .groupBy(sql`to_char(${activityEvents.createdAt}, 'YYYY-MM-DD')`),
    memberId
      ? db
          .select({ key: tasks.key, name: tasks.name })
          .from(tasks)
          .where(
            and(
              eq(tasks.organizationId, organizationId),
              tasksVisible,
              isNull(tasks.assignedToMemberId),
              ne(tasks.status, "done"),
              isNull(tasks.deletedAt),
              isNull(tasks.archivedAt),
            ),
          )
          .orderBy(
            sql`case ${tasks.priority} when 'high' then 0 when 'medium' then 1 else 2 end`,
            asc(tasks.createdAt),
          )
          .limit(1)
      : Promise.resolve([]),
  ]);

  // When each in-progress task was started: its latest move into "in-progress".
  const runningIds = open
    .filter((task) => task.status === "in-progress")
    .map((task) => task.id);
  const started = runningIds.length
    ? await db
        .select({
          targetId: activityEvents.targetId,
          at: sql<Date>`max(${activityEvents.createdAt})`,
        })
        .from(activityEvents)
        .where(
          and(
            eq(activityEvents.organizationId, organizationId),
            eq(activityEvents.action, "task.status_changed"),
            inArray(activityEvents.targetId, runningIds),
            sql`${activityEvents.metadata} -> 'changes' -> 0 ->> 'to' = 'in-progress'`,
          ),
        )
        .groupBy(activityEvents.targetId)
    : [];
  const startedAt = new Map(started.map((row) => [row.targetId, row.at]));

  const counts = new Map(weekRows.map((row) => [row.day, row.count]));
  const week = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);

    date.setDate(weekStart.getDate() + index);

    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

    return {
      label: weekdayLetter[date.getDay()]!,
      count: counts.get(key) ?? 0,
    };
  });

  return {
    memberId,
    tasks: open.map((task) => ({
      id: task.id,
      key: task.key,
      name: task.name,
      status: task.status,
      priority: task.priority,
      dueAt: task.dueAt?.toISOString() ?? null,
      createdAt: task.createdAt.toISOString(),
      projectName: task.projectName,
      projectSlug: task.projectSlug,
      startedAt:
        task.status === "in-progress"
          ? (
              (startedAt.get(task.id)
                ? new Date(startedAt.get(task.id)!)
                : null) ?? task.updatedAt
            ).toISOString()
          : null,
      href: paths.task(task.key),
    })),
    doneToday: doneRows.length,
    pulse: pulseRows
      .filter((row) => row.targetLabel)
      .map((row) => ({
        id: row.id,
        actor: (row.actorName || row.actorEmail || "Someone").split(" ")[0]!,
        verb: verbFor(row.action, row.metadata as StatusChange),
        taskKey: row.targetLabel!,
        title: String((row.metadata as { name?: string })?.name ?? ""),
        href: paths.task(row.targetLabel!),
        at: row.createdAt.toISOString(),
      })),
    week,
    unassignedNext: unowned[0] ?? null,
  };
}
