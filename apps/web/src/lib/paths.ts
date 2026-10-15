// Single source of truth for internal links. Plain paths only (no host
// logic) so an org-in-the-URL scheme can be introduced here later.

function withQuery(path: string, query?: Record<string, string | undefined>) {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(query ?? {})) {
    if (value) {
      search.set(key, value);
    }
  }

  const queryString = search.toString();

  return queryString ? `${path}?${queryString}` : path;
}

export const paths = {
  home: () => "/",
  dashboard: () => "/dashboard",

  projects: (query?: { status?: "active" | "archived" }) =>
    withQuery("/projects", query),
  project: (slug: string) => `/projects/${slug}`,
  projectSettings: (slug: string) => `/projects/${slug}/settings`,
  projectGeneralSettings: (slug: string) =>
    `/projects/${slug}/settings/general`,
  projectDangerSettings: (slug: string) => `/projects/${slug}/settings/danger`,

  tasks: () => "/tasks",
  task: (key: string) => `/tasks/${key}`,
  tasksForProject: (slug: string) => withQuery("/tasks", { project: slug }),
  tasksOverview: () => "/tasks/overview",

  docs: () => "/docs",
  doc: (slug: string) => `/docs/${slug}`,
  myDocs: () => "/docs/my-docs",
  recentDocs: () => "/docs/recent",
  projectDocs: () => "/docs/projects",
  trashedDocs: () => "/docs/trash",
  searchDocs: (query?: string) => withQuery("/docs/search", { q: query }),

  inbox: () => "/inbox",
  statusPage: "https://status.zentro.app",
  supportEmail: "support@zentro.app",
  files: () => "/files",
  chat: () => "/chat",
  maintenance: () => "/maintenance",

  moduleDisabled: (moduleId: string) =>
    withQuery("/module-disabled", { module: moduleId }),

  settings: () => "/settings",
  organizationSettings: () => "/settings/organization",
  generalSettings: () => "/settings/organization/general",
  membersSettings: () => "/settings/organization/members",
  teamsSettings: () => "/settings/organization/teams",
  invitationsSettings: () => "/settings/organization/invitations",
  modulesSettings: () => "/settings/organization/modules",
  rolesSettings: () => "/settings/organization/roles",
  role: (id: string) => `/settings/organization/roles/${id}`,
  rolesAssignments: () => "/settings/organization/roles/assignments",
  auditLogSettings: () => "/settings/organization/audit-log",
  permissionLog: () => "/settings/organization/roles/log",
  accessCheck: () => "/settings/organization/roles/access-check",
  projectAccessSettings: (slug: string) => `/projects/${slug}/settings/access`,
  dangerSettings: () => "/settings/organization/danger",

  auth: {
    signIn: (redirectTo?: string) => withQuery("/auth/sign-in", { redirectTo }),
    signUp: () => "/auth/sign-up",
    verifyEmail: (email?: string) => withQuery("/auth/verify-email", { email }),
    forgotPassword: () => "/auth/forgot-password",
    resetPassword: () => "/auth/reset-password",
    createOrganization: () => "/auth/create-organization",
    joinOrganization: () => "/auth/join-organization",
    invite: (code: string) => `/auth/invite/${encodeURIComponent(code)}`,
  },
} as const;

// Only same-origin absolute paths may be used as post-login destinations.
export function getSafeRedirectPath(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return null;
  }

  return value;
}
