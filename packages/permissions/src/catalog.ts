import {
  listModules,
  platformPermissions,
  type PermissionDefinition,
} from "@zentro/modules";

export type CatalogEntry = PermissionDefinition & {
  /** Owning module id, or "platform" for permissions no module owns. */
  module: string;
};

export function buildCatalog(): CatalogEntry[] {
  return [
    ...listModules().flatMap((manifest) =>
      manifest.permissions.map((permission) => ({
        ...permission,
        module: manifest.id,
      })),
    ),
    ...platformPermissions.map((permission) => ({
      ...permission,
      module: "platform",
    })),
  ];
}

const catalog = buildCatalog();
const index = new Map(catalog.map((entry) => [entry.key, entry]));

export function getCatalog(): readonly CatalogEntry[] {
  return catalog;
}

export function getPermission(key: string): CatalogEntry | undefined {
  return index.get(key);
}

export function isKnownPermission(key: string) {
  return index.has(key);
}

export function getCatalogKeys() {
  return catalog.map((entry) => entry.key);
}

/** `tasks.update_own` <-> `tasks.update_any`. */
export function getAnyKey(key: string) {
  return key.endsWith("_own") ? key.replace(/_own$/, "_any") : null;
}
