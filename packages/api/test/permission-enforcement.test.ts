import {
  auth,
  disabledOrganizationPaths,
  ensureSystemRoles,
} from "@zentro/auth";
import { db } from "@zentro/db";
import { and, eq } from "@zentro/db/drizzle";
import {
  members,
  permissionChangeLogs,
  projects,
  roles,
  teamMembers,
} from "@zentro/db/schema";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { World, type TestOrg, type TestUser } from "./helpers";

const world = new World();

afterAll(() => world.cleanup());

type Caller = Awaited<ReturnType<World["caller"]>>;

const forbidden = { code: "FORBIDDEN" };
const notFound = { code: "NOT_FOUND" };

async function expectAllowed(promise: Promise<unknown>) {
  await expect(promise).resolves.not.toThrow();
}

describe("default roles reproduce today's behavior", () => {
  let org: TestOrg;
  let owner: Caller;
  let admin: Caller;
  let member: Caller;
  let projectSlug: string;
  let teamId: string;
  let adminUser: TestUser;
  let memberUser: TestUser;

  beforeAll(async () => {
    org = await world.org("Defaults");
    const o = await world.userIn(org, "owner", "Owen Owner");
    const a = await world.userIn(org, "admin", "Ada Admin");
    const m = await world.userIn(org, "member", "Max Member");

    adminUser = a.user;
    memberUser = m.user;
    owner = await world.caller(o.user, org);
    admin = await world.caller(a.user, org);
    member = await world.caller(m.user, org);

    const project = await world.project(org, { taskKeyPrefix: "DF" });
    projectSlug = project.slug;
    teamId = (await world.team(org)).id;
    await world.task(org, project, { taskNumber: 1, name: "Seed task" });
  });

  it("lets a member do everyday work", async () => {
    const project = await db
      .select()
      .from(projects)
      .where(eq(projects.slug, projectSlug));
    const projectId = project[0]!.id;

    const task = await member.task.createTask({ projectId, name: "By member" });
    await expectAllowed(
      member.task.updateTaskByKey({ key: task.key, status: "in-progress" }),
    );
    // Any task, not only their own.
    await expectAllowed(
      member.task.updateTaskByKey({ key: "DF-1", priority: "high" }),
    );
    await expectAllowed(member.task.deleteTaskByKey({ key: "DF-1" }));
    await expectAllowed(
      member.comment.createTaskComment({ taskKey: task.key, body: "hi" }),
    );
    await expectAllowed(
      member.activity.getTaskActivityEvents({ taskKey: task.key }),
    );

    const doc = await member.docs.create({ title: "Doc", slug: "member-doc" });
    await expectAllowed(
      member.docs.updateDocTitle({ id: doc.id, title: "New" }),
    );
    await expectAllowed(
      member.docs.createComment({ docId: doc.id, body: "c" }),
    );
    await expectAllowed(member.docs.delete({ id: doc.id }));
    await expectAllowed(member.docs.restore({ id: doc.id }));

    await expectAllowed(member.project.getProjectsByOrgId());
    await expectAllowed(member.project.getProjectBySlug({ slug: projectSlug }));
    await expectAllowed(member.team.getAll());
    await expectAllowed(member.member.getMembers());
    await expectAllowed(member.modules.list());
    await expectAllowed(member.task.getOverview());
    await expectAllowed(member.docs.search({ query: "x" }));
  });

  it("keeps administrative actions away from members", async () => {
    await expect(
      member.project.createProject({
        name: "No",
        slug: "no-project",
        description: "",
      }),
    ).rejects.toMatchObject(forbidden);
    await expect(
      member.project.updateProjectBySlug({
        currentSlug: projectSlug,
        name: "Renamed",
        slug: projectSlug,
        description: "",
      }),
    ).rejects.toMatchObject(forbidden);
    await expect(
      member.project.archiveProject({ slug: projectSlug }),
    ).rejects.toMatchObject(forbidden);
    await expect(
      member.project.deleteProject({ slug: projectSlug }),
    ).rejects.toMatchObject(forbidden);
    await expect(
      member.team.create({ name: "Nope team", color: "slate" }),
    ).rejects.toMatchObject(forbidden);
    await expect(member.team.delete({ id: teamId })).rejects.toMatchObject(
      forbidden,
    );
    await expect(
      member.team.updateMembers({ teamId, memberIds: [] }),
    ).rejects.toMatchObject(forbidden);
    await expect(
      member.modules.setEnabled({ moduleId: "docs", enabled: false }),
    ).rejects.toMatchObject(forbidden);
    await expect(member.invitation.list()).rejects.toMatchObject(forbidden);
    await expect(
      member.invitation.invite({ email: "x@example.test", role: "member" }),
    ).rejects.toMatchObject(forbidden);
    await expect(
      member.organization.update({ name: "Hijacked" }),
    ).rejects.toMatchObject(forbidden);
    await expect(
      member.member.updateRole({ memberId: randomId(), role: "admin" }),
    ).rejects.toMatchObject(forbidden);
    await expect(member.permissions.roles.list()).rejects.toMatchObject(
      forbidden,
    );
    await expect(member.permissions.log.list()).rejects.toMatchObject(
      forbidden,
    );
  });

  it("lets an admin do everything except owner-only actions", async () => {
    await expectAllowed(
      admin.project.createProject({
        name: "By admin",
        slug: "by-admin",
        description: "",
      }),
    );
    await expectAllowed(
      admin.team.create({ name: "Admin team", color: "slate" }),
    );
    await expectAllowed(
      admin.modules.setEnabled({ moduleId: "docs", enabled: true }),
    );
    await expectAllowed(admin.invitation.list());
    await expectAllowed(admin.permissions.roles.list());
    await expectAllowed(admin.permissions.log.list());
    await expectAllowed(admin.organization.update({ name: "Defaults" }));

    await expect(admin.organization.delete()).rejects.toMatchObject(forbidden);
    await expect(
      admin.member.transferOwnership({ memberId: randomId() }),
    ).rejects.toMatchObject(forbidden);
  });

  it("lets the owner do owner-only actions", async () => {
    const [target] = await db
      .select()
      .from(members)
      .where(
        and(
          eq(members.organizationId, org.id),
          eq(members.userId, adminUser.id),
        ),
      );

    await expect(
      owner.member.transferOwnership({ memberId: target!.id }),
    ).resolves.toBeDefined();

    const [former] = await db
      .select()
      .from(members)
      .where(
        and(eq(members.organizationId, org.id), eq(members.role, "admin")),
      );

    expect(former).toBeDefined();

    // Hand it back so later tests keep their fixtures.
    await db
      .update(members)
      .set({ role: "admin" })
      .where(eq(members.userId, adminUser.id));
    await db
      .update(members)
      .set({ role: "owner" })
      .where(
        and(
          eq(members.organizationId, org.id),
          eq(members.role, "admin"),
          eq(members.userId, memberUser.id),
        ),
      );
  });
});

