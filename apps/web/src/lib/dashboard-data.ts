import { db } from "@zentro/db";
import { can, type PermissionSnapshot } from "@zentro/permissions";
import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  inArray,
  isNull,
  lte,
  ne,
  or,
  sql,
} from "@zentro/db/drizzle";
import {
  docs,
  members,
  projects,
  taskActivityEvents,
  tasks,
  teams,
  users,
} from "@zentro/db/schema";
import { paths } from "~/src/lib/paths";

export type DashboardStat = {
  value: number;
  label: string;
};

export type DashboardActivityPill = {
  kind: "tasks" | "docs";
  label: string;
};

export type DashboardTaskItem = {
  id: string;
  title: string;
  priority: string;
  status: string;
  href: string;
};

export type DashboardWorkItem = {
  id: string;
  kind: "doc" | "project" | "task";
  title: string;
  label: string;
  updatedAt: string;
  href: string;
};

export type DashboardActivityItem = {
  id: string;
  user: string;
  userInitials: string;
  action: string;
  target: string;
  app: string;
  time: string;
  kind: "created" | "updated" | "completed" | "commented";
  href: string;
};

export type DashboardData = {
  activityPills: DashboardActivityPill[];
  workspaceStats: DashboardStat[];
  recentWork: DashboardWorkItem[];
  recentActivity: DashboardActivityItem[];
  tasks: DashboardTaskItem[];
  modules: {
    projects: boolean;
    tasks: boolean;
    docs: boolean;
  };
  // Links to disabled modules are left out.
  links: {
    docs?: string;
    projects?: string;
    tasks?: string;
    newDoc?: string;
    newTask?: string;
  };
};

function pluralize(
  countValue: number,
  singular: string,
  plural = `${singular}s`,
) {
  return `${countValue} ${countValue === 1 ? singular : plural}`;
}

