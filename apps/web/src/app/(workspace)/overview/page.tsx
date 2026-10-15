import { JSX } from "react";

import { db } from "@zentro/db";
import { and, asc, count, eq, isNull, sql } from "@zentro/db/drizzle";
import { projects, tasks, teamMembers, teams } from "@zentro/db/schema";

import { UnauthorizedEmptyState } from "~/src/components/workspace/authorization/authorization-boundary";
import { OverviewBento } from "~/src/components/workspace/overview/overview-bento";
import { getDashboardContext } from "~/src/lib/dashboard-context";
import { getDashboardData } from "~/src/lib/dashboard-data";
import { getTodayData } from "~/src/lib/today-data";

export const metadata = { title: "Overview" };

export default async function OverviewPage(): Promise<JSX.Element> {
  const { organization, session, enabledModules, snapshot } =
    await getDashboardContext();

  if (snapshot.baseRole !== "owner" && snapshot.baseRole !== "admin") {
    return (
      <UnauthorizedEmptyState
        title="Overview is for owners and admins"
        description="Your own work is on Today."
      />
    );
  }

  const modules = new Set(enabledModules);
  const input = {
    organizationId: organization.id,
    userId: session.user.id,
    enabledModules: modules,
    snapshot,
  };
  const [data, today] = await Promise.all([
    getDashboardData(input),
    getTodayData(input),
  ]);

  // Per-project and per-team numbers for the breakdown tables.
  const done = sql<number>`count(${tasks.id}) filter (where ${tasks.status} = 'done')`;
  const open = sql<number>`count(${tasks.id}) filter (where ${tasks.status} <> 'done')`;
  const [projectRows, teamRows, memberRows] = await Promise.all([
    modules.has("projects") && modules.has("tasks")
      ? db
          .select({
            name: projects.name,
            slug: projects.slug,
            open,
            done,
          })
          .from(projects)
          .leftJoin(
            tasks,
            and(eq(tasks.projectId, projects.id), isNull(tasks.deletedAt)),
          )
          .where(eq(projects.organizationId, organization.id))
          .groupBy(projects.id)
          .orderBy(asc(projects.name))
      : [],
    db
      .select({
        id: teams.id,
        name: teams.name,
        projects: count(sql`distinct ${projects.id}`),
      })
      .from(teams)
      .leftJoin(projects, eq(projects.teamId, teams.id))
      .where(eq(teams.organizationId, organization.id))
      .groupBy(teams.id)
      .orderBy(asc(teams.name)),
    db
      .select({ teamId: teamMembers.teamId, people: count() })
      .from(teamMembers)
      .where(eq(teamMembers.organizationId, organization.id))
      .groupBy(teamMembers.teamId),
  ]);
  const people = new Map(memberRows.map((row) => [row.teamId, row.people]));

  return (
    <OverviewBento
      orgName={organization.name}
      data={data}
      week={today.week}
      projectRows={projectRows.map((row) => ({
        name: row.name,
        slug: row.slug,
        open: Number(row.open),
        done: Number(row.done),
      }))}
      teamRows={teamRows.map((row) => ({
        id: row.id,
        name: row.name,
        projects: Number(row.projects),
        people: Number(people.get(row.id) ?? 0),
      }))}
    />
  );
}
