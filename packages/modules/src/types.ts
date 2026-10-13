export type ModuleId = "dashboard" | "settings" | "projects" | "tasks" | "docs";

export type ModuleNavLink = {
  label: string;
  /** Plain path string, for example `/tasks`. */
  href: string;
  /** Name of a lucide icon; the app resolves it to a component. */
  icon: string;
  disabled?: boolean;
};

export type ModuleNavItem = ModuleNavLink & {
  children?: ModuleNavLink[];
};

export type ModuleNavSection = {
  /** Sections with the same id are merged across modules. */
  id: string;
  label: string;
  /** Sections are shown in ascending order. */
  order: number;
  items: ModuleNavItem[];
};

export type ModuleManifest = {
  id: ModuleId;
  name: string;
  description: string;
  /** Name of a lucide icon. */
  icon: string;
  basePath: string;
  /** Core modules are always on and cannot be disabled. */
  core: boolean;
  defaultEnabled: boolean;
  dependsOn: ModuleId[];
  nav: ModuleNavSection[];
};

/** The part of an `organization_module` row the helpers need. */
export type ModuleStateRow = {
  moduleId: string;
  enabled: boolean;
};

export type ModuleToggleCheck =
  | { allowed: true }
  | { allowed: false; reason: string };