function getInitials(value?: string | null) {
  const parts = value?.trim().split(/\s+/).filter(Boolean) ?? [];

  if (!parts.length) {
    return "UN";
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function formatRelativeDate(value: Date | null) {
  if (!value) {
    return "Recently";
  }

  const delta = Date.now() - value.getTime();
  const minutes = Math.max(0, Math.round(delta / 60000));

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;

  return value.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);

  return date;
}

function endOfToday() {
  const date = new Date();
  date.setHours(23, 59, 59, 999);

  return date;
}

function formatActivityAction(type: string) {
  if (type === "task.created") return "created";
  if (type === "task.comment.created") return "commented on";
  if (type === "task.updated") return "updated";

  return "updated";
}

function formatActivityKind(
  type: string,
  status: string | null,
): DashboardActivityItem["kind"] {
  if (status === "done") return "completed";
  if (type.includes("comment")) return "commented";
  if (type.includes("created")) return "created";

  return "updated";
}

// Disabled modules are not queried; their widgets stay empty.
function when<T>(enabled: boolean, query: () => PromiseLike<T[]>) {
  return enabled ? query() : Promise.resolve<T[]>([]);
}

export async function getDashboardData({
  organizationId,
  userId,
  enabledModules,
  snapshot,
}: {
  organizationId: string;
  userId: string;
  enabledModules: ReadonlySet<string>;
  snapshot: PermissionSnapshot;
}): Promise<DashboardData> {
  const todayStart = startOfToday();
  const todayEnd = endOfToday();

  // Everything below only counts what the caller is allowed to see: projects
  // hidden from them, and the tasks and docs inside those projects, stay out.
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
  const idsFor = (key: string) =>
    projectRows
      .filter((project) => can(snapshot, key, { project }))
      .map((project) => project.id);
  const projectIds = idsFor("projects.view");
  const taskProjectIds = idsFor("tasks.view");
  const docProjectIds = idsFor("docs.view");
  const projectsVisible = projectIds.length
    ? inArray(projects.id, projectIds)
    : sql`false`;
  const tasksVisible = taskProjectIds.length
    ? inArray(tasks.projectId, taskProjectIds)
    : sql`false`;
  const docsVisible =
    or(
      can(snapshot, "docs.view") ? isNull(docs.projectId) : undefined,
      docProjectIds.length ? inArray(docs.projectId, docProjectIds) : undefined,
    ) ?? sql`false`;

  const [
    memberCount,
    projectCount,
    activeProjectCount,
    taskCount,
    openTaskCount,
    dueTodayTaskCount,
    docCount,
    docsUpdatedTodayCount,
    teamCount,
    currentMember,
    recentProjects,
    recentDocs,
    recentTasks,
    recentEvents,
  ] = await Promise.all([
    db
      .select({ count: count() })
      .from(members)
      .where(eq(members.organizationId, organizationId)),
    when(enabledModules.has("projects"), () =>
      db
        .select({ count: count() })
        .from(projects)
        .where(
          and(
            eq(projects.organizationId, organizationId),
            projectsVisible,
            isNull(projects.deletedAt),
          ),
        ),
    ),
    when(enabledModules.has("projects"), () =>
      db
        .select({ count: count() })
        .from(projects)
        .where(
          and(
            eq(projects.organizationId, organizationId),
            projectsVisible,
            eq(projects.status, "active"),
            isNull(projects.deletedAt),
          ),
        ),
    ),
    when(enabledModules.has("tasks"), () =>
      db
        .select({ count: count() })
        .from(tasks)
        .where(
          and(
            eq(tasks.organizationId, organizationId),
            tasksVisible,
            isNull(tasks.deletedAt),
          ),
        ),
    ),
    when(enabledModules.has("tasks"), () =>
      db
        .select({ count: count() })
        .from(tasks)
        .where(
          and(
            eq(tasks.organizationId, organizationId),
            tasksVisible,
            ne(tasks.status, "done"),
            isNull(tasks.deletedAt),
          ),
        ),
    ),
    when(enabledModules.has("tasks"), () =>
      db
        .select({ count: count() })
        .from(tasks)
        .where(
          and(
            eq(tasks.organizationId, organizationId),
            tasksVisible,
            ne(tasks.status, "done"),
            isNull(tasks.deletedAt),
            gte(tasks.dueAt, todayStart),
            lte(tasks.dueAt, todayEnd),
          ),
        ),
    ),
    when(enabledModules.has("docs"), () =>
      db
        .select({ count: count() })
        .from(docs)
        .where(
          and(
            eq(docs.organizationId, organizationId),
            docsVisible,
            isNull(docs.deletedAt),
          ),
        ),
    ),
    when(enabledModules.has("docs"), () =>
      db
        .select({ count: count() })
        .from(docs)
        .where(
          and(
            eq(docs.organizationId, organizationId),
            docsVisible,
            isNull(docs.deletedAt),
            gte(docs.updatedAt, todayStart),
            lte(docs.updatedAt, todayEnd),
          ),
        ),
    ),
    db
      .select({ count: count() })
      .from(teams)
      .where(
        and(eq(teams.organizationId, organizationId), isNull(teams.archivedAt)),
      ),
    db
      .select({ id: members.id })
      .from(members)
      .where(
        and(
          eq(members.organizationId, organizationId),
          eq(members.userId, userId),
        ),
      )
      .limit(1),
    when(enabledModules.has("projects"), () =>
      db
        .select({
          id: projects.id,
          name: projects.name,
          slug: projects.slug,
          updatedAt: projects.updatedAt,
        })
        .from(projects)
        .where(
          and(
            eq(projects.organizationId, organizationId),
            projectsVisible,
            isNull(projects.deletedAt),
          ),
        )
        .orderBy(desc(projects.updatedAt))
        .limit(3),
    ),
    when(enabledModules.has("docs"), () =>
      db
        .select({
          id: docs.id,
          title: docs.title,
          slug: docs.slug,
          updatedAt: docs.updatedAt,
        })
        .from(docs)
        .where(
          and(
            eq(docs.organizationId, organizationId),
            docsVisible,
            isNull(docs.deletedAt),
          ),
        )
        .orderBy(desc(docs.updatedAt))
        .limit(3),
    ),
    when(enabledModules.has("tasks"), () =>
      db
        .select({
          id: tasks.id,
          key: tasks.key,
          name: tasks.name,
          status: tasks.status,
          priority: tasks.priority,
          dueAt: tasks.dueAt,
          updatedAt: tasks.updatedAt,
        })
        .from(tasks)
        .where(
          and(
            eq(tasks.organizationId, organizationId),
            tasksVisible,
            isNull(tasks.deletedAt),
          ),
        )
        .orderBy(desc(tasks.updatedAt))
        .limit(5),
    ),
    when(enabledModules.has("tasks"), () =>
      db
        .select({
          id: taskActivityEvents.id,
          type: taskActivityEvents.type,
          createdAt: taskActivityEvents.createdAt,
          actorName: users.name,
          taskKey: tasks.key,
          taskName: tasks.name,
          taskStatus: tasks.status,
        })
        .from(taskActivityEvents)
        .innerJoin(tasks, eq(tasks.id, taskActivityEvents.taskId))
        .leftJoin(members, eq(members.id, taskActivityEvents.actorMemberId))
        .leftJoin(users, eq(users.id, members.userId))
        .where(
          and(
            eq(taskActivityEvents.organizationId, organizationId),
            tasksVisible,
          ),
        )
        .orderBy(desc(taskActivityEvents.createdAt))
        .limit(6),
    ),
  ]);

  const memberId = currentMember[0]?.id;
  const assignedTasks =
    memberId && enabledModules.has("tasks")
      ? await db
          .select({
            id: tasks.id,
            key: tasks.key,
            name: tasks.name,
            status: tasks.status,
            priority: tasks.priority,
            dueAt: tasks.dueAt,
            updatedAt: tasks.updatedAt,
          })
          .from(tasks)
          .where(
            and(
              eq(tasks.organizationId, organizationId),
              tasksVisible,
              eq(tasks.assignedToMemberId, memberId),
              isNull(tasks.deletedAt),
              or(ne(tasks.status, "done"), isNull(tasks.completedAt)),
            ),
          )
          .orderBy(asc(tasks.dueAt), desc(tasks.updatedAt))
          .limit(4)
      : [];

  const taskItems = assignedTasks.slice(0, 4).map((task) => ({
    id: task.id,
    title: task.name,
    priority: task.priority,
    status: task.status,
    href: paths.task(task.key),
  }));

  const recentWork: DashboardWorkItem[] = [
    ...recentDocs.map((doc) => ({
      id: doc.id,
      kind: "doc" as const,
      title: doc.title,
      label: "Docs",
      updatedAt: formatRelativeDate(doc.updatedAt),
      href: paths.doc(doc.slug),
    })),
    ...recentProjects.map((project) => ({
      id: project.id,
      kind: "project" as const,
      title: project.name,
      label: "Projects",
      updatedAt: formatRelativeDate(project.updatedAt),
      href: paths.project(project.slug),
    })),
    ...recentTasks.slice(0, 2).map((task) => ({
      id: task.id,
      kind: "task" as const,
      title: task.name,
      label: "Tasks",
      updatedAt: formatRelativeDate(task.updatedAt),
      href: paths.task(task.key),
    })),
  ].slice(0, 5);

  const recentActivity: DashboardActivityItem[] = recentEvents.map((event) => ({
    id: event.id,
    user: event.actorName ?? "Someone",
    userInitials: getInitials(event.actorName),
    action: formatActivityAction(event.type),
    target: event.taskName,
    app: "Tasks",
    time: formatRelativeDate(event.createdAt),
    kind: formatActivityKind(event.type, event.taskStatus),
    href: paths.task(event.taskKey),
  }));

  const modules = {
    projects: enabledModules.has("projects"),
    tasks: enabledModules.has("tasks"),
    docs: enabledModules.has("docs"),
  };

  return {
    activityPills: [
      ...(modules.tasks
        ? [
            {
              kind: "tasks" as const,
              label: pluralize(
                dueTodayTaskCount[0]?.count ?? 0,
                "task due",
                "tasks due",
              ),
            },
          ]
        : []),
      ...(modules.docs
        ? [
            {
              kind: "docs" as const,
              label: pluralize(
                docsUpdatedTodayCount[0]?.count ?? 0,
                "doc updated",
                "docs updated",
              ),
            },
          ]
        : []),
    ],
    workspaceStats: [
      { value: memberCount[0]?.count ?? 0, label: "Members" },
      ...(modules.projects
        ? [
            {
              value:
                activeProjectCount[0]?.count ?? projectCount[0]?.count ?? 0,
              label: "Projects",
            },
          ]
        : []),
      ...(modules.tasks
        ? [
            {
              value: openTaskCount[0]?.count ?? taskCount[0]?.count ?? 0,
              label: "Open tasks",
            },
          ]
        : []),
      ...(modules.docs
        ? [{ value: docCount[0]?.count ?? 0, label: "Docs" }]
        : []),
      { value: teamCount[0]?.count ?? 0, label: "Teams" },
    ],
    recentWork,
    recentActivity,
    tasks: taskItems,
    modules,
    links: {
      ...(modules.docs ? { docs: paths.docs(), newDoc: paths.docs() } : {}),
      ...(modules.projects ? { projects: paths.projects() } : {}),
      ...(modules.tasks
        ? { tasks: paths.tasks(), newTask: paths.tasks() }
        : {}),
    },
  };
}
