import { db } from "@zentro/db";
import { and, eq } from "@zentro/db/drizzle";
import {
  docComments,
  docs,
  projects,
  activityEvents,
  taskComments,
  tasks,
  teamMembers,
  teams,
} from "@zentro/db/schema";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { World, type TestOrg, type TestUser } from "./helpers";

const world = new World();

type Caller = Awaited<ReturnType<World["caller"]>>;

let orgA: TestOrg;
let orgB: TestOrg;
let userA: TestUser;
let userB: TestUser;
let memberAId: string;
let memberBId: string;
let asA: Caller; // owner of A, active org A
let projectA: Awaited<ReturnType<World["project"]>>;
let projectB: Awaited<ReturnType<World["project"]>>;
let taskB: Awaited<ReturnType<World["task"]>>;
let docB: Awaited<ReturnType<World["doc"]>>;
let docCommentB: typeof docComments.$inferSelect;
let teamB: Awaited<ReturnType<World["team"]>>;
let teamA: Awaited<ReturnType<World["team"]>>;

beforeAll(async () => {
  orgA = await world.org("Org A");
  orgB = await world.org("Org B");

  const a = await world.userIn(orgA, "owner", "Owner A");
  const b = await world.userIn(orgB, "owner", "Owner B");

  userA = a.user;
  userB = b.user;
  memberAId = a.member.id;
  memberBId = b.member.id;

  projectA = await world.project(orgA, { taskKeyPrefix: "AA" });
  projectB = await world.project(orgB, {
    slug: "secret-b",
    name: "Secret B",
    taskKeyPrefix: "BB",
  });
  taskB = await world.task(orgB, projectB, {
    name: "Secret task",
    taskNumber: 7,
    createdByMemberId: memberBId,
  });
  docB = await world.doc(orgB, {
    title: "Secret doc",
    slug: "secret-doc-b",
    content: "secret",
    createdByMemberId: memberBId,
  });
  teamB = await world.team(orgB, { name: "Team B" });
  teamA = await world.team(orgA, { name: "Team A" });

  [docCommentB] = await db
    .insert(docComments)
    .values({
      organizationId: orgB.id,
      docId: docB.id,
      authorMemberId: memberBId,
      body: "secret comment",
    })
    .returning()
    .then((rows) => rows as [typeof docComments.$inferSelect]);

  await db.insert(taskComments).values({
    organizationId: orgB.id,
    taskId: taskB.id,
    authorMemberId: memberBId,
    body: "secret task comment",
  });
  await db.insert(activityEvents).values({
    organizationId: orgB.id,
    action: "task.created",
    targetType: "task",
    targetId: taskB.id,
    targetLabel: taskB.key,
    projectId: taskB.projectId,
  });

  asA = await world.caller(userA, orgA);
});

afterAll(() => world.cleanup());

const notFound = { code: "NOT_FOUND" } as const;

async function bProject() {
  const [row] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectB.id));

  return row!;
}

async function bTask() {
  const [row] = await db.select().from(tasks).where(eq(tasks.id, taskB.id));

  return row!;
}

async function bDoc() {
  const [row] = await db.select().from(docs).where(eq(docs.id, docB.id));

  return row!;
}

describe("projects", () => {
  it("does not list another organization's projects", async () => {
    const list = await asA.project.getProjectsByOrgId();

    expect(list.map((project) => project.id)).not.toContain(projectB.id);
  });

  it("cannot get B's project by slug", async () => {
    await expect(
      asA.project.getProjectBySlug({ slug: projectB.slug }),
    ).rejects.toMatchObject(notFound);
  });

  it("cannot update B's project", async () => {
    await expect(
      asA.project.updateProjectBySlug({
        currentSlug: projectB.slug,
        name: "Hijacked",
        slug: "hijacked",
        description: "",
      }),
    ).rejects.toMatchObject(notFound);

    expect((await bProject()).name).toBe("Secret B");
  });

  it("cannot archive B's project", async () => {
    await expect(
      asA.project.archiveProject({ slug: projectB.slug }),
    ).rejects.toMatchObject(notFound);

    expect((await bProject()).archivedAt).toBeNull();
  });

  it("cannot delete B's project", async () => {
    await expect(
      asA.project.deleteProject({ slug: projectB.slug }),
    ).rejects.toMatchObject(notFound);

    expect((await bProject()).deletedAt).toBeNull();
  });

  it("checkSlug does not reveal B's slugs", async () => {
    // The same slug is free in A even though B uses it.
    await expect(
      asA.project.checkSlug({ slug: projectB.slug }),
    ).resolves.toBeDefined();
  });

  it("cannot attach a project to B's team", async () => {
    await expect(
      asA.project.createProject({
        name: "Cross team",
        slug: "cross-team",
        description: "",
        teamId: teamB.id,
      }),
    ).rejects.toBeDefined();
  });

  it("created projects belong to the caller's organization", async () => {
    const created = await asA.project.createProject({
      name: "Mine",
      slug: "mine-a",
      description: "",
    });

    expect(created.organizationId).toBe(orgA.id);
  });
});

