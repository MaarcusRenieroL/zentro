import { db } from "@zentro/db";
import { and, asc, eq } from "@zentro/db/drizzle";
import { activityEvents } from "@zentro/db/schema";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createAuditContext } from "../src/server/audit";
import { World, type TestOrg, type TestUser } from "./helpers";

const world = new World();

afterAll(() => world.cleanup());

type Caller = Awaited<ReturnType<World["caller"]>>;

async function events(org: TestOrg, action?: string) {
  const rows = await db
    .select()
    .from(activityEvents)
    .where(
      action
        ? and(
            eq(activityEvents.organizationId, org.id),
            eq(activityEvents.action, action),
          )
        : eq(activityEvents.organizationId, org.id),
    )
    .orderBy(asc(activityEvents.createdAt), asc(activityEvents.id));

  return rows;
}

describe("events are recorded for every mutation", () => {
  let org: TestOrg;
  let owner: Caller;
  let ownerUser: TestUser;
  let memberUser: TestUser;
  let memberId: string;
  let projectId: string;
  let projectSlug: string;
  let teamId: string;

  beforeAll(async () => {
    org = await world.org("Recording");
    const o = await world.userIn(org, "owner", "Olive Owner");
    const m = await world.userIn(org, "member", "Max Member");

    ownerUser = o.user;
    memberUser = m.user;
    memberId = m.member.id;
    owner = await world.caller(o.user, org, {
      headers: {
        "x-forwarded-for": "203.0.113.7, 10.0.0.1",
        "user-agent": "Vitest/1.0",
      },
    });

    const project = await owner.project.createProject({
      name: "Atlas",
      slug: "atlas",
      description: "",
    });

    projectId = project.id;
    projectSlug = project.slug;
    teamId = (
      await owner.team.create({
        name: "Platform",
        color: "blue",
        memberIds: [],
      })
    ).id;
  });

  it("records the project with its lead assignment, actor and request context", async () => {
    const [created] = await events(org, "project.created");

    expect(created).toMatchObject({
      actorUserId: ownerUser.id,
      targetType: "project",
      targetId: projectId,
      targetLabel: "Atlas",
      projectId,
      auditOnly: false,
      ip: "203.0.113.7",
      userAgent: "Vitest/1.0",
    });
    expect(created!.requestId).toMatch(/^[0-9a-f-]{36}$/);

    const [lead] = await events(org, "assignment.created");

    expect(lead).toMatchObject({
      auditOnly: true,
      projectId,
      requestId: created!.requestId,
    });
    expect(lead!.metadata).toMatchObject({
      roleName: "Project lead",
      creator: true,
    });
  });

  it("records team events", async () => {
    expect((await events(org, "team.created"))[0]).toMatchObject({
      targetType: "team",
      targetLabel: "Platform",
      teamId,
      auditOnly: false,
    });

    await owner.team.update({
      id: teamId,
      name: "Platform eng",
      color: "green",
    });

    const [updated] = await events(org, "team.updated");

    expect(updated!.metadata.changes).toEqual([
      { field: "name", from: "Platform", to: "Platform eng" },
      { field: "color", from: "blue", to: "green" },
    ]);

    await owner.team.updateMembers({ teamId, memberIds: [memberId] });
    await owner.team.updateMembers({ teamId, memberIds: [] });

    expect((await events(org, "team.member_added"))[0]!.metadata).toMatchObject(
      {
        memberId,
        userId: memberUser.id,
        name: "Max Member",
      },
    );
    expect(await events(org, "team.member_removed")).toHaveLength(1);

    // Saving the same members again records nothing new.
    await owner.team.updateMembers({ teamId, memberIds: [] });
    expect(await events(org, "team.member_added")).toHaveLength(1);

    const second = await owner.team.create({
      name: "Doomed",
      color: "red",
      memberIds: [],
    });

    await owner.team.delete({ id: second.id });
    expect((await events(org, "team.deleted"))[0]).toMatchObject({
      targetId: second.id,
      targetLabel: "Doomed",
    });
  });

  it("records task events with field changes", async () => {
    const task = await owner.task.createTask({ projectId, name: "Write plan" });

    expect((await events(org, "task.created"))[0]).toMatchObject({
      actorUserId: ownerUser.id,
      targetType: "task",
      targetId: task.id,
      targetLabel: task.key,
      projectId,
    });

    await owner.task.updateTaskByKey({
      key: task.key,
      status: "in-progress",
      priority: "high",
      assignedToMemberId: memberId,
    });

    const [status] = await events(org, "task.status_changed");
    const [assigned] = await events(org, "task.assigned");
    const [updated] = await events(org, "task.updated");

    expect(status!.metadata.changes).toEqual([
      { field: "status", from: "todo", to: "in-progress" },
    ]);
    expect(assigned!.metadata.changes).toEqual([
      { field: "assignee", from: null, to: "Max Member" },
    ]);
    expect(updated!.metadata.changes).toEqual([
      { field: "priority", from: "medium", to: "high" },
    ]);

    // Nothing changed, so nothing is recorded.
    const before = (await events(org)).length;

    await owner.task.updateTaskByKey({ key: task.key, status: "in-progress" });
    expect((await events(org)).length).toBe(before);

    await owner.comment.createTaskComment({
      taskKey: task.key,
      body: "Looks ok",
    });

    const [comment] = await events(org, "task.comment_added");

    expect(comment).toMatchObject({ targetId: task.id, targetLabel: task.key });
    expect(comment!.metadata.commentId).toBeTruthy();

    await owner.task.deleteTaskByKey({ key: task.key });
    expect((await events(org, "task.deleted"))[0]).toMatchObject({
      targetId: task.id,
      targetLabel: task.key,
      projectId,
    });
  });

  it("truncates long values in changes", async () => {
    const task = await owner.task.createTask({ projectId, name: "Long text" });

    await owner.task.updateTaskByKey({
      key: task.key,
      description: "x".repeat(1000),
    });

    const updated = (await events(org, "task.updated")).at(-1)!;
    const change = (updated.metadata.changes as Array<{ to: string }>)[0]!;

    expect(change.to.length).toBeLessThanOrEqual(201);
  });

  it("records doc events and debounces edits per person", async () => {
    const doc = await owner.docs.create({
      projectId,
      title: "Plan",
      slug: "plan-doc",
    });

    expect((await events(org, "doc.created"))[0]).toMatchObject({
      targetType: "doc",
      targetId: doc.id,
      targetLabel: "Plan",
      projectId,
    });

    await owner.docs.updateDocTitle({ id: doc.id, title: "Plan v2" });
    await owner.docs.updateDocContent({ id: doc.id, content: "hello" });
    await owner.docs.updateDocContent({ id: doc.id, content: "hello again" });

    const edits = await events(org, "doc.updated");

    expect(edits).toHaveLength(1);
    expect(edits[0]!.metadata.changes).toEqual([
      { field: "title", from: "Plan", to: "Plan v2" },
    ]);

    // Someone else's edit is their own first event.
    const memberCaller = await world.caller(memberUser, org);

    await memberCaller.docs.updateDocContent({ id: doc.id, content: "mine" });
    expect(await events(org, "doc.updated")).toHaveLength(2);

    await owner.docs.createComment({ docId: doc.id, body: "note" });
    const [comment] = await events(org, "doc.comment_added");

    await owner.docs.resolveComment({
      id: comment!.metadata.commentId as string,
    });
    expect(await events(org, "doc.comment_resolved")).toHaveLength(1);

    await owner.docs.delete({ id: doc.id });
    await owner.docs.restore({ id: doc.id });
    expect(await events(org, "doc.trashed")).toHaveLength(1);
    expect((await events(org, "doc.restored"))[0]).toMatchObject({
      targetLabel: "Plan v2",
    });
  });

  it("allows another edit once the debounce window has passed", async () => {
    const doc = await owner.docs.create({
      title: "Window",
      slug: "window-doc",
    });

    await owner.docs.updateDocContent({ id: doc.id, content: "a" });
    await db
      .update(activityEvents)
      .set({ createdAt: new Date(Date.now() - 11 * 60 * 1000) })
      .where(
        and(
          eq(activityEvents.targetId, doc.id),
          eq(activityEvents.action, "doc.updated"),
        ),
      );
    await owner.docs.updateDocContent({ id: doc.id, content: "b" });

    expect(
      (await events(org, "doc.updated")).filter((e) => e.targetId === doc.id),
    ).toHaveLength(2);
  });

  it("records project changes", async () => {
    await owner.project.updateProjectBySlug({
      currentSlug: projectSlug,
      name: "Atlas 2",
      slug: projectSlug,
      description: "New",
    });

    const [updated] = await events(org, "project.updated");

    expect(updated!.metadata.changes).toEqual([
      { field: "name", from: "Atlas", to: "Atlas 2" },
      { field: "description", from: null, to: "New" },
    ]);

    await owner.project.updateAccess({
      slug: projectSlug,
      visibility: "private",
      teamId: null,
    });

    const [visibility] = await events(org, "project.visibility_changed");

    expect(visibility).toMatchObject({ auditOnly: true, projectId });
    expect(visibility!.metadata.changes).toEqual([
      { field: "visibility", from: "organization", to: "private" },
    ]);

    await owner.project.archiveProject({ slug: projectSlug });
    await owner.project.archiveProject({ slug: projectSlug });
    expect(await events(org, "project.archived")).toHaveLength(1);
    expect(await events(org, "project.restored")).toHaveLength(1);

    const doomed = await owner.project.createProject({
      name: "Doomed",
      slug: "doomed",
      description: "",
    });

    await owner.project.deleteProject({ slug: "doomed" });

    expect((await events(org, "project.deleted"))[0]).toMatchObject({
      targetId: doomed.id,
      targetLabel: "Doomed",
      projectId: doomed.id,
    });
  });

  it("records role, assignment and override changes", async () => {
    const role = await owner.permissions.roles.create({
      name: "Reviewer",
      scope: "organization",
      permissions: ["tasks.view"],
    });

    await owner.permissions.roles.update({
      id: role.id,
      permissions: ["tasks.view", "docs.view"],
    });

    const [updated] = await events(org, "role.updated");

    expect(updated!.metadata).toMatchObject({
      addedPermissions: ["docs.view"],
      removedPermissions: [],
    });

    const clone = await owner.permissions.roles.clone({
      id: role.id,
      name: "Reviewer copy",
    });

    await owner.permissions.roles.delete({ id: clone.id });
    await owner.permissions.roles.resetSystem({ systemKey: "member" });

    for (const action of [
      "role.created",
      "role.cloned",
      "role.deleted",
      "role.reset",
    ]) {
      expect((await events(org, action))[0], action).toMatchObject({
        auditOnly: true,
        targetType: "role",
      });
    }

    const viewer = await owner.permissions.roles.list();
    const projectViewer = viewer.find(
      (item) => item.systemKey === "project_viewer",
    )!;
    const assignment = await owner.permissions.assignments.assign({
      roleId: projectViewer.id,
      principalType: "user",
      principalId: memberUser.id,
      scopeType: "project",
      scopeId: projectId,
    });

    expect(
      (await events(org, "assignment.created")).some(
        (event) => event.targetId === assignment.id,
      ),
    ).toBe(true);
    expect((await events(org, "project.member_added"))[0]).toMatchObject({
      projectId,
      auditOnly: true,
    });

    await owner.permissions.assignments.unassign({
      assignmentId: assignment.id,
    });
    expect(await events(org, "assignment.removed")).toHaveLength(1);
    expect(await events(org, "project.member_removed")).toHaveLength(1);

    const override = await owner.permissions.overrides.set({
      userId: memberUser.id,
      permission: "tasks.assign",
      effect: "deny",
      scopeType: "organization",
      scopeId: org.id,
      reason: "Probation",
    });

    expect((await events(org, "override.set"))[0]!.metadata).toMatchObject({
      permission: "tasks.assign",
      effect: "deny",
      reason: "Probation",
    });

    await owner.permissions.overrides.remove({ id: override.id });
    expect(await events(org, "override.removed")).toHaveLength(1);
  });

  it("records modules, members, invitations and ownership", async () => {
    await owner.modules.setEnabled({ moduleId: "docs", enabled: false });
    await owner.modules.setEnabled({ moduleId: "docs", enabled: false });
    await owner.modules.setEnabled({ moduleId: "docs", enabled: true });

    expect((await events(org, "module.disabled"))[0]).toMatchObject({
      targetType: "module",
      targetId: "docs",
      targetLabel: "Docs",
    });
    expect(await events(org, "module.disabled")).toHaveLength(1);
    expect(await events(org, "module.enabled")).toHaveLength(1);

    const invitation = await owner.invitation.invite({
      email: "new.person@example.test",
      role: "member",
    });

    await owner.invitation.resend({ invitationId: invitation.id });
    await owner.invitation.cancel({ invitationId: invitation.id });

    for (const action of [
      "invitation.sent",
      "invitation.resent",
      "invitation.cancelled",
    ]) {
      expect((await events(org, action))[0], action).toMatchObject({
        targetId: invitation.id,
        targetLabel: "new.person@example.test",
        auditOnly: true,
      });
    }

    await owner.member.updateRole({ memberId, role: "admin" });
    expect(
      (await events(org, "member.role_updated"))[0]!.metadata.changes,
    ).toEqual([{ field: "role", from: "member", to: "admin" }]);

    await owner.member.transferOwnership({ memberId });
    expect((await events(org, "org.ownership_transferred"))[0]).toMatchObject({
      targetId: memberId,
      targetLabel: "Max Member",
    });
  });

  it("records the organization update and member removal", async () => {
    const solo = await world.org("Solo");
    const a = await world.userIn(solo, "owner", "Ann Owner");
    const b = await world.userIn(solo, "member", "Bob Member");
    const as = await world.caller(a.user, solo);

    await as.organization.update({ name: "Solo renamed" });
    await as.member.remove({ memberId: b.member.id });

    expect((await events(solo, "org.updated"))[0]!.metadata.changes).toEqual([
      { field: "name", from: "Solo", to: "Solo renamed" },
    ]);
    expect((await events(solo, "member.removed"))[0]).toMatchObject({
      targetId: b.member.id,
      targetLabel: "Bob Member",
      auditOnly: true,
    });

    await as.organization.delete();
    expect(await events(solo)).toHaveLength(0);
  });

  it("records the audit export", async () => {
    const result = await owner.audit.export({ actionPrefix: "task." });
    const [exported] = await events(org, "audit.exported");

    expect(exported).toMatchObject({ auditOnly: true, targetType: "audit" });
    expect(exported!.metadata).toMatchObject({
      filter: { actionPrefix: "task." },
      rowCount: result.rowCount,
    });
  });
});

