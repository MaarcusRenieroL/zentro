import { db } from "@zentro/db";
import { eq } from "@zentro/db/drizzle";
import { roles, teamMembers } from "@zentro/db/schema";
import { afterAll, describe, expect, it } from "vitest";

import { getDashboardData } from "../../../apps/web/src/lib/dashboard-data";
import { loadPermissionSnapshot } from "../src/server/permissions";
import { World, type TestOrg, type TestUser } from "./helpers";

const world = new World();

afterAll(() => world.cleanup());

const forbidden = { code: "FORBIDDEN" };
const notFound = { code: "NOT_FOUND" };

/** Replaces what the organization's Member role grants. */
async function setMemberRole(org: TestOrg, permissions: string[]) {
  await db
    .update(roles)
    .set({ permissions })
    .where(eq(roles.id, await world.systemRoleId(org, "member")));
}

async function addToTeam(org: TestOrg, teamId: string, member: { id: string }) {
  await db
    .insert(teamMembers)
    .values({ organizationId: org.id, teamId, memberId: member.id });
}

describe("access that comes only from a project or team role", () => {
  async function build() {
    const org = await world.org("Project only");
    const owner = await world.userIn(org, "owner", "Pia Owner");
    const worker = await world.userIn(org, "member", "Pat Project");
    // Nothing organization-wide except knowing the modules exist.
    await setMemberRole(org, ["modules.view"]);

    const mine = await world.project(org, {
      taskKeyPrefix: "MY",
      name: "My project",
    });
    const other = await world.project(org, {
      taskKeyPrefix: "OT",
      name: "Other project",
    });

    for (const [project, label] of [
      [mine, "mine"],
      [other, "other"],
    ] as const) {
      await world.task(org, project, {
        taskNumber: 1,
        name: `${label} task`,
        createdByMemberId: owner.member.id,
        assignedToMemberId: label === "mine" ? worker.member.id : null,
      });
      await world.doc(org, {
        projectId: project.id,
        slug: `${label}-doc`,
        title: `${label} doc`,
        createdByMemberId: owner.member.id,
      });
    }

    await world.doc(org, {
      slug: "org-wide-doc",
      title: "Org wide doc",
      createdByMemberId: owner.member.id,
    });
    await world.assign(
      org,
      await world.systemRoleId(org, "project_member"),
      { type: "user", id: worker.user.id },
      { type: "project", id: mine.id },
    );

    return { org, owner, worker, mine, other };
  }

  it("reports the modules as reachable although nothing is granted organization-wide", async () => {
    const { org, worker } = await build();
    const as = await world.caller(worker.user, org);
    const me = await as.permissions.me();

    expect(me.permissions["projects.view"]).toBe(false);
    expect(me.permissions["tasks.view"]).toBe(false);
    expect(me.permissions["docs.view"]).toBe(false);
    expect(me.reachable["projects.view"]).toBe(true);
    expect(me.reachable["tasks.view"]).toBe(true);
    expect(me.reachable["docs.view"]).toBe(true);
    expect(me.reachable["tasks.create"]).toBe(true);
    // Not granted on the project, so not reachable.
    expect(me.reachable["projects.update"]).toBe(false);
    expect(me.reachable["members.view"]).toBe(false);
    expect(me.reachable["roles.view"]).toBe(false);
  });

  it("someone with no role anywhere reaches nothing", async () => {
    const { org } = await build();
    const nobody = await world.userIn(org, "member", "Nina Nobody");
    const me = await (await world.caller(nobody.user, org)).permissions.me();

    expect(me.reachable["projects.view"]).toBe(false);
    expect(me.reachable["tasks.view"]).toBe(false);
    expect(me.reachable["docs.view"]).toBe(false);
  });

  it("shows only the projects they have a role in, with their tasks and docs", async () => {
    const { org, worker, mine } = await build();
    const as = await world.caller(worker.user, org);

    expect((await as.project.getProjectsByOrgId()).map((p) => p.id)).toEqual([
      mine.id,
    ]);
    expect((await as.task.getTasksByOrgId({})).map((t) => t.key)).toEqual([
      "MY-1",
    ]);
    expect((await as.docs.getAll({})).map((d) => d.slug)).toEqual(["mine-doc"]);
    expect((await as.docs.search({ query: "doc" })).map((d) => d.slug)).toEqual(
      ["mine-doc"],
    );

    const overview = await as.task.getOverview();

    expect(overview.recentlyUpdated.map((t) => t.key)).toEqual(["MY-1"]);
    expect(overview.assignedToMe.map((t) => t.key)).toEqual(["MY-1"]);
  });

  it("can open their project and its task and doc, and nothing else", async () => {
    const { org, worker, mine, other } = await build();
    const as = await world.caller(worker.user, org);

    await expect(
      as.project.getProjectBySlug({ slug: mine.slug }),
    ).resolves.toMatchObject({ slug: mine.slug, totalTasks: 1, totalDocs: 1 });
    await expect(as.task.getTaskByKey({ key: "MY-1" })).resolves.toMatchObject({
      key: "MY-1",
    });
    await expect(
      as.docs.getBySlug({ slug: "mine-doc" }),
    ).resolves.toMatchObject({ slug: "mine-doc" });
    // Another project they hold no role on: the same refusal as for a slug
    // that does not exist, since neither is reachable for them.
    await expect(
      as.project.getProjectBySlug({ slug: other.slug }),
    ).rejects.toMatchObject(forbidden);
    await expect(
      as.project.getProjectBySlug({ slug: "no-such-project" }),
    ).rejects.toMatchObject(forbidden);
    await expect(
      as.docs.getBySlug({ slug: "other-doc" }),
    ).rejects.toMatchObject(forbidden);
    await expect(
      as.docs.getBySlug({ slug: "org-wide-doc" }),
    ).rejects.toMatchObject(forbidden);
  });

  it("the dashboard counts and links follow the same reach", async () => {
    const { org, worker } = await build();
    const snapshot = await loadPermissionSnapshot(db, org.id, worker.user.id);
    const dashboard = await getDashboardData({
      organizationId: org.id,
      userId: worker.user.id,
      enabledModules: new Set(["projects", "tasks", "docs"]),
      snapshot,
    });
    const stat = (label: string) =>
      dashboard.workspaceStats.find((item) => item.label === label)?.value;

    expect(stat("Projects")).toBe(1);
    expect(stat("Open tasks")).toBe(1);
    expect(stat("Docs")).toBe(1);
    // No members.view or teams.view anywhere, so those headcounts stay out.
    expect(stat("Members")).toBeUndefined();
    expect(stat("Teams")).toBeUndefined();
    expect(dashboard.tasks.map((task) => task.title)).toEqual(["mine task"]);
    expect(dashboard.links).toMatchObject({
      projects: "/projects",
      tasks: "/tasks",
      docs: "/docs",
      newTask: "/tasks",
      newDoc: "/docs",
    });
  });

  it("a role given on a team reaches that team's projects and docs", async () => {
    const org = await world.org("Team scope");
    const owner = await world.userIn(org, "owner", "Tia Owner");
    const worker = await world.userIn(org, "member", "Wes Worker");
    const team = await world.team(org);
    const elsewhere = await world.team(org);

    await setMemberRole(org, []);

    const project = await world.project(org, {
      taskKeyPrefix: "TM",
      teamId: team.id,
    });
    const foreign = await world.project(org, {
      taskKeyPrefix: "FG",
      teamId: elsewhere.id,
    });

    await world.task(org, project, {
      taskNumber: 1,
      createdByMemberId: owner.member.id,
    });
    await world.task(org, foreign, {
      taskNumber: 1,
      createdByMemberId: owner.member.id,
    });
    await world.doc(org, {
      teamId: team.id,
      slug: "team-doc",
      createdByMemberId: owner.member.id,
    });
    await world.doc(org, {
      teamId: elsewhere.id,
      slug: "foreign-team-doc",
      createdByMemberId: owner.member.id,
    });

    const viewer = await world.role(org, {
      name: "Team reader",
      scope: "team",
      permissions: ["teams.view", "projects.view", "tasks.view", "docs.view"],
    });

    await world.assign(
      org,
      viewer.id,
      { type: "user", id: worker.user.id },
      { type: "team", id: team.id },
    );

    const as = await world.caller(worker.user, org);
    const me = await as.permissions.me();

    expect(me.reachable["projects.view"]).toBe(true);
    expect(me.reachable["tasks.view"]).toBe(true);
    expect(me.reachable["docs.view"]).toBe(true);
    expect(me.reachable["teams.view"]).toBe(true);
    expect((await as.task.getTasksByOrgId({})).map((t) => t.key)).toEqual([
      "TM-1",
    ]);
    expect((await as.docs.getAll({})).map((d) => d.slug)).toEqual(["team-doc"]);
    await expect(
      as.docs.getBySlug({ slug: "foreign-team-doc" }),
    ).rejects.toMatchObject(forbidden);
    // Only the team they hold a role on shows up.
    expect((await as.team.getAll()).map((t) => t.id)).toEqual([team.id]);
  });
});

