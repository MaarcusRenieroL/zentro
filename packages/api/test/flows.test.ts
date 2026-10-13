import { db } from "@zentro/db";
import { and, eq } from "@zentro/db/drizzle";
import {
  docComments,
  docs,
  projects,
  taskActivityEvents,
  taskComments,
  tasks,
} from "@zentro/db/schema";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { reservedDocSlugs } from "../src/types/zod-schema";
import { World, type TestOrg, type TestUser } from "./helpers";

const world = new World();

type Caller = Awaited<ReturnType<World["caller"]>>;

let org: TestOrg;
let owner: TestUser;
let ownerMemberId: string;
let as: Caller;

beforeAll(async () => {
  org = await world.org("Flows");
  const created = await world.userIn(org, "owner", "Flow Owner");

  owner = created.user;
  ownerMemberId = created.member.id;
  as = await world.caller(owner, org);
});

afterAll(() => world.cleanup());

describe("projects", () => {
  it("creates a project with a task key prefix derived from the slug", async () => {
    const project = await as.project.createProject({
      name: "Launch OS",
      slug: "launch-os",
      description: "Ship it",
    });

    expect(project).toMatchObject({
      name: "Launch OS",
      slug: "launch-os",
      taskKeyPrefix: "LO",
      status: "active",
      organizationId: org.id,
      createdById: owner.id,
    });
  });

  it("gives a second project with the same initials a unique prefix", async () => {
    const project = await as.project.createProject({
      name: "Landing Office",
      slug: "landing-office",
      description: "",
    });

    expect(project.taskKeyPrefix).toBe("LO2");
  });

  it("reads a project by slug and lists it", async () => {
    const detail = await as.project.getProjectBySlug({ slug: "launch-os" });
    const list = await as.project.getProjectsByOrgId();

    expect(detail.name).toBe("Launch OS");
    expect(list.map((project) => project.slug)).toContain("launch-os");
  });

  it("rejects a duplicate slug in the same organization", async () => {
    await expect(
      as.project.createProject({
        name: "Again",
        slug: "launch-os",
        description: "",
      }),
    ).rejects.toBeDefined();
  });

  it("renames and re-slugs a project", async () => {
    await as.project.createProject({
      name: "Old name",
      slug: "old-name",
      description: "",
    });

    await as.project.updateProjectBySlug({
      currentSlug: "old-name",
      name: "New name",
      slug: "new-name",
      description: "updated",
    });

    const detail = await as.project.getProjectBySlug({ slug: "new-name" });

    expect(detail.name).toBe("New name");
    await expect(
      as.project.getProjectBySlug({ slug: "old-name" }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("archives a project", async () => {
    await as.project.createProject({
      name: "To archive",
      slug: "to-archive",
      description: "",
    });
    await as.project.archiveProject({ slug: "to-archive" });

    const [row] = await db
      .select()
      .from(projects)
      .where(
        and(
          eq(projects.organizationId, org.id),
          eq(projects.slug, "to-archive"),
        ),
      );

    expect(row!.archivedAt).not.toBeNull();
    expect(row!.status).not.toBe("active");
  });

  it("deletes a project and hides it from the list", async () => {
    await as.project.createProject({
      name: "To delete",
      slug: "to-delete",
      description: "",
    });
    await as.project.deleteProject({ slug: "to-delete" });

    const list = await as.project.getProjectsByOrgId();

    expect(list.map((project) => project.slug)).not.toContain("to-delete");
    await expect(
      as.project.getProjectBySlug({ slug: "to-delete" }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

describe("tasks", () => {
  let projectId: string;

  beforeAll(async () => {
    const project = await as.project.createProject({
      name: "Planning Area",
      slug: "planning-area",
      description: "",
    });

    projectId = project.id;
  });

  it("generates sequential keys per project (PA-1, PA-2)", async () => {
    const first = await as.task.createTask({ projectId, name: "First" });
    const second = await as.task.createTask({ projectId, name: "Second" });

    expect([first.key, second.key]).toEqual(["PA-1", "PA-2"]);
    expect([first.taskNumber, second.taskNumber]).toEqual([1, 2]);
    expect(first).toMatchObject({
      status: "todo",
      priority: "medium",
      organizationId: org.id,
      createdByMemberId: ownerMemberId,
    });
  });

  it("does not reuse the number of a deleted task", async () => {
    const created = await as.task.createTask({ projectId, name: "Gone" });

    await as.task.deleteTaskByKey({ key: created.key });

    const next = await as.task.createTask({ projectId, name: "After gone" });

    expect(next.taskNumber).toBe(created.taskNumber + 1);
  });

  it("restarts numbering for another project", async () => {
    const other = await as.project.createProject({
      name: "Other Area",
      slug: "other-area",
      description: "",
    });
    const task = await as.task.createTask({ projectId: other.id, name: "One" });

    expect(task.key).toBe("OA-1");
  });

  it("records a task.created activity event", async () => {
    const task = await as.task.createTask({ projectId, name: "Tracked" });
    const events = await as.activity.getTaskActivityEvents({
      taskKey: task.key,
    });

    expect(events.map((event) => event.type)).toContain("task.created");
  });

  it("updates fields and records the change in the activity feed", async () => {
    const task = await as.task.createTask({ projectId, name: "To update" });

    await as.task.updateTaskByKey({
      key: task.key,
      name: "Updated",
      status: "in-progress",
      priority: "high",
      assignedToMemberId: ownerMemberId,
    });

    const updated = await as.task.getTaskByKey({ key: task.key });

    expect(updated).toMatchObject({
      name: "Updated",
      status: "in-progress",
      priority: "high",
      assignedToMemberId: ownerMemberId,
    });

    const events = await as.activity.getTaskActivityEvents({
      taskKey: task.key,
    });

    expect(events.length).toBeGreaterThan(1);
  });

  it("lists tasks for the organization", async () => {
    const list = await as.task.getTasksByOrgId({});

    expect(list.length).toBeGreaterThanOrEqual(4);
    expect(list.every((task) => typeof task.key === "string")).toBe(true);
  });

  it("deletes a task softly and hides it", async () => {
    const task = await as.task.createTask({ projectId, name: "Delete me" });

    await as.task.deleteTaskByKey({ key: task.key });

    const [row] = await db.select().from(tasks).where(eq(tasks.id, task.id));

    expect(row!.deletedAt).not.toBeNull();
    await expect(
      as.task.getTaskByKey({ key: task.key }),
    ).resolves.toBeUndefined();
  });

  it("adds and lists task comments", async () => {
    const task = await as.task.createTask({ projectId, name: "Discuss" });

    await as.comment.createTaskComment({
      taskKey: task.key,
      body: "Looks good",
    });

    const comments = await as.comment.getTaskComments({ taskKey: task.key });

    expect(comments.map((comment) => comment.body)).toEqual(["Looks good"]);

    const rows = await db
      .select()
      .from(taskComments)
      .where(eq(taskComments.taskId, task.id));

    expect(rows[0]!.authorMemberId).toBe(ownerMemberId);

    const events = await db
      .select()
      .from(taskActivityEvents)
      .where(eq(taskActivityEvents.taskId, task.id));

    expect(events.length).toBeGreaterThanOrEqual(2);
  });

  // Bug: createTask reads the latest task number and inserts without a lock, so
  // concurrent requests in one project compute the same key and the unique
  // index rejects all but one of them.
  it.fails("creates unique keys under concurrent requests", async () => {
    const results = await Promise.allSettled(
      Array.from({ length: 12 }, (_, index) =>
        as.task.createTask({ projectId, name: `Race ${index}` }),
      ),
    );

    expect(results.filter((result) => result.status === "rejected")).toEqual(
      [],
    );
  });
});

describe("docs", () => {
  it("creates, reads and updates a doc", async () => {
    const doc = await as.docs.create({
      title: "Handbook",
      slug: "handbook-1",
      content: "# Hi",
    });

    expect(doc).toMatchObject({
      title: "Handbook",
      slug: "handbook-1",
      organizationId: org.id,
      createdByMemberId: ownerMemberId,
    });

    await as.docs.updateDocTitle({ id: doc.id, title: "Handbook v2" });
    await as.docs.updateDocContent({ id: doc.id, content: "# Updated" });

    const bySlug = await as.docs.getBySlug({ slug: "handbook-1" });

    expect(bySlug).toMatchObject({
      title: "Handbook v2",
      content: "# Updated",
    });
    expect((await as.docs.getById({ id: doc.id })).id).toBe(doc.id);
  });

  it("rejects reserved slugs at the API boundary", async () => {
    for (const slug of reservedDocSlugs) {
      await expect(
        as.docs.create({ title: "Reserved", slug }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    }
  });

  it("rejects duplicate slugs in one organization", async () => {
    await as.docs.create({ title: "One", slug: "dup-doc" });

    await expect(
      as.docs.create({ title: "Two", slug: "dup-doc" }),
    ).rejects.toBeDefined();
  });

  it("moves a doc to the trash and restores it", async () => {
    const doc = await as.docs.create({ title: "Trash me", slug: "trash-me" });

    await as.docs.delete({ id: doc.id });

    const visible = await as.docs.getAll({});
    const trashed = await as.docs.getAll({ includeDeleted: true });

    expect(visible.map((item) => item.id)).not.toContain(doc.id);
    expect(trashed.map((item) => item.id)).toContain(doc.id);

    await as.docs.restore({ id: doc.id });

    expect((await as.docs.getAll({})).map((item) => item.id)).toContain(doc.id);

    const [row] = await db.select().from(docs).where(eq(docs.id, doc.id));

    expect(row!.deletedAt).toBeNull();
  });

  it("searches by title", async () => {
    await as.docs.create({ title: "Quarterly roadmap", slug: "roadmap-q" });

    const found = await as.docs.search({ query: "roadmap" });

    expect(found.map((doc) => doc.slug)).toContain("roadmap-q");
  });

  it("adds, lists and resolves doc comments", async () => {
    const doc = await as.docs.create({ title: "Reviewed", slug: "reviewed" });

    await as.docs.createComment({ docId: doc.id, body: "Please clarify" });

    const [comment] = await as.docs.getComments({ docId: doc.id });

    expect(comment).toMatchObject({ body: "Please clarify" });

    await as.docs.resolveComment({ id: comment!.id });

    const [row] = await db
      .select()
      .from(docComments)
      .where(eq(docComments.id, comment!.id));

    expect(row!.resolvedAt).not.toBeNull();
  });
});
