import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { World, type TestOrg, type TestUser } from "./helpers";

const world = new World();

let org: TestOrg;
let owner: TestUser;
let admin: TestUser;
let member: TestUser;
let outsider: TestUser;

beforeAll(async () => {
  org = await world.org();
  owner = (await world.userIn(org, "owner")).user;
  admin = (await world.userIn(org, "admin")).user;
  member = (await world.userIn(org, "member")).user;
  outsider = await world.user("Not a member");
});

afterAll(() => world.cleanup());

const orders = ["asc", "desc"] as const;

// `getFullOrganization` returns every member, in no particular order. The
// caller's role must come from their own membership whatever the order is.
describe.each(orders)("members listed in %s order", (memberOrder) => {
  const as = (user: TestUser) => world.caller(user, org, { memberOrder });

  describe("adminProcedure (modules.setEnabled)", () => {
    it("lets the owner through", async () => {
      await expect(
        (await as(owner)).modules.setEnabled({
          moduleId: "docs",
          enabled: true,
        }),
      ).resolves.toMatchObject({ moduleId: "docs" });
    });

    it("lets an admin through", async () => {
      await expect(
        (await as(admin)).modules.setEnabled({
          moduleId: "docs",
          enabled: true,
        }),
      ).resolves.toMatchObject({ moduleId: "docs" });
    });

    it("rejects a plain member even when another member comes first", async () => {
      await expect(
        (await as(member)).modules.setEnabled({
          moduleId: "docs",
          enabled: false,
        }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    it("rejects a user who is not a member of the organization", async () => {
      await expect(
        (await as(outsider)).modules.setEnabled({
          moduleId: "docs",
          enabled: false,
        }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });
  });

  describe("authorizedProcedure (team.create needs team:create)", () => {
    const input = (name: string) => ({ name, color: "slate" as const });

    it("allows owners and admins", async () => {
      await expect(
        (await as(owner)).team.create(input(`Owner team ${memberOrder}`)),
      ).resolves.toBeDefined();
      await expect(
        (await as(admin)).team.create(input(`Admin team ${memberOrder}`)),
      ).resolves.toBeDefined();
    });

    it("rejects a plain member", async () => {
      await expect(
        (await as(member)).team.create(input(`Member team ${memberOrder}`)),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    it("rejects a non-member", async () => {
      await expect(
        (await as(outsider)).team.create(input(`Outsider team ${memberOrder}`)),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });
  });

  describe("authorizedModuleProcedure (project.createProject)", () => {
    const input = (slug: string) => ({
      name: `Project ${slug}`,
      slug,
      description: "",
    });

    it("allows an admin", async () => {
      await expect(
        (await as(admin)).project.createProject(input(`admin-${memberOrder}`)),
      ).resolves.toBeDefined();
    });

    it("rejects a plain member and a non-member", async () => {
      await expect(
        (await as(member)).project.createProject(
          input(`member-${memberOrder}`),
        ),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
      await expect(
        (await as(outsider)).project.createProject(
          input(`outsider-${memberOrder}`),
        ),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });
  });

  describe("permissions a member does have (doc:create)", () => {
    it("allows a member and rejects a non-member", async () => {
      await expect(
        (await as(member)).docs.create({
          title: "Member doc",
          slug: `member-doc-${memberOrder}`,
        }),
      ).resolves.toBeDefined();
      await expect(
        (await as(outsider)).docs.create({
          title: "Outsider doc",
          slug: `outsider-doc-${memberOrder}`,
        }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });
  });
});