describe("atomic recording", () => {
  async function setup() {
    const org = await world.org("Atomic");
    const o = await world.userIn(org, "owner", "Atom Owner");
    const project = await world.project(org, { taskKeyPrefix: "AT" });

    return { org, user: o.user, project };
  }

  it("rolls the change back when the event cannot be written", async () => {
    const { org, user, project } = await setup();
    const caller = await world.caller(user, org, {
      wrapAudit: (audit) => ({
        ...audit,
        forCall: () => ({
          ...audit,
          async record() {
            throw new Error("event store down");
          },
        }),
      }),
    });

    await expect(
      caller.task.createTask({ projectId: project.id, name: "Never saved" }),
    ).rejects.toThrow();

    const task = await caller.task.getTasksByOrgId({});

    expect(task.map((item) => item.name)).not.toContain("Never saved");
    expect(await events(org)).toHaveLength(0);
  });

  it("leaves no event behind when the change fails after it", async () => {
    const { org, user, project } = await setup();
    const real = createAuditContext({
      organizationId: org.id,
      userId: user.id,
    });
    const caller = await world.caller(user, org, {
      wrapAudit: () => ({
        ...real,
        forCall: () => ({
          ...real,
          async record(handle, input) {
            await real.record(handle, input);
            throw new Error("fails after the event was written");
          },
        }),
      }),
    });

    await expect(
      caller.task.createTask({ projectId: project.id, name: "Rolled back" }),
    ).rejects.toThrow();
    expect(
      (await caller.task.getTasksByOrgId({})).map((item) => item.name),
    ).not.toContain("Rolled back");
    expect(await events(org)).toHaveLength(0);
  });

  it("fails a declared mutation that records nothing outside production", async () => {
    const { org, user, project } = await setup();
    const real = createAuditContext({
      organizationId: org.id,
      userId: user.id,
    });
    const caller = await world.caller(user, org, {
      wrapAudit: () => ({
        ...real,
        forCall: () => ({
          ...real,
          async record() {
            return {} as never;
          },
        }),
      }),
    });

    await expect(
      caller.task.createTask({ projectId: project.id, name: "Silent" }),
    ).rejects.toThrow(/without recording/);
  });
});