function randomId() {
  return crypto.randomUUID();
}

describe("custom roles, project roles and overrides", () => {
  let org: TestOrg;
  let owner: Caller;
  let restricted: TestUser;
  let projectId: string;
  let projectSlug: string;
  let otherProjectSlug: string;

  beforeAll(async () => {
    org = await world.org("Restricted");
    owner = await world.caller((await world.userIn(org, "owner")).user, org);
    restricted = (await world.userIn(org, "member", "Restricted Rita")).user;

    // The base Member role grants nothing but project viewing.
    await ensureSystemRoles(db, org.id);
    await db
      .update(roles)
      .set({ permissions: ["projects.view"] })
      .where(
        and(eq(roles.organizationId, org.id), eq(roles.systemKey, "member")),
      );

    const project = await world.project(org, { taskKeyPrefix: "RS" });
    const other = await world.project(org, { taskKeyPrefix: "RT" });

    projectId = project.id;
    projectSlug = project.slug;
    otherProjectSlug = other.slug;
    await world.task(org, project, { taskNumber: 1, name: "Scoped task" });
    await world.task(org, other, { taskNumber: 1, name: "Other task" });
  });

  it("a member with a trimmed Member role has no task access by default", async () => {
    const caller = await world.caller(restricted, org);

    await expect(caller.task.getTasksByOrgId({})).resolves.toEqual([]);
    await expect(
      caller.task.createTask({ projectId, name: "Nope" }),
    ).rejects.toMatchObject(forbidden);
  });

  it("a project viewer reads inside the project and nothing else", async () => {
    const viewerRole = await world.systemRoleId(org, "project_viewer");

    await world.assign(
      org,
      viewerRole,
      { type: "user", id: restricted.id },
      { type: "project", id: projectId },
    );

    const caller = await world.caller(restricted, org);
    const tasks = await caller.task.getTasksByOrgId({});

    expect(tasks.map((task) => task.key)).toEqual(["RS-1"]);
    await expectAllowed(caller.task.getTaskByKey({ key: "RS-1" }));
    await expect(
      caller.task.createTask({ projectId, name: "Viewer write" }),
    ).rejects.toMatchObject(forbidden);
    await expect(
      caller.task.updateTaskByKey({ key: "RS-1", name: "x" }),
    ).rejects.toMatchObject(forbidden);
    await expect(
      caller.comment.createTaskComment({ taskKey: "RS-1", body: "x" }),
    ).rejects.toMatchObject(forbidden);
  });

  it("a project member can create and edit tasks in that project only", async () => {
    const memberRole = await world.systemRoleId(org, "project_member");
    const user = (await world.userIn(org, "member", "Pat Project")).user;

    await world.assign(
      org,
      memberRole,
      { type: "user", id: user.id },
      { type: "project", id: projectId },
    );

    const caller = await world.caller(user, org);
    const created = await caller.task.createTask({
      projectId,
      name: "Project member task",
    });

    await expectAllowed(
      caller.task.updateTaskByKey({ key: created.key, status: "review" }),
    );
    await expect(
      caller.task.updateTaskByKey({ key: "RT-1", name: "elsewhere" }),
    ).rejects.toMatchObject(forbidden);
    await expect(
      caller.project.updateProjectBySlug({
        currentSlug: projectSlug,
        name: "x",
        slug: projectSlug,
        description: "",
      }),
    ).rejects.toMatchObject(forbidden);
  });

  it("a project lead can update the project and manage its members", async () => {
    const leadRole = await world.systemRoleId(org, "project_lead");
    const lead = (await world.userIn(org, "member", "Lena Lead")).user;
    const pal = (await world.userIn(org, "member", "Pal Person")).user;

    await world.assign(
      org,
      leadRole,
      { type: "user", id: lead.id },
      { type: "project", id: projectId },
    );

    const caller = await world.caller(lead, org);

    await expectAllowed(
      caller.project.updateProjectBySlug({
        currentSlug: projectSlug,
        name: "Led project",
        slug: projectSlug,
        description: "",
      }),
    );
    await expect(
      caller.project.deleteProject({ slug: projectSlug }),
    ).rejects.toMatchObject(forbidden);

    // Managing project members goes through assignments.
    const viewerRole = await world.systemRoleId(org, "project_viewer");
    const assignment = await caller.permissions.assignments.assign({
      roleId: viewerRole,
      principalType: "user",
      principalId: pal.id,
      scopeType: "project",
      scopeId: projectId,
    });

    expect(assignment.scopeType).toBe("project");
    await expect(
      caller.permissions.assignments.assign({
        roleId: viewerRole,
        principalType: "user",
        principalId: pal.id,
        scopeType: "project",
        scopeId: (
          await db
            .select()
            .from(projects)
            .where(eq(projects.slug, otherProjectSlug))
        )[0]!.id,
      }),
    ).rejects.toMatchObject(forbidden);
  });

  it("a custom organization role grants exactly what it lists", async () => {
    const role = await world.role(org, {
      name: "Viewer plus comment",
      permissions: ["tasks.view", "tasks.comment", "projects.view"],
    });
    const user = (await world.userIn(org, "member", "Cleo Custom")).user;

    await world.assign(
      org,
      role.id,
      { type: "user", id: user.id },
      { type: "organization", id: org.id },
    );

    const caller = await world.caller(user, org);

    await expectAllowed(
      caller.comment.createTaskComment({ taskKey: "RS-1", body: "ok" }),
    );
    await expect(
      caller.task.updateTaskByKey({ key: "RS-1", name: "x" }),
    ).rejects.toMatchObject(forbidden);
    await expect(
      caller.task.createTask({ projectId, name: "x" }),
    ).rejects.toMatchObject(forbidden);
  });

  it("a deny override beats a role grant", async () => {
    const role = await world.role(org, {
      name: "Doc worker",
      permissions: ["docs.view", "docs.create"],
    });
    const user = (await world.userIn(org, "member", "Dan Denied")).user;

    await world.assign(
      org,
      role.id,
      { type: "user", id: user.id },
      { type: "organization", id: org.id },
    );
    await expectAllowed(
      (await world.caller(user, org)).docs.create({
        title: "Before",
        slug: "before-deny",
      }),
    );

    await world.override(org, user, "docs.create", "deny");

    await expect(
      (await world.caller(user, org)).docs.create({
        title: "After",
        slug: "after-deny",
      }),
    ).rejects.toMatchObject(forbidden);
  });

  it("an allow override adds a single permission", async () => {
    const user = (await world.userIn(org, "member", "Alex Allowed")).user;

    await expect(
      (await world.caller(user, org)).team.create({
        name: "Allow team",
        color: "slate",
      }),
    ).rejects.toMatchObject(forbidden);

    await world.override(org, user, "teams.create", "allow");

    await expectAllowed(
      (await world.caller(user, org)).team.create({
        name: "Allow team",
        color: "slate",
      }),
    );
  });

  it("a user who is not a member has no access at all", async () => {
    const stranger = await world.user("Stranger");
    const caller = await world.caller(stranger, org);

    await expect(caller.project.getProjectsByOrgId()).rejects.toMatchObject(
      forbidden,
    );
    await expect(caller.task.getTasksByOrgId({})).rejects.toMatchObject(
      forbidden,
    );
    await expect(caller.member.getMembers()).rejects.toMatchObject(forbidden);
    await expect(caller.modules.list()).rejects.toMatchObject(forbidden);
  });

  it("team role assignments apply to every member of the team", async () => {
    const team = await world.team(org, { name: "Docs squad" });
    const user = (await world.userIn(org, "member", "Tess Teammate")).user;
    const [member] = await db
      .select()
      .from(members)
      .where(
        and(eq(members.userId, user.id), eq(members.organizationId, org.id)),
      );
    const role = await world.role(org, {
      name: "Docs writers",
      permissions: ["docs.view", "docs.create"],
    });

    await expect(
      (await world.caller(user, org)).docs.create({
        title: "T1",
        slug: "team-doc-1",
      }),
    ).rejects.toMatchObject(forbidden);

    await db.insert(teamMembers).values({
      organizationId: org.id,
      teamId: team.id,
      memberId: member!.id,
    });
    await world.assign(
      org,
      role.id,
      { type: "team", id: team.id },
      { type: "organization", id: org.id },
    );

    await expectAllowed(
      (await world.caller(user, org)).docs.create({
        title: "T2",
        slug: "team-doc-2",
      }),
    );
  });

  it("owners keep working whatever the roles say", async () => {
    await expectAllowed(
      owner.project.createProject({
        name: "Owner project",
        slug: "owner-project",
        description: "",
      }),
    );
  });
});

