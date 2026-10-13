import { db } from "@zentro/db";
import { eq } from "@zentro/db/drizzle";
import {
  docComments,
  roles,
  activityEvents,
  taskComments,
  teamMembers,
} from "@zentro/db/schema";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { getDashboardData } from "../../../apps/web/src/lib/dashboard-data";
import { loadPermissionSnapshot } from "../src/server/permissions";
import { World, type TestOrg, type TestUser } from "./helpers";

// A hidden project hides everything under it. Each scenario builds one project
// with a task, task comment, task activity, doc, trashed doc and doc comment,
// then reads every surface as an outsider, a project member and (for the team
// scenario) a member of the owning team.

const world = new World();

afterAll(() => world.cleanup());

type Caller = Awaited<ReturnType<World["caller"]>>;

const notFound = { code: "NOT_FOUND" };

const scenarios = [
  { label: "private", visibility: "private" as const, teamMemberSees: false },
  { label: "team", visibility: "team" as const, teamMemberSees: true },
];

describe.each(scenarios)("$label project visibility", (scenario) => {
  let org: TestOrg;
  let ownerUser: TestUser;
  let outsiderUser: TestUser;
  let memberUser: TestUser;
  let teamUser: TestUser;
  let outsider: Caller;
  let member: Caller;
  let teamMember: Caller;
  let slug: string;
  let projectId: string;
  let taskKey: string;
  let docId: string;
  let docSlug: string;
  let trashedSlug: string;
  let commentId: string;
  let outsiderDocSlug: string;
  let openDocSlug: string;

  beforeAll(async () => {
    org = await world.org(`Visibility ${scenario.label}`);
    const owner = await world.userIn(org, "owner", "Olive Owner");
    const out = await world.userIn(org, "member", "Otto Outsider");
    const mem = await world.userIn(org, "member", "Mia Member");
    const tm = await world.userIn(org, "member", "Tess Team");

    ownerUser = owner.user;
    outsiderUser = out.user;
    memberUser = mem.user;
    teamUser = tm.user;

    const team = await world.team(org);

    await db.insert(teamMembers).values({
      organizationId: org.id,
      teamId: team.id,
      memberId: tm.member.id,
    });

    // A project everyone can see, so empty results are not just empty data.
    const open = await world.project(org, { taskKeyPrefix: "OP" });
    const hidden = await world.project(org, {
      taskKeyPrefix: "HP",
      visibility: scenario.visibility,
      teamId: scenario.visibility === "team" ? team.id : null,
    });

    slug = hidden.slug;
    projectId = hidden.id;
    taskKey = "HP-1";
    openDocSlug = "open-doc";

    const dueSoon = new Date(Date.now() + 2 * 86_400_000);
    const overdue = new Date(Date.now() - 2 * 86_400_000);

    await world.task(org, open, {
      taskNumber: 1,
      name: "Open task",
      createdByMemberId: owner.member.id,
    });
    const task = await world.task(org, hidden, {
      taskNumber: 1,
      name: "Hidden task",
      dueAt: dueSoon,
      createdByMemberId: owner.member.id,
      // Assigned to the outsider: it must still stay out of their lists.
      assignedToMemberId: out.member.id,
    });

    await world.task(org, hidden, {
      taskNumber: 2,
      name: "Hidden overdue task",
      dueAt: overdue,
      createdByMemberId: owner.member.id,
    });

    await db.insert(activityEvents).values({
      organizationId: org.id,
      actorUserId: owner.user.id,
      action: "task.status_changed",
      targetType: "task",
      targetId: task.id,
      targetLabel: task.key,
      projectId: hidden.id,
      metadata: { changes: [{ field: "status", from: "todo", to: "done" }] },
    });
    await db.insert(taskComments).values({
      organizationId: org.id,
      taskId: task.id,
      authorMemberId: owner.member.id,
      body: "secret task comment",
    });

    await world.doc(org, {
      title: "Open doc",
      slug: openDocSlug,
      createdByMemberId: owner.member.id,
    });
    const doc = await world.doc(org, {
      projectId: hidden.id,
      title: "Hidden doc",
      slug: "hidden-doc",
      content: "needle in the hidden doc",
      createdByMemberId: owner.member.id,
    });

    docId = doc.id;
    docSlug = doc.slug;
    trashedSlug = "hidden-trashed";
    outsiderDocSlug = "hidden-by-outsider";

    await world.doc(org, {
      projectId: hidden.id,
      title: "Trashed hidden doc",
      slug: trashedSlug,
      deletedAt: new Date(),
      createdByMemberId: owner.member.id,
    });
    // Written by the outsider, but inside a project they cannot see.
    await world.doc(org, {
      projectId: hidden.id,
      title: "Outsider's own doc",
      slug: outsiderDocSlug,
      createdByMemberId: out.member.id,
    });
    const [comment] = await db
      .insert(docComments)
      .values({
        organizationId: org.id,
        docId: doc.id,
        authorMemberId: owner.member.id,
        body: "secret doc comment",
      })
      .returning();

    commentId = comment!.id;

    await world.assign(
      org,
      await world.systemRoleId(org, "project_viewer"),
      { type: "user", id: mem.user.id },
      { type: "project", id: hidden.id },
    );

    outsider = await world.caller(out.user, org);
    member = await world.caller(mem.user, org);
    teamMember = await world.caller(tm.user, org);
  });

  const hiddenFrom = (label: string) =>
    label === "outsider" ||
    (label === "team member" && !scenario.teamMemberSees);

  describe.each([["outsider"], ["team member"], ["project member"]] as const)(
    "as the %s",
    (label) => {
      const caller = () =>
        label === "outsider"
          ? outsider
          : label === "team member"
            ? teamMember
            : member;
      const user = () =>
        label === "outsider"
          ? outsiderUser
          : label === "team member"
            ? teamUser
            : memberUser;
      const hidden = hiddenFrom(label);

      it("project list and detail", async () => {
        const ids = (await caller().project.getProjectsByOrgId()).map(
          (project) => project.id,
        );

        expect(ids.includes(projectId)).toBe(!hidden);

        if (hidden) {
          await expect(
            caller().project.getProjectBySlug({ slug }),
          ).rejects.toMatchObject(notFound);
          await expect(
            caller().project.getAccess({ slug }),
          ).rejects.toMatchObject(notFound);
        } else {
          await expect(
            caller().project.getProjectBySlug({ slug }),
          ).resolves.toMatchObject({ slug });
        }
      });

      it("task list and calendar data", async () => {
        // The calendar and board are built from this list (with due dates).
        const tasks = await caller().task.getTasksByOrgId({});
        const keys = tasks.map((task) => task.key);

        expect(keys).toContain("OP-1");
        expect(keys.includes("HP-1")).toBe(!hidden);
        expect(keys.includes("HP-2")).toBe(!hidden);
        expect(
          tasks.some((task) => task.projectSlug === slug && task.due),
        ).toBe(!hidden);
      });

      it("task detail by key", async () => {
        const detail = await caller().task.getTaskByKey({ key: taskKey });

        if (hidden) {
          // The same answer as a key that does not exist.
          expect(detail).toBeUndefined();
          await expect(
            caller().task.getTaskByKey({ key: "NOPE-99" }),
          ).resolves.toEqual(detail);
        } else {
          expect(detail).toMatchObject({ key: taskKey });
        }
      });

      it("task overview", async () => {
        const overview = await caller().task.getOverview();
        const everything = [
          ...overview.assignedToMe,
          ...overview.overdue,
          ...overview.recentlyUpdated,
        ].map((task) => task.key);

        expect(everything.some((key) => key.startsWith("HP-"))).toBe(!hidden);
        expect(
          overview.activity.some((event) => event.taskKey.startsWith("HP-")),
        ).toBe(!hidden);

        const total = overview.byStatus.reduce(
          (sum, row) => sum + row.count,
          0,
        );

        expect(total).toBe(hidden ? 1 : 3);
        expect(overview.counts.overdue).toBe(hidden ? 0 : 1);
      });

      it("task comments and activity", async () => {
        if (hidden) {
          await expect(
            caller().comment.getTaskComments({ taskKey }),
          ).rejects.toMatchObject(notFound);
          await expect(
            caller().activity.getTaskActivityEvents({ taskKey }),
          ).rejects.toMatchObject(notFound);
          await expect(
            caller().comment.createTaskComment({ taskKey, body: "hello" }),
          ).rejects.toMatchObject(notFound);
        } else {
          const comments = await caller().comment.getTaskComments({ taskKey });

          expect(comments.map((comment) => comment.body)).toContain(
            "secret task comment",
          );
          expect(
            (await caller().activity.getTaskActivityEvents({ taskKey })).length,
          ).toBeGreaterThan(0);
        }
      });

      it("docs list, recent, my docs and trash", async () => {
        const all = (await caller().docs.getAll({})).map((doc) => doc.slug);
        const trash = (
          await caller().docs.getAll({ includeDeleted: true })
        ).map((doc) => doc.slug);

        expect(all).toContain(openDocSlug);
        expect(all.includes(docSlug)).toBe(!hidden);
        expect(trash.includes(trashedSlug)).toBe(!hidden);

        // "My docs" is the list filtered to the caller's own docs: a doc the
        // outsider wrote in a project they cannot see is not theirs to see.
        const mine = (await caller().docs.getAll({})).filter(
          (doc) => doc.createdByUserId === outsiderUser.id,
        );

        expect(mine.map((doc) => doc.slug).includes(outsiderDocSlug)).toBe(
          label === "outsider" ? false : !hidden,
        );

        // Recent docs are the same list sorted by update time.
        const recent = (await caller().docs.getAll({})).slice(0, 10);

        expect(recent.some((doc) => doc.slug === docSlug)).toBe(!hidden);
        expect(user().id).toBeTruthy();
      });

      it("doc detail by slug and id", async () => {
        if (hidden) {
          await expect(
            caller().docs.getBySlug({ slug: docSlug }),
          ).rejects.toMatchObject(notFound);
          await expect(
            caller().docs.getById({ id: docId }),
          ).rejects.toMatchObject(notFound);
          await expect(
            caller().docs.updateDocTitle({ id: docId, title: "x" }),
          ).rejects.toMatchObject(notFound);
        } else {
          await expect(
            caller().docs.getBySlug({ slug: docSlug }),
          ).resolves.toMatchObject({ slug: docSlug });
        }
      });

      it("doc search", async () => {
        const byBody = await caller().docs.search({ query: "needle" });
        const byProject = await caller().docs.search({ query: "Project" });
        const slugs = [...byBody, ...byProject].map((doc) => doc.slug);

        expect(slugs.includes(docSlug)).toBe(!hidden);
        expect(
          (await caller().docs.search({ query: "", includeDeleted: true }))
            .map((doc) => doc.slug)
            .includes(trashedSlug),
        ).toBe(!hidden);
      });

      it("doc comments", async () => {
        if (hidden) {
          await expect(
            caller().docs.getComments({ docId }),
          ).rejects.toMatchObject(notFound);
          await expect(
            caller().docs.createComment({ docId, body: "hello" }),
          ).rejects.toMatchObject(notFound);
          await expect(
            caller().docs.resolveComment({ id: commentId }),
          ).rejects.toMatchObject(notFound);
        } else {
          expect(
            (await caller().docs.getComments({ docId })).map(
              (comment) => comment.body,
            ),
          ).toContain("secret doc comment");
        }
      });

      it("dashboard counts and my tasks", async () => {
        const snapshot = await loadPermissionSnapshot(db, org.id, user().id);
        const dashboard = await getDashboardData({
          organizationId: org.id,
          userId: user().id,
          enabledModules: new Set(["projects", "tasks", "docs"]),
          snapshot,
        });
        const stat = (name: string) =>
          dashboard.workspaceStats.find((item) => item.label === name)?.value;

        // Open project + hidden project; open task (+2 hidden); docs: open doc
        // (+ hidden doc and the outsider's doc, not the trashed one).
        expect(stat("Projects")).toBe(hidden ? 1 : 2);
        expect(stat("Open tasks")).toBe(hidden ? 1 : 3);
        expect(stat("Docs")).toBe(hidden ? 1 : 3);
        expect(dashboard.tasks.map((task) => task.title)).not.toContain(
          hidden ? "Hidden task" : "never",
        );
        expect(
          dashboard.recentWork.some((item) => item.title.includes("Hidden")),
        ).toBe(!hidden);
        expect(
          dashboard.recentActivity.some((item) => item.action.includes("HP-1")),
        ).toBe(!hidden);
      });

      it("my tasks on the dashboard", async () => {
        // The hidden task is assigned to the outsider.
        const snapshot = await loadPermissionSnapshot(
          db,
          org.id,
          outsiderUser.id,
        );
        const dashboard = await getDashboardData({
          organizationId: org.id,
          userId: outsiderUser.id,
          enabledModules: new Set(["projects", "tasks", "docs"]),
          snapshot,
        });

        expect(dashboard.tasks.map((task) => task.title)).not.toContain(
          "Hidden task",
        );
      });

      it("teams pages show no project data", async () => {
        const teams = await caller().team.getAll();

        expect(teams.length).toBeGreaterThan(0);

        for (const team of teams) {
          expect(JSON.stringify(team)).not.toContain(slug);
          expect(Object.keys(team)).not.toContain("projects");
        }
      });
    },
  );

  it("an owner and an admin always see the project", async () => {
    const ownerCaller = await world.caller(ownerUser, org);

    expect(
      (await ownerCaller.project.getProjectsByOrgId()).map((p) => p.id),
    ).toContain(projectId);
    expect(await ownerCaller.task.getTaskByKey({ key: taskKey })).toMatchObject(
      { key: taskKey },
    );
  });

  it("a deleted task's events stay, only for people who can see its project", async () => {
    const owner = await world.caller(ownerUser, org);

    await owner.task.deleteTaskByKey({ key: "HP-2" });

    const feed = async (user: TestUser) =>
      (
        await getDashboardData({
          organizationId: org.id,
          userId: user.id,
          enabledModules: new Set(["projects", "tasks", "docs"]),
          snapshot: await loadPermissionSnapshot(db, org.id, user.id),
        })
      ).recentActivity.map((item) => item.action);

    expect((await feed(memberUser)).some((text) => text.includes("HP-2"))).toBe(
      true,
    );
    expect(
      (await feed(outsiderUser)).some((text) => text.includes("HP-2")),
    ).toBe(false);
  });
});