describe("team leads manage their own team", () => {
  async function build() {
    const org = await world.org("Team leads");
    const owner = await world.userIn(org, "owner", "Odin Owner");
    const lead = await world.userIn(org, "member", "Lena Lead");
    const mate = await world.userIn(org, "member", "Milo Mate");
    const boss = await world.userIn(org, "admin", "Bea Boss");
    const stranger = await world.userIn(org, "member", "Sam Stranger");
    const team = await world.team(org, { name: "Alpha" });
    const otherTeam = await world.team(org, { name: "Beta" });

    // Like a custom setup where members cannot see roles at all.
    await setMemberRole(org, ["members.view", "teams.view"]);

    for (const person of [lead, mate, boss]) {
      await addToTeam(org, team.id, person.member);
    }

    await addToTeam(org, otherTeam.id, stranger.member);
    await addToTeam(org, otherTeam.id, lead.member);

    const teamLead = await world.systemRoleId(org, "team_lead");

    await world.assign(
      org,
      teamLead,
      { type: "user", id: lead.user.id },
      { type: "team", id: team.id },
    );

    return {
      org,
      owner,
      lead,
      mate,
      boss,
      stranger,
      team,
      otherTeam,
      teamMemberRole: await world.systemRoleId(org, "team_member"),
      teamLead,
    };
  }

  it("has no organization-wide role access", async () => {
    const { org, lead } = await build();
    const as = await world.caller(lead.user, org);
    const me = await as.permissions.me();

    expect(me.permissions["roles.view"]).toBe(false);
    expect(me.permissions["roles.assign"]).toBe(false);
    await expect(as.permissions.roles.list()).rejects.toMatchObject(forbidden);
    await expect(as.permissions.assignments.list()).rejects.toMatchObject(
      forbidden,
    );
  });

  it("views the roles on their own team", async () => {
    const { org, lead, team, mate, teamMemberRole } = await build();

    await world.assign(
      org,
      teamMemberRole,
      { type: "user", id: mate.user.id },
      { type: "team", id: team.id },
    );

    const panel = await (
      await world.caller(lead.user, org)
    ).permissions.assignments.listForTeam({ teamId: team.id });

    expect(panel.teamRoles.map((role) => role.name)).toEqual(
      expect.arrayContaining(["Team lead", "Team member"]),
    );
    expect(panel.assignments.map((row) => row.principalName).sort()).toEqual(
      ["Lena Lead", "Milo Mate"].sort(),
    );
  });

  it("cannot view the roles of a team they do not lead", async () => {
    const { org, lead, otherTeam } = await build();
    const as = await world.caller(lead.user, org);

    await expect(
      as.permissions.assignments.listForTeam({ teamId: otherTeam.id }),
    ).rejects.toMatchObject(forbidden);
  });

  it("assigns and removes team roles for the team's members", async () => {
    const { org, lead, mate, team, teamMemberRole } = await build();
    const as = await world.caller(lead.user, org);
    const assignment = await as.permissions.assignments.assign({
      roleId: teamMemberRole,
      principalType: "user",
      principalId: mate.user.id,
      scopeType: "team",
      scopeId: team.id,
    });

    expect(assignment.scopeId).toBe(team.id);
    await expect(
      as.permissions.assignments.unassign({ assignmentId: assignment.id }),
    ).resolves.toEqual({ id: assignment.id });
  });

  it("cannot assign to people outside the team or in another team", async () => {
    const { org, lead, stranger, team, otherTeam, teamMemberRole } =
      await build();
    const as = await world.caller(lead.user, org);

    await expect(
      as.permissions.assignments.assign({
        roleId: teamMemberRole,
        principalType: "user",
        principalId: stranger.user.id,
        scopeType: "team",
        scopeId: team.id,
      }),
    ).rejects.toMatchObject(forbidden);
    // They lead Alpha only, even though they sit in Beta too.
    await expect(
      as.permissions.assignments.assign({
        roleId: teamMemberRole,
        principalType: "user",
        principalId: stranger.user.id,
        scopeType: "team",
        scopeId: otherTeam.id,
      }),
    ).rejects.toMatchObject(forbidden);
  });

  it("cannot grant what they do not hold", async () => {
    const { org, lead, mate, team } = await build();
    const powerful = await world.role(org, {
      name: "Team task admin",
      scope: "team",
      permissions: ["teams.view", "tasks.view", "tasks.delete_any"],
    });

    await expect(
      (await world.caller(lead.user, org)).permissions.assignments.assign({
        roleId: powerful.id,
        principalType: "user",
        principalId: mate.user.id,
        scopeType: "team",
        scopeId: team.id,
      }),
    ).rejects.toMatchObject(forbidden);
  });

  it("cannot edit themselves, an owner or an admin above them", async () => {
    const { org, owner, lead, boss, team, teamMemberRole } = await build();
    const as = await world.caller(lead.user, org);

    await addToTeam(org, team.id, owner.member);

    for (const target of [lead, owner, boss]) {
      await expect(
        as.permissions.assignments.assign({
          roleId: teamMemberRole,
          principalType: "user",
          principalId: target.user.id,
          scopeType: "team",
          scopeId: team.id,
        }),
      ).rejects.toMatchObject(forbidden);
    }
  });

  it("cannot remove an admin's or their own team role", async () => {
    const { org, lead, boss, team, teamMemberRole, teamLead } = await build();
    const adminRole = await world.assign(
      org,
      teamMemberRole,
      { type: "user", id: boss.user.id },
      { type: "team", id: team.id },
    );
    const own = (
      await db.query.roleAssignments.findMany({
        where: (table, { and, eq }) =>
          and(eq(table.principalId, lead.user.id), eq(table.roleId, teamLead)),
      })
    )[0]!;
    const as = await world.caller(lead.user, org);

    await expect(
      as.permissions.assignments.unassign({ assignmentId: adminRole.id }),
    ).rejects.toMatchObject(forbidden);
    await expect(
      as.permissions.assignments.unassign({ assignmentId: own.id }),
    ).rejects.toMatchObject(forbidden);
  });

  it("cannot assign organization or project roles", async () => {
    const { org, lead, mate, team } = await build();
    const project = await world.project(org);
    const orgRole = await world.role(org, {
      name: "Org reader",
      permissions: ["teams.view"],
    });
    const as = await world.caller(lead.user, org);
    const projectRole = await world.systemRoleId(org, "project_viewer");

    await expect(
      as.permissions.assignments.assign({
        roleId: orgRole.id,
        principalType: "team",
        principalId: team.id,
        scopeType: "organization",
        scopeId: org.id,
      }),
    ).rejects.toMatchObject(forbidden);
    await expect(
      as.permissions.assignments.assign({
        roleId: projectRole,
        principalType: "user",
        principalId: mate.user.id,
        scopeType: "project",
        scopeId: project.id,
      }),
    ).rejects.toMatchObject(forbidden);
  });

  it("manages the members of their own team only", async () => {
    const { org, lead, mate, stranger, team, otherTeam } = await build();
    const as = await world.caller(lead.user, org);

    await expect(
      as.team.updateMembers({
        teamId: team.id,
        memberIds: [lead.member.id, mate.member.id, stranger.member.id],
      }),
    ).resolves.toMatchObject({ memberIds: expect.any(Array) });
    await expect(
      as.team.updateMembers({ teamId: otherTeam.id, memberIds: [] }),
    ).rejects.toMatchObject(forbidden);
    // They cannot rename or delete the team.
    await expect(
      as.team.update({ id: team.id, name: "Renamed", color: "slate" }),
    ).rejects.toMatchObject(forbidden);
    await expect(as.team.delete({ id: team.id })).rejects.toMatchObject(
      forbidden,
    );
  });

  it("a plain member of the team can do none of this", async () => {
    const { org, mate, team, lead, teamMemberRole } = await build();
    const as = await world.caller(mate.user, org);

    await expect(
      as.permissions.assignments.listForTeam({ teamId: team.id }),
    ).rejects.toMatchObject(forbidden);
    await expect(
      as.permissions.assignments.assign({
        roleId: teamMemberRole,
        principalType: "user",
        principalId: lead.user.id,
        scopeType: "team",
        scopeId: team.id,
      }),
    ).rejects.toMatchObject(forbidden);
  });

  it("an admin can still assign to anyone on any team", async () => {
    const { org, boss, stranger, otherTeam, teamMemberRole } = await build();

    await expect(
      (await world.caller(boss.user, org)).permissions.assignments.assign({
        roleId: teamMemberRole,
        principalType: "user",
        principalId: stranger.user.id,
        scopeType: "team",
        scopeId: otherTeam.id,
      }),
    ).resolves.toMatchObject({ scopeId: otherTeam.id });
  });
});

