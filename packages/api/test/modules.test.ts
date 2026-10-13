import { db } from "@zentro/db";
import { eq } from "@zentro/db/drizzle";
import { docs, organizationModules, tasks } from "@zentro/db/schema";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createEnabledModulesLoader } from "../src/server/modules";
import { World, type TestOrg, type TestUser } from "./helpers";

const world = new World();

afterAll(() => world.cleanup());

async function freshOrg(name: string) {
  const org = await world.org(name);
  const { user: owner } = await world.userIn(org, "owner", `${name} owner`);
  const { user: member } = await world.userIn(org, "member", `${name} member`);

  return { org, owner, member };
}

describe("moduleProcedure", () => {
  let org: TestOrg;
  let owner: TestUser;

  beforeAll(async () => {
    ({ org, owner } = await freshOrg("Guarded"));
    const project = await world.project(org);
    await world.task(org, project, { taskNumber: 1 });
    await world.doc(org, { slug: "kept-doc" });
  });

  it("works while the module is enabled (default, no rows)", async () => {
    const caller = await world.caller(owner, org);

    await expect(caller.task.getTasksByOrgId({})).resolves.toHaveLength(1);
    await expect(caller.docs.getAll({})).resolves.toHaveLength(1);
    await expect(caller.project.getProjectsByOrgId()).resolves.toHaveLength(1);
  });

  it("rejects with FORBIDDEN 'Module disabled' once the module is off", async () => {
    await world.setModule(org, "tasks", false);
    const caller = await world.caller(owner, org);

    await expect(caller.task.getTasksByOrgId({})).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "Module disabled",
    });
    await expect(
      caller.task.createTask({ projectId: crypto.randomUUID(), name: "x" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN", message: "Module disabled" });
    await expect(
      caller.comment.getTaskComments({ taskKey: "PA-1" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN", message: "Module disabled" });
    await expect(
      caller.activity.getTaskActivityEvents({ taskKey: "PA-1" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN", message: "Module disabled" });
  });

  it("leaves other modules and shared procedures working", async () => {
    const caller = await world.caller(owner, org);

    await expect(caller.docs.getAll({})).resolves.toHaveLength(1);
    await expect(caller.project.getProjectsByOrgId()).resolves.toHaveLength(1);
    await expect(caller.member.getMembers()).resolves.toHaveLength(2);
    await expect(caller.team.getAll()).resolves.toBeDefined();
  });

  it("checks the module before permissions on authorized procedures", async () => {
    await world.setModule(org, "docs", false);
    const caller = await world.caller(owner, org);

    await expect(
      caller.docs.create({ title: "x", slug: "x-doc" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN", message: "Module disabled" });
    await expect(caller.docs.search({ query: "k" })).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "Module disabled",
    });
  });

  it("works again, with the data intact, after re-enabling", async () => {
    await world.setModule(org, "tasks", true);
    await world.setModule(org, "docs", true);
    const caller = await world.caller(owner, org);

    const taskList = await caller.task.getTasksByOrgId({});
    expect(taskList).toHaveLength(1);
    expect(taskList[0]!.key).toBe("PA-1");

    const docList = await caller.docs.getAll({});
    expect(docList.map((doc) => doc.slug)).toEqual(["kept-doc"]);
  });

  it("reflects module changes on the next call", async () => {
    const { org: other, owner: otherOwner } = await freshOrg("Reflect");
    const caller = await world.caller(otherOwner, other);

    await expect(caller.docs.getAll({})).resolves.toBeDefined();
    await world.setModule(other, "docs", false);
    await expect(caller.docs.getAll({})).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });
});

describe("createEnabledModulesLoader", () => {
  it("queries once per request and then serves the cached set", async () => {
    const { org } = await freshOrg("Memoized");
    const load = createEnabledModulesLoader(db, org.id);

    const first = await load();
    await world.setModule(org, "docs", false);
    const second = await load();

    expect(first.has("docs")).toBe(true);
    expect(second).toBe(first);
    expect((await createEnabledModulesLoader(db, org.id)()).has("docs")).toBe(
      false,
    );
  });

  it("returns an empty set without an organization", async () => {
    expect([...(await createEnabledModulesLoader(db, null)())]).toEqual([]);
  });
});

describe("modules.list", () => {
  it("returns every registered module with its state and reasons", async () => {
    const { org, owner, member } = await freshOrg("Listing");

    const asOwner = await world.caller(owner, org);
    const asMember = await world.caller(member, org);

    const ownerView = await asOwner.modules.list();
    const memberView = await asMember.modules.list();

    expect(ownerView.canManage).toBe(true);
    expect(memberView.canManage).toBe(false);

    const byId = Object.fromEntries(
      ownerView.modules.map((module) => [module.id, module]),
    );

    expect(Object.keys(byId).sort()).toEqual([
      "dashboard",
      "docs",
      "projects",
      "settings",
      "tasks",
    ]);
    expect(byId.dashboard).toMatchObject({
      core: true,
      enabled: true,
      canToggle: false,
    });
    expect(byId.projects).toMatchObject({
      enabled: true,
      canToggle: false,
      reason: "Turn off Tasks first.",
    });
    expect(byId.tasks).toMatchObject({ enabled: true, canToggle: true });
    expect(byId.docs).toMatchObject({ enabled: true, canToggle: true });
  });
});

describe("modules.setEnabled", () => {
  it("is admin-only", async () => {
    const { org, member } = await freshOrg("AdminOnly");
    const caller = await world.caller(member, org);

    await expect(
      caller.modules.setEnabled({ moduleId: "docs", enabled: false }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });

    const rows = await db
      .select()
      .from(organizationModules)
      .where(eq(organizationModules.organizationId, org.id));

    expect(rows).toHaveLength(0);
  });

  it("blocks disabling a module that an enabled module depends on", async () => {
    const { org, owner } = await freshOrg("DisableDeps");
    const caller = await world.caller(owner, org);

    await expect(
      caller.modules.setEnabled({ moduleId: "projects", enabled: false }),
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: "Turn off Tasks first.",
    });

    await caller.modules.setEnabled({ moduleId: "tasks", enabled: false });
    await expect(
      caller.modules.setEnabled({ moduleId: "projects", enabled: false }),
    ).resolves.toEqual({ moduleId: "projects", enabled: false });
  });

  it("blocks enabling a module whose dependency is off", async () => {
    const { org, owner } = await freshOrg("EnableDeps");
    const caller = await world.caller(owner, org);

    await caller.modules.setEnabled({ moduleId: "tasks", enabled: false });
    await caller.modules.setEnabled({ moduleId: "projects", enabled: false });

    await expect(
      caller.modules.setEnabled({ moduleId: "tasks", enabled: true }),
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: "Requires Projects to be enabled.",
    });

    await caller.modules.setEnabled({ moduleId: "projects", enabled: true });
    await expect(
      caller.modules.setEnabled({ moduleId: "tasks", enabled: true }),
    ).resolves.toEqual({ moduleId: "tasks", enabled: true });
  });

  it("rejects core and unknown module ids", async () => {
    const { org, owner } = await freshOrg("CoreUnknown");
    const caller = await world.caller(owner, org);

    await expect(
      caller.modules.setEnabled({ moduleId: "dashboard", enabled: false }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(
      caller.modules.setEnabled({ moduleId: "settings", enabled: false }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(
      caller.modules.setEnabled({ moduleId: "nope", enabled: false }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("upserts a single row and records who changed it", async () => {
    const { org, owner } = await freshOrg("Upsert");
    const caller = await world.caller(owner, org);

    await caller.modules.setEnabled({ moduleId: "docs", enabled: false });
    await caller.modules.setEnabled({ moduleId: "docs", enabled: true });

    const rows = await db
      .select()
      .from(organizationModules)
      .where(eq(organizationModules.organizationId, org.id));

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      moduleId: "docs",
      enabled: true,
      updatedByUserId: owner.id,
    });
  });

  it("does not write anything when the state is unchanged", async () => {
    const { org, owner } = await freshOrg("Noop");
    const caller = await world.caller(owner, org);

    await caller.modules.setEnabled({ moduleId: "docs", enabled: true });

    const rows = await db
      .select()
      .from(organizationModules)
      .where(eq(organizationModules.organizationId, org.id));

    expect(rows).toHaveLength(0);
  });

  it("is isolated per organization", async () => {
    const a = await freshOrg("IsolatedA");
    const b = await freshOrg("IsolatedB");
    const asA = await world.caller(a.owner, a.org);
    const asB = await world.caller(b.owner, b.org);

    await asA.modules.setEnabled({ moduleId: "docs", enabled: false });

    const listB = await asB.modules.list();

    expect(listB.modules.find((m) => m.id === "docs")?.enabled).toBe(true);
    await expect(asB.docs.getAll({})).resolves.toBeDefined();
    await expect(asA.docs.getAll({})).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("keeps all data when a module is disabled and re-enabled", async () => {
    const { org, owner } = await freshOrg("KeepData");
    const caller = await world.caller(owner, org);
    const project = await world.project(org);
    const task = await world.task(org, project, { taskNumber: 1 });
    const doc = await world.doc(org);

    await caller.modules.setEnabled({ moduleId: "tasks", enabled: false });
    await caller.modules.setEnabled({ moduleId: "docs", enabled: false });

    // Rows are untouched while hidden.
    expect(
      await db.select().from(tasks).where(eq(tasks.id, task.id)),
    ).toHaveLength(1);
    expect(
      await db.select().from(docs).where(eq(docs.id, doc.id)),
    ).toHaveLength(1);

    await caller.modules.setEnabled({ moduleId: "tasks", enabled: true });
    await caller.modules.setEnabled({ moduleId: "docs", enabled: true });

    const refreshed = await world.caller(owner, org);

    expect((await refreshed.task.getTasksByOrgId({}))[0]!.key).toBe("PA-1");
    expect((await refreshed.docs.getAll({}))[0]!.id).toBe(doc.id);
  });
});