describe("what lists of roles and assignments reveal", () => {
  let auditor: Caller;
  let admin: Caller;
  let org: TestOrg;
  let projectName: string;
  let projectId: string;

  beforeAll(async () => {
    org = await world.org("Role lists");
    await world.userIn(org, "owner", "Rhea Owner");
    const adminU = await world.userIn(org, "admin", "Ada Admin");
    const audit = await world.userIn(org, "member", "Audrey Auditor");
    const target = await world.userIn(org, "member", "Tom Target");
    const hidden = await world.project(org, {
      visibility: "private",
      name: "Secret Skunkworks",
    });

    projectName = hidden.name;
    projectId = hidden.id;

    await world.assign(
      org,
      await world.systemRoleId(org, "project_member"),
      { type: "user", id: target.user.id },
      { type: "project", id: hidden.id },
    );
    await world.override(org, target.user, "tasks.assign", "deny", {
      type: "project",
      id: hidden.id,
    });

    const viewer = await world.role(org, {
      name: "Role viewer",
      permissions: ["roles.view"],
    });

    await world.assign(
      org,
      viewer.id,
      { type: "user", id: audit.user.id },
      { type: "organization", id: org.id },
    );

    auditor = await world.caller(audit.user, org);
    admin = await world.caller(adminU.user, org);
  });

  it("an admin sees assignments and overrides on every project", async () => {
    const assignments = await admin.permissions.assignments.list();
    const overrides = await admin.permissions.overrides.list();

    expect(assignments.some((row) => row.scopeName === projectName)).toBe(true);
    expect(overrides.some((row) => row.scopeId === projectId)).toBe(true);
  });

  it("someone who can view roles but not the project does not learn about it", async () => {
    const assignments = await auditor.permissions.assignments.list();
    const overrides = await auditor.permissions.overrides.list();

    expect(JSON.stringify(assignments)).not.toContain(projectName);
    expect(assignments.some((row) => row.scopeId === projectId)).toBe(false);
    expect(overrides.some((row) => row.scopeId === projectId)).toBe(false);
  });
});

