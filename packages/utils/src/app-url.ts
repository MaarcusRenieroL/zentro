export type ZentroApp = "workspace" | "chat" | "whiteboard" | "tasks" | "docs";

export type GetOrgAppUrlInput = {
  orgSlug: string;
  app: ZentroApp;
  path?: string;
};

export type GetAuthAppUrlInput = {
  path?: string;
};

export type ResolvedOrgApp = {
  orgSlug: string;
  app: ZentroApp;
};

const appBaseUrl =
  process.env.NEXT_PUBLIC_ZENTRO_APP_URL ??
  process.env.NEXT_PUBLIC_BASE_URL ??
  "http://localhost:3000";
const authBaseUrl =
  process.env.NEXT_PUBLIC_AUTHENTICATOR_URL ?? "http://localhost:3001";
const appUrl = new URL(appBaseUrl);
const rootDomain =
  process.env.NEXT_PUBLIC_ZENTRO_ROOT_DOMAIN ?? appUrl.hostname;
const protocol = appUrl.protocol.replace(":", "");

const localAppPorts: Partial<Record<ZentroApp, string>> = {
  workspace: "3000",
  tasks: "3002",
};

function normalizePath(path?: string) {
  if (!path) return "";

  return path.startsWith("/") ? path : `/${path}`;
}

function isLocalDomain(domain: string) {
  return domain === "localhost" || domain === "127.0.0.1";
}

function getLocalAppFromPort(port?: string): ZentroApp {
  const app = Object.entries(localAppPorts).find(([, appPort]) => {
    return appPort === port;
  })?.[0];

  return (app as ZentroApp | undefined) ?? "workspace";
}

function getAppPort(app: ZentroApp) {
  if (isLocalDomain(rootDomain)) {
    return localAppPorts[app] ?? appUrl.port;
  }

  return appUrl.port;
}

function getOrgAppHost(orgSlug: string, app: ZentroApp) {
  if (isLocalDomain(rootDomain)) {
    const port = getAppPort(app);

    return port
      ? `${orgSlug}.${rootDomain}:${port}`
      : `${orgSlug}.${rootDomain}`;
  }

  const host =
    app === "workspace"
      ? `${orgSlug}.${rootDomain}`
      : `${orgSlug}.${app}.${rootDomain}`;
  const port = getAppPort(app);

  return port ? `${host}:${port}` : host;
}

export function getOrgAppUrl({
  orgSlug,
  app,
  path,
}: GetOrgAppUrlInput): string {
  const normalizedPath = normalizePath(path);

  return `${protocol}://${getOrgAppHost(orgSlug, app)}${normalizedPath}`;
}

export function getAuthAppUrl({ path }: GetAuthAppUrlInput = {}): string {
  return `${authBaseUrl}${normalizePath(path)}`;
}

function isOrgApp(value: string): value is Exclude<ZentroApp, "workspace"> {
  return ["chat", "whiteboard", "tasks", "docs"].includes(value);
}

export function resolveOrgAppFromHost(host: string): ResolvedOrgApp | null {
  const normalizedHost = host.split(",")[0]?.trim().toLowerCase();
  const [hostname, port] = normalizedHost?.split(":") ?? [];
  const domain = rootDomain.toLowerCase();

  if (!hostname?.endsWith(`.${domain}`)) {
    return null;
  }

  const subdomain = hostname.slice(0, -`.${domain}`.length);

  if (!subdomain) {
    return null;
  }

  const parts = subdomain.split(".");

  if (parts.length === 1) {
    const orgSlug = parts[0];

    if (!orgSlug) {
      return null;
    }

    return {
      orgSlug,
      app: isLocalDomain(domain) ? getLocalAppFromPort(port) : "workspace",
    };
  }

  const [orgSlug, app] = parts;

  if (parts.length === 2 && orgSlug && app && isOrgApp(app)) {
    return {
      orgSlug,
      app,
    };
  }

  return null;
}