describe("own-resource permissions", () => {
  async function build() {
    const org = await world.org("Own resources");
    const owner = await world.userIn(org, "owner", "Ola Owner");
    const author = await world.userIn(org, "member", "Ann Author");
    const bystander = await world.userIn(org, "member", "Bo Bystander");
    const editor = await world.userIn(org, "member", "Eli Editor");

    // Members keep viewing, creating and commenting, but only touch their own.
    await setMemberRole(org, [
      "projects.view",
      "tasks.view",
      "tasks.create",
      "tasks.update_own",
      "tasks.delete_own",
      "docs.view",
      "docs.create",
      "docs.update_own",
      "docs.trash_own",
      "docs.restore",
    ]);

    const anyRole = await world.role(org, {
      name: "Edit anything",
      permissions: [
        "tasks.update_any",
        "tasks.delete_any",
        "docs.update_any",
        "docs.trash_any",
      ],
    });

    await world.assign(
      org,
      anyRole.id,
      { type: "user", id: editor.user.id },
      { type: "organization", id: org.id },
    );

    const project = await world.project(org, { taskKeyPrefix: "OW" });
    const asAuthor = await world.caller(author.user, org);
    const asOwner = await world.caller(owner.user, org);
    const mine = await asAuthor.task.createTask({
      projectId: project.id,
      name: "Mine",
    });
    const theirs = await asOwner.task.createTask({
      projectId: project.id,
      name: "Theirs",
    });
    const myDoc = await asAuthor.docs.create({
      projectId: project.id,
      title: "My doc",
      slug: "my-own-doc",
    });
    const theirDoc = await asOwner.docs.create({
      projectId: project.id,
      title: "Their doc",
      slug: "their-own-doc",
    });

    return {
      org,
      project,
      owner,
      author,
      bystander,
      editor,
      mine,
      theirs,
      myDoc,
      theirDoc,
      asAuthor,
    };
  }

  it("returns who created a task and a doc", async () => {
    const { asAuthor, mine, theirs, myDoc, owner, author } = await build();

    expect(
      (await asAuthor.task.getTaskByKey({ key: mine.key }))?.createdByUserId,
    ).toBe(author.user.id);
    expect(
      (await asAuthor.task.getTaskByKey({ key: theirs.key }))?.createdByUserId,
    ).toBe(owner.user.id);
    expect(
      (await asAuthor.docs.getById({ id: myDoc.id })).createdByUserId,
    ).toBe(author.user.id);
    expect(
      (await asAuthor.docs.getBySlug({ slug: "their-own-doc" }))
        .createdByUserId,
    ).toBe(owner.user.id);
    expect(
      (await asAuthor.docs.getAll({})).map((doc) => [
        doc.slug,
        doc.createdByUserId,
      ]),
    ).toEqual(
      expect.arrayContaining([
        ["my-own-doc", author.user.id],
        ["their-own-doc", owner.user.id],
      ]),
    );
  });

  it("answers _own permissions for the item's creator only", async () => {
    const { org, project, author, owner, bystander, editor } = await build();
    const check = async (user: TestUser, ownerUserId?: string) =>
      (
        await (
          await world.caller(user, org)
        ).permissions.check({ projectId: project.id, ownerUserId })
      ).permissions;

    const asCreator = await check(author.user, author.user.id);
    const asOther = await check(author.user, owner.user.id);
    const noOwner = await check(author.user);

    for (const key of [
      "tasks.update_own",
      "tasks.delete_own",
      "docs.update_own",
      "docs.trash_own",
    ]) {
      expect(asCreator[key], `${key} on own item`).toBe(true);
      expect(asOther[key], `${key} on someone else's item`).toBe(false);
      expect(noOwner[key], `${key} with no owner`).toBe(false);
    }

    // Nobody can claim ownership of someone else's item.
    expect(
      (await check(bystander.user, author.user.id))["tasks.update_own"],
    ).toBe(false);

    // The _any permission applies to every item.
    const any = await check(editor.user, owner.user.id);

    expect(any["tasks.update_any"]).toBe(true);
    expect(any["docs.trash_any"]).toBe(true);
    expect(asCreator["tasks.update_any"]).toBe(false);
  });

  it("enforces _own on tasks", async () => {
    const { org, author, editor, mine, theirs } = await build();
    const own = await world.caller(author.user, org);
    const any = await world.caller(editor.user, org);

    await expect(
      own.task.updateTaskByKey({ key: mine.key, name: "Renamed" }),
    ).resolves.toMatchObject({ name: "Renamed" });
    await expect(
      own.task.updateTaskByKey({ key: theirs.key, name: "Hijack" }),
    ).rejects.toMatchObject(forbidden);
    await expect(
      own.task.deleteTaskByKey({ key: theirs.key }),
    ).rejects.toMatchObject(forbidden);
    await expect(
      any.task.updateTaskByKey({ key: theirs.key, name: "Edited by any" }),
    ).resolves.toMatchObject({ name: "Edited by any" });
    await expect(any.task.deleteTaskByKey({ key: mine.key })).resolves.toEqual(
      expect.objectContaining({ key: mine.key }),
    );
    await expect(
      own.task.deleteTaskByKey({ key: theirs.key }),
    ).rejects.toMatchObject(forbidden);
  });

  it("enforces _own on docs", async () => {
    const { org, author, editor, myDoc, theirDoc } = await build();
    const own = await world.caller(author.user, org);
    const any = await world.caller(editor.user, org);

    await expect(
      own.docs.updateDocTitle({ id: myDoc.id, title: "Mine, edited" }),
    ).resolves.toMatchObject({ title: "Mine, edited" });
    await expect(
      own.docs.updateDocTitle({ id: theirDoc.id, title: "Hijack" }),
    ).rejects.toMatchObject(forbidden);
    await expect(
      own.docs.updateDocContent({ id: theirDoc.id, content: "x" }),
    ).rejects.toMatchObject(forbidden);
    await expect(own.docs.delete({ id: theirDoc.id })).rejects.toMatchObject(
      forbidden,
    );
    await expect(
      any.docs.updateDocContent({ id: theirDoc.id, content: "by any" }),
    ).resolves.toMatchObject({ content: "by any" });
    await expect(any.docs.delete({ id: myDoc.id })).resolves.toMatchObject({
      id: myDoc.id,
    });
    await expect(own.docs.delete({ id: theirDoc.id })).rejects.toMatchObject(
      forbidden,
    );
    await expect(own.docs.delete({ id: myDoc.id })).rejects.toMatchObject(
      notFound,
    );
  });
});
