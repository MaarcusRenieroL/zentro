import { listModules } from "@zentro/modules";
import { describe, expect, it } from "vitest";

import {
  getCatalog,
  getSystemRoleDefinitions,
  isKnownPermission,
} from "../src";

describe("permission catalog", () => {
  const catalog = getCatalog();

  it("has unique keys", () => {
    const keys = catalog.map((entry) => entry.key);

    expect(new Set(keys).size).toBe(keys.length);
  });

  it("uses dotted keys", () => {
    for (const entry of catalog) {
      expect(entry.key, entry.key).toMatch(/^[a-z_]+(\.[a-z_]+)+$/);
    }
  });

  it("namespaces every module key with a prefix the module owns", () => {
    for (const manifest of listModules()) {
      for (const permission of manifest.permissions) {
        const prefix = permission.key.split(".")[0]!;

        expect(
          manifest.permissionNamespaces,
          `${manifest.id}: ${permission.key}`,
        ).toContain(prefix);
      }
    }
  });

  it("does not let two modules declare the same key or share a namespace", () => {
    const namespaces = listModules().flatMap(
      (manifest) => manifest.permissionNamespaces,
    );

    expect(new Set(namespaces).size).toBe(namespaces.length);

    const platformPrefixes = catalog
      .filter((entry) => entry.module === "platform")
      .map((entry) => entry.key.split(".")[0]!);

    for (const prefix of platformPrefixes) {
      expect(namespaces).not.toContain(prefix);
    }
  });

  it("includes every key of every manifest", () => {
    for (const manifest of listModules()) {
      for (const permission of manifest.permissions) {
        expect(isKnownPermission(permission.key)).toBe(true);
      }
    }
  });

  it("describes every entry", () => {
    for (const entry of catalog) {
      expect(entry.label.length, entry.key).toBeGreaterThan(2);
      expect(entry.description.length, entry.key).toBeGreaterThan(5);
      expect(entry.group.length, entry.key).toBeGreaterThan(1);
      expect(entry.scopes.length, entry.key).toBeGreaterThan(0);
    }
  });

  it("marks only org.delete and org.ownership.transfer as owner-only", () => {
    expect(
      catalog.filter((entry) => entry.ownerOnly).map((entry) => entry.key),
    ).toEqual(["org.delete", "org.ownership.transfer"]);
  });

  it("covers the minimum key set", () => {
    for (const key of [
      "org.settings.view",
      "members.invite",
      "invitations.resend",
      "teams.members.manage",
      "projects.view_private",
      "tasks.delete_any",
      "docs.trash_own",
      "comments.delete_any",
      "modules.manage",
      "roles.assign",
      "permissions.explain",
    ]) {
      expect(isKnownPermission(key), key).toBe(true);
    }
  });
});

describe("system role defaults", () => {
  const roles = Object.fromEntries(
    getSystemRoleDefinitions().map((role) => [role.systemKey, role]),
  );
  const keys = new Set(getCatalog().map((entry) => entry.key));

  it("only contain known keys", () => {
    for (const role of Object.values(roles)) {
      for (const key of role.permissions) {
        expect(keys.has(key), `${role.systemKey}: ${key}`).toBe(true);
      }
    }
  });

  it("gives the owner everything and the admin everything but owner-only keys", () => {
    expect(roles.owner!.permissions.length).toBe(keys.size);
    expect(roles.admin!.permissions).not.toContain("org.delete");
    expect(roles.admin!.permissions).not.toContain("org.ownership.transfer");
    expect(roles.admin!.permissions.length).toBe(keys.size - 2);
  });

  it("keeps the member inside the admin", () => {
    for (const key of roles.member!.permissions) {
      expect(roles.admin!.permissions).toContain(key);
    }
  });

  it("only grants keys a role scope can hold", () => {
    for (const role of Object.values(roles)) {
      for (const key of role.permissions) {
        const entry = getCatalog().find((item) => item.key === key)!;

        expect(entry.scopes, `${role.systemKey}: ${key}`).toContain(role.scope);
      }
    }
  });

  it("keeps project roles ordered: viewer inside member inside lead", () => {
    for (const key of roles.project_viewer!.permissions) {
      expect(roles.project_member!.permissions).toContain(key);
    }

    for (const key of roles.project_member!.permissions) {
      expect(roles.project_lead!.permissions).toContain(key);
    }
  });

  it("reproduces what members could do before, and nothing administrative", () => {
    const member = roles.member!.permissions;

    for (const key of [
      "tasks.create",
      "tasks.update_any",
      "tasks.delete_any",
      "docs.create",
      "docs.update_any",
      "docs.trash_any",
      "docs.comment",
      "projects.view",
      "teams.view",
      "members.view",
    ]) {
      expect(member, key).toContain(key);
    }

    for (const key of [
      "projects.create",
      "projects.update",
      "projects.delete",
      "teams.create",
      "members.invite",
      "members.remove",
      "invitations.view",
      "org.settings.update",
      "modules.manage",
      "roles.view",
    ]) {
      expect(member, key).not.toContain(key);
    }
  });
});
