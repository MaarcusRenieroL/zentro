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
const rootDomain = new URL(appBaseUrl).host;
const protocol = new URL(appBaseUrl).protocol.replace(":", "");

function normalizePath(path?: string) {
  if (!path) return "";

  return path.startsWith("/") ? path : `/${path}`;
}

export function getOrgAppUrl({
  orgSlug,
  app,
  path,
}: GetOrgAppUrlInput): string {
  const normalizedPath = normalizePath(path);

  if (app === "workspace") {
    return `${protocol}://${orgSlug}.${rootDomain}${normalizedPath}`;
  }

  return `${protocol}://${orgSlug}.${app}.${rootDomain}${normalizedPath}`;
}

export function getAuthAppUrl({ path }: GetAuthAppUrlInput = {}): string {
  return `${authBaseUrl}${normalizePath(path)}`;
}

function isOrgApp(value: string): value is Exclude<ZentroApp, "workspace"> {
  return ["chat", "whiteboard", "tasks", "docs"].includes(value);
}

export function resolveOrgAppFromHost(host: string): ResolvedOrgApp | null {
  const hostname = host.split(",")[0]?.trim().toLowerCase();
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
      app: "workspace",
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