describe("project counts follow what the caller may see", () => {
  it("hide task and doc counts, and the headcount, from limited roles", async () => {
    const org = await world.org("Counts");
    const owner = await world.userIn(org, "owner", "Cora Owner");
    const limited = await world.userIn(org, "member", "Lee Limited");
    const other = await world.userIn(org, "member", "Olly Other");
    const project = await world.project(org, { taskKeyPrefix: "CT" });

    await world.task(org, project, {
      taskNumber: 1,
      createdByMemberId: owner.member.id,
    });
    await world.doc(org, {
      projectId: project.id,
      createdByMemberId: owner.member.id,
    });

    const role = await world.role(org, {
      name: "Look only",
      scope: "project",
      permissions: ["projects.view"],
    });

    await world.assign(
      org,
      role.id,
      { type: "user", id: limited.user.id },
      { type: "project", id: project.id },
    );
    await world.assign(
      org,
      role.id,
      { type: "user", id: other.user.id },
      { type: "project", id: project.id },
    );

    // Take everything but project viewing away from the Member role.
    await db
      .update(roles)
      .set({ permissions: ["projects.view"] })
      .where(eq(roles.id, await world.systemRoleId(org, "member")));

    const ownerView = await (
      await world.caller(owner.user, org)
    ).project.getProjectBySlug({ slug: project.slug });
    const limitedView = await (
      await world.caller(limited.user, org)
    ).project.getProjectBySlug({ slug: project.slug });

    expect(ownerView).toMatchObject({
      totalTasks: 1,
      totalDocs: 1,
      totalMembers: 3,
    });
    expect(limitedView).toMatchObject({
      totalTasks: 0,
      openTasks: 0,
      totalDocs: 0,
      // The two people with a role on this project, not the whole organization.
      totalMembers: 2,
    });
  });
});
