export type ModuleId =
  | "dashboard"
  | "settings"
  | "projects"
  | "tasks"
  | "docs"
  | "chat"
  | "files";

export type ModuleNavLink = {
  label: string;
  /** Plain path string, for example `/tasks`. */
  href: string;
  /** Name of a lucide icon; the app resolves it to a component. */
  icon: string;
  disabled?: boolean;
  /** Permission key needed to see this link; the link is hidden without it. */
  permission?: string;
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

export type PermissionScope = "organization" | "team" | "project";

export type PermissionDefinition = {
  /** `module.resource.action`, for example `tasks.update_any`. */
  key: string;
  label: string;
  description: string;
  /** Heading the permission is listed under in the role editor. */
  group: string;
  /** Scopes the permission can be granted at. */
  scopes: PermissionScope[];
  /** Only organization owners can hold or use it. */
  ownerOnly?: boolean;
  /** Set when no procedure enforces the key yet; the reason says why. */
  uiOnly?: string;
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
  /** Key prefixes this module owns (for example `tasks`). */
  permissionNamespaces: string[];
  permissions: PermissionDefinition[];
};

/** The part of an `organization_module` row the helpers need. */
export type ModuleStateRow = {
  moduleId: string;
  enabled: boolean;
};

export type ModuleToggleCheck =
  | { allowed: true }
  | { allowed: false; reason: string };