describe("tasks", () => {
  it("does not list B's tasks", async () => {
    const list = await asA.task.getTasksByOrgId({});

    expect(list.map((task) => task.id)).not.toContain(taskB.id);
  });

  it("cannot get B's task by key", async () => {
    // Unknown keys resolve to nothing instead of throwing; the page shows
    // "Task not found".
    await expect(
      asA.task.getTaskByKey({ key: taskB.key }),
    ).resolves.toBeUndefined();
  });

  it("cannot update B's task", async () => {
    await expect(
      asA.task.updateTaskByKey({ key: taskB.key, name: "Hijacked" }),
    ).rejects.toMatchObject(notFound);

    expect((await bTask()).name).toBe("Secret task");
  });

  it("cannot delete B's task", async () => {
    await expect(
      asA.task.deleteTaskByKey({ key: taskB.key }),
    ).rejects.toMatchObject(notFound);

    expect((await bTask()).deletedAt).toBeNull();
  });

  it("cannot create a task in B's project", async () => {
    await expect(
      asA.task.createTask({ projectId: projectB.id, name: "Injected" }),
    ).rejects.toMatchObject(notFound);

    const injected = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.projectId, projectB.id), eq(tasks.name, "Injected")));

    expect(injected).toHaveLength(0);
  });

  it("cannot assign a task to B's member", async () => {
    await expect(
      asA.task.createTask({
        projectId: projectA.id,
        name: "Assigned across orgs",
        assignedToMemberId: memberBId,
      }),
    ).rejects.toMatchObject(notFound);
  });

  it("cannot reassign A's task to B's member", async () => {
    const taskA = await world.task(orgA, projectA, { taskNumber: 50 });

    await expect(
      asA.task.updateTaskByKey({
        key: taskA.key,
        assignedToMemberId: memberBId,
      }),
    ).rejects.toBeDefined();

    const [row] = await db.select().from(tasks).where(eq(tasks.id, taskA.id));

    expect(row!.assignedToMemberId).not.toBe(memberBId);
  });
});

describe("task comments and activity", () => {
  it("cannot read B's task comments", async () => {
    await expect(
      asA.comment.getTaskComments({ taskKey: taskB.key }),
    ).rejects.toMatchObject(notFound);
  });

  it("cannot comment on B's task", async () => {
    await expect(
      asA.comment.createTaskComment({ taskKey: taskB.key, body: "hi" }),
    ).rejects.toMatchObject(notFound);

    const comments = await db
      .select()
      .from(taskComments)
      .where(eq(taskComments.taskId, taskB.id));

    expect(comments).toHaveLength(1);
  });

  it("cannot read B's task activity", async () => {
    await expect(
      asA.activity.getTaskActivityEvents({ taskKey: taskB.key }),
    ).rejects.toMatchObject(notFound);
  });
});

