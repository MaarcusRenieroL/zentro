import { moduleRegistry } from "./registry";
import type {
  ModuleId,
  ModuleManifest,
  ModuleNavSection,
  ModuleStateRow,
  ModuleToggleCheck,
} from "./types";

export function listModules(): readonly ModuleManifest[] {
  return moduleRegistry;
}

export function getModule(moduleId: string): ModuleManifest | undefined {
  return moduleRegistry.find((manifest) => manifest.id === moduleId);
}

/**
 * Applies stored rows on top of the manifests' defaults. A missing row means
 * "use `defaultEnabled`"; core modules are always enabled.
 */
export function resolveEnabled(rows: readonly ModuleStateRow[]): Set<ModuleId> {
  const stored = new Map(rows.map((row) => [row.moduleId, row.enabled]));
  const enabled = new Set<ModuleId>();

  for (const manifest of moduleRegistry) {
    if (manifest.core || (stored.get(manifest.id) ?? manifest.defaultEnabled)) {
      enabled.add(manifest.id);
    }
  }

  return enabled;
}

/** Modules that list `moduleId` in `dependsOn`. */
export function dependentsOf(moduleId: string): ModuleManifest[] {
  return moduleRegistry.filter((manifest) =>
    (manifest.dependsOn as string[]).includes(moduleId),
  );
}

export function canEnable(
  moduleId: string,
  enabled: ReadonlySet<string>,
): ModuleToggleCheck {
  const manifest = getModule(moduleId);

  if (!manifest) {
    return { allowed: false, reason: "Unknown module." };
  }

  const missing = manifest.dependsOn
    .filter((dependencyId) => !enabled.has(dependencyId))
    .map((dependencyId) => getModule(dependencyId)?.name ?? dependencyId);

  if (missing.length > 0) {
    return {
      allowed: false,
      reason: `Requires ${missing.join(", ")} to be enabled.`,
    };
  }

  return { allowed: true };
}

export function canDisable(
  moduleId: string,
  enabled: ReadonlySet<string>,
): ModuleToggleCheck {
  const manifest = getModule(moduleId);

  if (!manifest) {
    return { allowed: false, reason: "Unknown module." };
  }

  if (manifest.core) {
    return { allowed: false, reason: "Core modules are always on." };
  }

  const activeDependents = dependentsOf(moduleId)
    .filter((dependent) => enabled.has(dependent.id))
    .map((dependent) => dependent.name);

  if (activeDependents.length > 0) {
    return {
      allowed: false,
      reason: `Turn off ${activeDependents.join(", ")} first.`,
    };
  }

  return { allowed: true };
}

/** Merges the nav of the enabled modules into ordered sidebar sections. */
export function buildNavSections(
  enabled: ReadonlySet<string>,
): ModuleNavSection[] {
  const sections = new Map<string, ModuleNavSection>();

  for (const manifest of moduleRegistry) {
    if (!enabled.has(manifest.id)) {
      continue;
    }

    for (const section of manifest.nav) {
      const existing = sections.get(section.id);

      if (existing) {
        existing.items.push(...section.items);
      } else {
        sections.set(section.id, { ...section, items: [...section.items] });
      }
    }
  }

  return [...sections.values()].sort((a, b) => a.order - b.order);
}