describe("project visibility", () => {
  let org: TestOrg;
  let outsider: Caller;
  let teamMember: Caller;
  let assigned: Caller;
  let admin: Caller;
  let ids: { orgProject: string; teamProject: string; privateProject: string };

  beforeAll(async () => {
    org = await world.org("Visibility");
    const owner = await world.userIn(org, "owner");
    const adminU = await world.userIn(org, "admin");
    const out = await world.userIn(org, "member", "Olly Outsider");
    const tm = await world.userIn(org, "member", "Tina Team");
    const as = await world.userIn(org, "member", "Andy Assigned");
    const team = await world.team(org, { name: "Visible team" });

    await db.insert(teamMembers).values({
      organizationId: org.id,
      teamId: team.id,
      memberId: tm.member.id,
    });

    const orgProject = await world.project(org, {
      taskKeyPrefix: "VO",
      visibility: "organization",
    });
    const teamProject = await world.project(org, {
      taskKeyPrefix: "VT",
      visibility: "team",
      teamId: team.id,
    });
    const privateProject = await world.project(org, {
      taskKeyPrefix: "VP",
      visibility: "private",
    });

    ids = {
      orgProject: orgProject.id,
      teamProject: teamProject.id,
      privateProject: privateProject.id,
    };

    for (const [project, label] of [
      [orgProject, "O"],
      [teamProject, "T"],
      [privateProject, "P"],
    ] as const) {
      await world.task(org, project, {
        taskNumber: 1,
        name: `${label} task`,
        createdByMemberId: owner.member.id,
      });
      await world.doc(org, {
        projectId: project.id,
        title: `${label} doc`,
        slug: `${label.toLowerCase()}-doc`,
      });
    }

    await world.assign(
      org,
      await world.systemRoleId(org, "project_viewer"),
      { type: "user", id: as.user.id },
      { type: "project", id: privateProject.id },
    );

    outsider = await world.caller(out.user, org);
    teamMember = await world.caller(tm.user, org);
    assigned = await world.caller(as.user, org);
    admin = await world.caller(adminU.user, org);
  });

  it("an outsider sees only organization-visible projects, in every list", async () => {
    expect(
      (await outsider.project.getProjectsByOrgId()).map((p) => p.id),
    ).toEqual([ids.orgProject]);
    expect((await outsider.task.getTasksByOrgId({})).map((t) => t.key)).toEqual(
      ["VO-1"],
    );
    expect((await outsider.docs.getAll({})).map((d) => d.slug)).toEqual([
      "o-doc",
    ]);
    expect(
      (await outsider.docs.search({ query: "doc" })).map((d) => d.slug),
    ).toEqual(["o-doc"]);

    const overview = await outsider.task.getOverview();

    expect(overview.recentlyUpdated.map((t) => t.key)).toEqual(["VO-1"]);
    expect(overview.byStatus.reduce((sum, row) => sum + row.count, 0)).toBe(1);
  });

  it("hidden projects and their contents look like they do not exist", async () => {
    // Same answer as an unknown key, so keys cannot be probed.
    await expect(
      outsider.task.getTaskByKey({ key: "VP-1" }),
    ).resolves.toBeUndefined();
    await expect(
      outsider.docs.getBySlug({ slug: "p-doc" }),
    ).rejects.toMatchObject(notFound);
    await expect(
      outsider.project.getProjectBySlug({
        slug: (
          await db
            .select()
            .from(projects)
            .where(eq(projects.id, ids.privateProject))
        )[0]!.slug,
      }),
    ).rejects.toMatchObject(notFound);
    await expect(
      outsider.task.updateTaskByKey({ key: "VP-1", name: "x" }),
    ).rejects.toMatchObject(notFound);
    await expect(
      outsider.task.createTask({ projectId: ids.privateProject, name: "x" }),
    ).rejects.toMatchObject(notFound);
  });

  it("team members also see the team project", async () => {
    expect(
      (await teamMember.project.getProjectsByOrgId()).map((p) => p.id).sort(),
    ).toEqual([ids.orgProject, ids.teamProject].sort());
    expect(
      (await teamMember.task.getTasksByOrgId({})).map((t) => t.key).sort(),
    ).toEqual(["VO-1", "VT-1"]);
  });

  it("a project assignment reveals a private project", async () => {
    expect(
      (await assigned.project.getProjectsByOrgId()).map((p) => p.id).sort(),
    ).toEqual([ids.orgProject, ids.privateProject].sort());
    expect((await assigned.docs.getAll({})).map((d) => d.slug).sort()).toEqual([
      "o-doc",
      "p-doc",
    ]);
  });

  it("admins can see every project", async () => {
    expect((await admin.project.getProjectsByOrgId()).length).toBe(3);
    expect((await admin.docs.getAll({})).length).toBe(3);
  });

  it("changing visibility needs projects.settings.manage and takes effect", async () => {
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, ids.orgProject));

    await expect(
      outsider.project.updateAccess({
        slug: project!.slug,
        visibility: "private",
        teamId: null,
      }),
    ).rejects.toMatchObject(forbidden);

    await admin.project.updateAccess({
      slug: project!.slug,
      visibility: "private",
      teamId: null,
    });

    expect((await outsider.project.getProjectsByOrgId()).length).toBe(0);

    await admin.project.updateAccess({
      slug: project!.slug,
      visibility: "organization",
      teamId: null,
    });
  });

  it("a team-visible project needs a team", async () => {
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, ids.orgProject));

    await expect(
      admin.project.updateAccess({
        slug: project!.slug,
        visibility: "team",
        teamId: null,
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});

describe("escalation and lockout rules", () => {
  let org: TestOrg;
  let owner: Caller;
  let ownerUser: TestUser;
  let admin: Caller;
  let adminUser: TestUser;
  let helper: TestUser;
  let helperCaller: Caller;
  let target: TestUser;

  beforeAll(async () => {
    org = await world.org("Escalation");
    const o = await world.userIn(org, "owner", "Eve Owner");
    const a = await world.userIn(org, "admin", "Abe Admin");

    ownerUser = o.user;
    adminUser = a.user;
    owner = await world.caller(o.user, org);
    admin = await world.caller(a.user, org);
    target = (await world.userIn(org, "member", "Tom Target")).user;

    // Someone who may manage roles but holds little else.
    helper = (await world.userIn(org, "member", "Hal Helper")).user;
    const manager = await world.role(org, {
      name: "Role manager",
      permissions: [
        "roles.view",
        "roles.create",
        "roles.update",
        "roles.delete",
        "roles.assign",
        "permissions.overrides.manage",
        "members.role.update",
        "members.invite",
        "members.view",
        "tasks.view",
      ],
    });

    await world.assign(
      org,
      manager.id,
      { type: "user", id: helper.id },
      { type: "organization", id: org.id },
    );
    helperCaller = await world.caller(helper, org);
  });

  it("cannot create a role with permissions the caller does not hold", async () => {
    await expect(
      helperCaller.permissions.roles.create({
        name: "Too much",
        scope: "organization",
        permissions: ["projects.delete"],
      }),
    ).rejects.toMatchObject(forbidden);
    await expectAllowed(
      helperCaller.permissions.roles.create({
        name: "Fits",
        scope: "organization",
        permissions: ["tasks.view"],
      }),
    );
  });

  it("cannot grant owner-only or scope-invalid permissions in a role", async () => {
    await expect(
      owner.permissions.roles.create({
        name: "Owner stuff",
        scope: "organization",
        permissions: ["org.delete"],
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(
      owner.permissions.roles.create({
        name: "Bad scope",
        scope: "team",
        permissions: ["projects.create"],
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(
      owner.permissions.roles.create({
        name: "Unknown",
        scope: "organization",
        permissions: ["nope.nothing"],
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("cannot edit a role that contains permissions the caller does not hold", async () => {
    const strong = await world.role(org, {
      name: "Strong",
      permissions: ["projects.delete", "tasks.view"],
    });

    await expect(
      helperCaller.permissions.roles.update({
        id: strong.id,
        description: "x",
      }),
    ).rejects.toMatchObject(forbidden);
    await expect(
      helperCaller.permissions.assignments.assign({
        roleId: strong.id,
        principalType: "user",
        principalId: target.id,
        scopeType: "organization",
        scopeId: org.id,
      }),
    ).rejects.toMatchObject(forbidden);
  });

  it("cannot change your own roles or overrides", async () => {
    const [anyRole] = await db
      .select()
      .from(roles)
      .where(and(eq(roles.organizationId, org.id), eq(roles.name, "Fits")));

    await expect(
      helperCaller.permissions.assignments.assign({
        roleId: anyRole!.id,
        principalType: "user",
        principalId: helper.id,
        scopeType: "organization",
        scopeId: org.id,
      }),
    ).rejects.toMatchObject(forbidden);
    await expect(
      helperCaller.permissions.overrides.set({
        userId: helper.id,
        permission: "tasks.view",
        effect: "allow",
        scopeType: "organization",
        scopeId: org.id,
      }),
    ).rejects.toMatchObject(forbidden);
  });

  it("cannot modify an owner", async () => {
    const [anyRole] = await db
      .select()
      .from(roles)
      .where(and(eq(roles.organizationId, org.id), eq(roles.name, "Fits")));

    await expect(
      helperCaller.permissions.assignments.assign({
        roleId: anyRole!.id,
        principalType: "user",
        principalId: ownerUser.id,
        scopeType: "organization",
        scopeId: org.id,
      }),
    ).rejects.toMatchObject(forbidden);
    await expect(
      admin.permissions.overrides.set({
        userId: ownerUser.id,
        permission: "tasks.view",
        effect: "deny",
        scopeType: "organization",
        scopeId: org.id,
      }),
    ).rejects.toMatchObject(forbidden);
  });

  it("cannot allow a permission the caller does not hold", async () => {
    await expect(
      helperCaller.permissions.overrides.set({
        userId: target.id,
        permission: "projects.delete",
        effect: "allow",
        scopeType: "organization",
        scopeId: org.id,
      }),
    ).rejects.toMatchObject(forbidden);
  });

  it("cannot promote someone to a role the caller does not fully hold", async () => {
    const [targetMember] = await db
      .select()
      .from(members)
      .where(
        and(eq(members.userId, target.id), eq(members.organizationId, org.id)),
      );

    await expect(
      helperCaller.member.updateRole({
        memberId: targetMember!.id,
        role: "admin",
      }),
    ).rejects.toMatchObject(forbidden);
  });

  it("the Owner role is immutable and system roles keep their names", async () => {
    const all = await owner.permissions.roles.list();
    const ownerRole = all.find((role) => role.systemKey === "owner")!;
    const adminRole = all.find((role) => role.systemKey === "admin")!;

    await expect(
      owner.permissions.roles.update({ id: ownerRole.id, permissions: [] }),
    ).rejects.toMatchObject(forbidden);
    await expect(
      owner.permissions.roles.update({ id: adminRole.id, name: "Boss" }),
    ).rejects.toMatchObject(forbidden);
    await expect(
      owner.permissions.roles.delete({ id: adminRole.id }),
    ).rejects.toMatchObject(forbidden);
    await expect(
      owner.permissions.roles.update({
        id: all.find((role) => role.systemKey === "project_lead")!.id,
        description: "x",
      }),
    ).rejects.toMatchObject(forbidden);
  });

  it("Admin and Member can be edited and reset to their defaults", async () => {
    const all = await owner.permissions.roles.list();
    const memberRole = all.find((role) => role.systemKey === "member")!;
    const defaults = memberRole.permissions;

    await owner.permissions.roles.update({
      id: memberRole.id,
      permissions: defaults.filter((key) => key !== "tasks.delete_any"),
    });

    const edited = await owner.permissions.roles.get({ id: memberRole.id });

    expect(edited.permissions).not.toContain("tasks.delete_any");

    const reset = await owner.permissions.roles.resetSystem({
      systemKey: "member",
    });

    expect([...reset.permissions].sort()).toEqual([...defaults].sort());
  });

  it("an assigned custom role cannot be deleted until it is unassigned", async () => {
    const role = await world.role(org, {
      name: "Assigned role",
      permissions: ["tasks.view"],
    });
    const assignment = await owner.permissions.assignments.assign({
      roleId: role.id,
      principalType: "user",
      principalId: target.id,
      scopeType: "organization",
      scopeId: org.id,
    });

    await expect(
      owner.permissions.roles.delete({ id: role.id }),
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: expect.stringContaining("assigned 1 time"),
    });

    await owner.permissions.assignments.unassign({
      assignmentId: assignment.id,
    });
    await expect(
      owner.permissions.roles.delete({ id: role.id }),
    ).resolves.toBeDefined();
  });

  it("base roles cannot be assigned like custom roles, and scopes must match", async () => {
    const all = await owner.permissions.roles.list();

    await expect(
      owner.permissions.assignments.assign({
        roleId: all.find((role) => role.systemKey === "admin")!.id,
        principalType: "user",
        principalId: target.id,
        scopeType: "organization",
        scopeId: org.id,
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(
      owner.permissions.assignments.assign({
        roleId: all.find((role) => role.systemKey === "project_viewer")!.id,
        principalType: "user",
        principalId: target.id,
        scopeType: "organization",
        scopeId: org.id,
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("owners cannot be demoted or removed, and only an owner transfers ownership", async () => {
    const [ownerMember] = await db
      .select()
      .from(members)
      .where(
        and(
          eq(members.userId, ownerUser.id),
          eq(members.organizationId, org.id),
        ),
      );

    await expect(
      admin.member.updateRole({ memberId: ownerMember!.id, role: "member" }),
    ).rejects.toMatchObject(forbidden);
    await expect(
      admin.member.remove({ memberId: ownerMember!.id }),
    ).rejects.toMatchObject(forbidden);
    await expect(
      owner.member.remove({ memberId: ownerMember!.id }),
    ).rejects.toMatchObject(forbidden);
    await expect(
      owner.member.updateRole({ memberId: ownerMember!.id, role: "admin" }),
    ).rejects.toMatchObject(forbidden);
    await expect(
      admin.member.transferOwnership({ memberId: ownerMember!.id }),
    ).rejects.toMatchObject(forbidden);
  });

  it("cannot change your own base role or remove yourself", async () => {
    const [adminMember] = await db
      .select()
      .from(members)
      .where(
        and(
          eq(members.userId, adminUser.id),
          eq(members.organizationId, org.id),
        ),
      );

    await expect(
      admin.member.updateRole({ memberId: adminMember!.id, role: "member" }),
    ).rejects.toMatchObject(forbidden);
    await expect(
      admin.member.remove({ memberId: adminMember!.id }),
    ).rejects.toMatchObject(forbidden);
  });

  it("removing a member clears their access", async () => {
    const leaving = (await world.userIn(org, "member", "Lee Leaving")).user;
    const role = await world.role(org, {
      name: "Leaving role",
      permissions: ["tasks.view"],
    });
    const [row] = await db
      .select()
      .from(members)
      .where(
        and(eq(members.userId, leaving.id), eq(members.organizationId, org.id)),
      );

    await world.assign(
      org,
      role.id,
      { type: "user", id: leaving.id },
      { type: "organization", id: org.id },
    );
    await world.override(org, leaving, "docs.view", "allow");
    await admin.member.remove({ memberId: row!.id });

    const remaining = await owner.permissions.assignments.list({
      userId: leaving.id,
    });
    const overrides = await owner.permissions.overrides.list({
      userId: leaving.id,
    });

    expect(remaining).toEqual([]);
    expect(overrides).toEqual([]);
  });

  it("ownership transfer makes the target owner and the caller admin", async () => {
    const newOwner = (await world.userIn(org, "member", "Nina New")).user;
    const [row] = await db
      .select()
      .from(members)
      .where(
        and(
          eq(members.userId, newOwner.id),
          eq(members.organizationId, org.id),
        ),
      );

    await owner.member.transferOwnership({ memberId: row!.id });

    const roles = await db
      .select({ userId: members.userId, role: members.role })
      .from(members)
      .where(eq(members.organizationId, org.id));

    expect(roles.find((m) => m.userId === newOwner.id)?.role).toBe("owner");
    expect(roles.find((m) => m.userId === ownerUser.id)?.role).toBe("admin");
  });
});

describe("tenant isolation of roles, assignments, overrides and the log", () => {
  let orgA: TestOrg;
  let orgB: TestOrg;
  let asA: Caller;
  let userB: TestUser;
  let roleB: { id: string };

  beforeAll(async () => {
    orgA = await world.org("Iso A");
    orgB = await world.org("Iso B");
    asA = await world.caller((await world.userIn(orgA, "owner")).user, orgA);
    userB = (await world.userIn(orgB, "member", "Bee")).user;
    roleB = await world.role(orgB, {
      name: "Secret role",
      permissions: ["tasks.view"],
    });
    await world.assign(
      orgB,
      roleB.id,
      { type: "user", id: userB.id },
      { type: "organization", id: orgB.id },
    );
    await world.override(orgB, userB, "docs.view", "deny");
  });

  it("does not list another organization's roles, assignments, overrides or log", async () => {
    const list = await asA.permissions.roles.list();

    expect(list.map((role) => role.id)).not.toContain(roleB.id);
    expect(list.every((role) => role.name !== "Secret role")).toBe(true);
    await expect(
      asA.permissions.assignments.list({ userId: userB.id }),
    ).resolves.toEqual([]);
    await expect(
      asA.permissions.overrides.list({ userId: userB.id }),
    ).resolves.toEqual([]);

    const log = await asA.permissions.log.list();

    expect(log.items.every((item) => item.targetId !== userB.id)).toBe(true);
  });

  it("cannot read, change or assign another organization's roles", async () => {
    await expect(
      asA.permissions.roles.get({ id: roleB.id }),
    ).rejects.toMatchObject(notFound);
    await expect(
      asA.permissions.roles.update({ id: roleB.id, description: "x" }),
    ).rejects.toMatchObject(notFound);
    await expect(
      asA.permissions.roles.delete({ id: roleB.id }),
    ).rejects.toMatchObject(notFound);
    await expect(
      asA.permissions.assignments.assign({
        roleId: roleB.id,
        principalType: "user",
        principalId: userB.id,
        scopeType: "organization",
        scopeId: orgA.id,
      }),
    ).rejects.toMatchObject(notFound);
    await expect(
      asA.permissions.explain({ userId: userB.id, permission: "tasks.view" }),
    ).rejects.toMatchObject(notFound);
  });

  it("a role in one organization grants nothing in another", async () => {
    const mixed = (await world.userIn(orgB, "member", "Mixed")).user;

    await world.assign(
      orgB,
      roleB.id,
      { type: "user", id: mixed.id },
      { type: "organization", id: orgB.id },
    );

    // The same user is also a plain member of org A.
    await world.member(orgA, mixed, "member");

    const inA = (await world.caller(mixed, orgA)).permissions.me();

    expect((await inA).permissions["tasks.view"]).toBe(true); // from A's Member role, not B's
    expect((await inA).permissions["projects.create"]).toBe(false);
  });
});

describe("permission log", () => {
  it("records role, assignment and override changes with before and after", async () => {
    const org = await world.org("Logged");
    const owner = await world.caller(
      (await world.userIn(org, "owner")).user,
      org,
    );
    const target = (await world.userIn(org, "member", "Log Target")).user;

    const role = await owner.permissions.roles.create({
      name: "Logged role",
      scope: "organization",
      permissions: ["tasks.view"],
    });

    await owner.permissions.roles.update({
      id: role.id,
      permissions: ["tasks.view", "docs.view"],
    });

    const assignment = await owner.permissions.assignments.assign({
      roleId: role.id,
      principalType: "user",
      principalId: target.id,
      scopeType: "organization",
      scopeId: org.id,
    });

    await owner.permissions.overrides.set({
      userId: target.id,
      permission: "docs.view",
      effect: "deny",
      scopeType: "organization",
      scopeId: org.id,
      reason: "testing",
    });
    await owner.permissions.assignments.unassign({
      assignmentId: assignment.id,
    });

    const log = await owner.permissions.log.list();
    const actions = log.items.map((item) => item.action);

    expect(actions).toEqual(
      expect.arrayContaining([
        "role.created",
        "role.updated",
        "assignment.created",
        "override.created",
        "assignment.removed",
      ]),
    );

    const updated = log.items.find((item) => item.action === "role.updated")!;

    expect((updated.before as { permissions: string[] }).permissions).toEqual([
      "tasks.view",
    ]);
    expect((updated.after as { permissions: string[] }).permissions).toEqual([
      "tasks.view",
      "docs.view",
    ]);

    // Filtering by target.
    const forTarget = await owner.permissions.log.list({
      limit: 30,
      targetId: target.id,
    });

    expect(forTarget.items.every((item) => item.targetId === target.id)).toBe(
      true,
    );
  });

  it("has no procedure that updates or deletes log entries", async () => {
    const { appRouter } = await import("../src/server/root");
    const logProcedures = Object.keys(appRouter._def.procedures).filter(
      (path) => path.startsWith("permissions.log."),
    );

    expect(logProcedures).toEqual(["permissions.log.list"]);
  });

  it("restricts reading the log", async () => {
    const org = await world.org("Log access");
    const member = await world.caller(
      (await world.userIn(org, "member")).user,
      org,
    );
    const admin = await world.caller(
      (await world.userIn(org, "admin")).user,
      org,
    );

    await expect(member.permissions.log.list()).rejects.toMatchObject(
      forbidden,
    );
    await expect(admin.permissions.log.list()).resolves.toBeDefined();
  });
});

describe("explain, me and check", () => {
  it("explain reports the decision and its reasons for another user", async () => {
    const org = await world.org("Explain");
    const owner = await world.caller(
      (await world.userIn(org, "owner")).user,
      org,
    );
    const user = (await world.userIn(org, "member", "Exa Plain")).user;

    const allowed = await owner.permissions.explain({
      userId: user.id,
      permission: "tasks.create",
    });

    expect(allowed.allowed).toBe(true);
    expect(allowed.reasons[0]!.message).toContain("Member");

    await world.override(org, user, "tasks.create", "deny");

    const denied = await owner.permissions.explain({
      userId: user.id,
      permission: "tasks.create",
    });

    expect(denied.allowed).toBe(false);
    expect(denied.reasons[0]!.kind).toBe("override");
  });

  it("me reports base role and a permission map; check scopes to a project", async () => {
    const org = await world.org("Me");
    const { user } = await world.userIn(org, "member");
    const caller = await world.caller(user, org);
    const me = await caller.permissions.me();

    expect(me.baseRole).toBe("member");
    expect(me.permissions["tasks.create"]).toBe(true);
    expect(me.permissions["projects.create"]).toBe(false);

    const project = await world.project(org, { visibility: "private" });
    const scoped = await caller.permissions.check({ projectId: project.id });

    expect(scoped.permissions["tasks.view"]).toBe(false);
  });
});

describe("system roles", () => {
  it("are seeded idempotently under concurrent first access", async () => {
    const org = await world.org("Seeding");

    await Promise.all(
      Array.from({ length: 12 }, () => ensureSystemRoles(db, org.id)),
    );

    const rows = await db
      .select()
      .from(roles)
      .where(eq(roles.organizationId, org.id));

    expect(rows).toHaveLength(8);
    expect(new Set(rows.map((role) => role.systemKey)).size).toBe(8);
  });

  it("are created on the first permission check", async () => {
    const org = await world.org("Lazy roles");
    const { user } = await world.userIn(org, "member");

    expect(
      await db.select().from(roles).where(eq(roles.organizationId, org.id)),
    ).toHaveLength(0);

    await (await world.caller(user, org)).permissions.me();

    expect(
      await db.select().from(roles).where(eq(roles.organizationId, org.id)),
    ).toHaveLength(8);
  });
});

describe("Better Auth endpoints cannot be called directly", () => {
  it("answers 404 for every disabled organization endpoint, even with a valid owner session", async () => {
    const org = await world.org("Direct calls");
    const { user } = await world.userIn(org, "owner");
    const headers = await world.sessionHeaders(user, org);

    headers.set("content-type", "application/json");

    for (const path of disabledOrganizationPaths) {
      for (const method of ["POST", "GET"]) {
        const response = await auth.handler(
          new Request(`http://localhost:3000/api/auth${path}`, {
            method,
            headers,
            body:
              method === "POST"
                ? JSON.stringify({ organizationId: org.id })
                : undefined,
          }),
        );

        expect(response.status, `${method} ${path}`).toBe(404);
      }
    }
  });

  it("members cannot invite, remove or re-role through the raw endpoints", async () => {
    const org = await world.org("Raw member");
    const member = await world.userIn(org, "member");
    const other = await world.userIn(org, "member");
    const headers = await world.sessionHeaders(member.user, org);

    headers.set("content-type", "application/json");

    const call = (path: string, body: unknown) =>
      auth.handler(
        new Request(`http://localhost:3000/api/auth${path}`, {
          method: "POST",
          headers,
          body: JSON.stringify(body),
        }),
      );

    expect(
      (
        await call("/organization/invite-member", {
          email: "x@example.test",
          role: "admin",
          organizationId: org.id,
        })
      ).status,
    ).toBe(404);
    expect(
      (
        await call("/organization/remove-member", {
          memberIdOrEmail: other.member.id,
          organizationId: org.id,
        })
      ).status,
    ).toBe(404);
    expect(
      (
        await call("/organization/update-member-role", {
          memberId: other.member.id,
          role: "owner",
          organizationId: org.id,
        })
      ).status,
    ).toBe(404);
    expect(
      (
        await call("/organization/update", {
          data: { name: "Hijacked" },
          organizationId: org.id,
        })
      ).status,
    ).toBe(404);
    expect(
      (await call("/organization/delete", { organizationId: org.id })).status,
    ).toBe(404);

    const [row] = await db
      .select()
      .from(members)
      .where(eq(members.id, other.member.id));

    expect(row?.role).toBe("member");
  });

  it("the tRPC procedures work for people who hold the permission", async () => {
    const org = await world.org("Via trpc");
    const owner = await world.caller(
      (await world.userIn(org, "owner")).user,
      org,
    );
    const admin = await world.caller(
      (await world.userIn(org, "admin")).user,
      org,
    );
    const member = await world.userIn(org, "member");

    const invitation = await admin.invitation.invite({
      email: "new.person@example.test",
      role: "member",
    });

    expect(invitation.email).toBe("new.person@example.test");
    await expect(
      admin.invitation.resend({ invitationId: invitation.id }),
    ).resolves.toBeDefined();
    await expect(
      admin.invitation.cancel({ invitationId: invitation.id }),
    ).resolves.toBeDefined();
    await expect(
      admin.member.updateRole({ memberId: member.member.id, role: "admin" }),
    ).resolves.toEqual({ memberId: member.member.id, role: "admin" });
    await expect(
      admin.member.remove({ memberId: member.member.id }),
    ).resolves.toBeDefined();

    // Invitations of another organization are out of reach.
    const other = await world.org("Other invites");
    const otherOwner = await world.userIn(other, "owner");
    const foreign = await world.invitation(other, otherOwner.user, {
      email: "foreign@example.test",
    });

    await expect(
      admin.invitation.cancel({ invitationId: foreign.id }),
    ).rejects.toMatchObject(notFound);
    await expect(
      owner.invitation.resend({ invitationId: foreign.id }),
    ).rejects.toMatchObject(notFound);
    await expect(owner.invitation.list()).resolves.not.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: foreign.id })]),
    );
  });

  it("log rows exist for member removal", async () => {
    const org = await world.org("Removal log");
    const owner = await world.caller(
      (await world.userIn(org, "owner")).user,
      org,
    );
    const member = await world.userIn(org, "member");

    await owner.member.remove({ memberId: member.member.id });

    const rows = await db
      .select()
      .from(permissionChangeLogs)
      .where(eq(permissionChangeLogs.organizationId, org.id));

    expect(rows.map((row) => row.action)).toContain("member.removed");
  });
});