describe("docs", () => {
  it("does not list or search B's docs", async () => {
    const all = await asA.docs.getAll({});
    const found = await asA.docs.search({ query: "Secret" });

    expect(all.map((doc) => doc.id)).not.toContain(docB.id);
    expect(found.map((doc) => doc.id)).not.toContain(docB.id);
  });

  it("cannot get B's doc by id or slug", async () => {
    await expect(asA.docs.getById({ id: docB.id })).rejects.toMatchObject(
      notFound,
    );
    await expect(asA.docs.getBySlug({ slug: docB.slug })).rejects.toMatchObject(
      notFound,
    );
  });

  it("cannot update B's doc", async () => {
    await expect(
      asA.docs.updateDocTitle({ id: docB.id, title: "Hijacked" }),
    ).rejects.toMatchObject(notFound);
    await expect(
      asA.docs.updateDocContent({ id: docB.id, content: "hijacked" }),
    ).rejects.toMatchObject(notFound);

    const doc = await bDoc();

    expect(doc.title).toBe("Secret doc");
    expect(doc.content).toBe("secret");
  });

  it("cannot delete or restore B's doc", async () => {
    await expect(asA.docs.delete({ id: docB.id })).rejects.toMatchObject(
      notFound,
    );
    await expect(asA.docs.restore({ id: docB.id })).rejects.toMatchObject(
      notFound,
    );

    expect((await bDoc()).deletedAt).toBeNull();
  });

  it("cannot read, add or resolve comments on B's doc", async () => {
    await expect(
      asA.docs.getComments({ docId: docB.id }),
    ).rejects.toMatchObject(notFound);
    await expect(
      asA.docs.createComment({ docId: docB.id, body: "hi" }),
    ).rejects.toMatchObject(notFound);
    await expect(
      asA.docs.resolveComment({ id: docCommentB.id }),
    ).rejects.toMatchObject(notFound);

    const comments = await db
      .select()
      .from(docComments)
      .where(eq(docComments.docId, docB.id));

    expect(comments).toHaveLength(1);
    expect(comments[0]!.resolvedAt).toBeNull();
  });

  it("cannot create a doc in B's project or team", async () => {
    await expect(
      asA.docs.create({
        title: "Injected",
        slug: "injected-project",
        projectId: projectB.id,
      }),
    ).rejects.toMatchObject(notFound);
    await expect(
      asA.docs.create({
        title: "Injected",
        slug: "injected-team",
        teamId: teamB.id,
      }),
    ).rejects.toMatchObject(notFound);
  });

  it("created docs belong to the caller's organization", async () => {
    const doc = await asA.docs.create({ title: "Mine", slug: "mine-doc-a" });

    expect(doc.organizationId).toBe(orgA.id);
  });
});

describe("teams", () => {
  it("does not list B's teams", async () => {
    const list = await asA.team.getAll();

    expect(list.map((team) => team.id)).not.toContain(teamB.id);
  });

  it("cannot get, update or delete B's team", async () => {
    await expect(asA.team.getById({ id: teamB.id })).rejects.toMatchObject(
      notFound,
    );
    await expect(
      asA.team.update({ id: teamB.id, name: "Hijacked", color: "red" }),
    ).rejects.toMatchObject(notFound);
    await expect(asA.team.delete({ id: teamB.id })).rejects.toMatchObject(
      notFound,
    );

    const [row] = await db.select().from(teams).where(eq(teams.id, teamB.id));

    expect(row?.name).toBe("Team B");
  });

  it("cannot change B's team membership", async () => {
    await expect(
      asA.team.updateMembers({ teamId: teamB.id, memberIds: [memberAId] }),
    ).rejects.toMatchObject(notFound);
  });

  it("cannot put B's members into A's team", async () => {
    await expect(
      asA.team.updateMembers({ teamId: teamA.id, memberIds: [memberBId] }),
    ).rejects.toBeDefined();

    const rows = await db
      .select()
      .from(teamMembers)
      .where(eq(teamMembers.teamId, teamA.id));

    expect(rows.map((row) => row.memberId)).not.toContain(memberBId);
  });

  it("cannot create a team containing B's members", async () => {
    await expect(
      asA.team.create({
        name: "Cross org team",
        color: "blue",
        memberIds: [memberBId],
      }),
    ).rejects.toBeDefined();
  });

  it("only offers the caller's own members", async () => {
    const available = await asA.team.getAvailableMembers();

    expect(JSON.stringify(available)).not.toContain(userB.email);
  });
});

describe("members", () => {
  it("only lists the caller's organization members", async () => {
    const list = await asA.member.getMembers();

    expect(list.map((member) => member.userId)).toEqual([userA.id]);
  });
});
