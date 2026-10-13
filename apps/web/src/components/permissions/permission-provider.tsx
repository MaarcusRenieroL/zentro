"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { useTrpcClient } from "@zentro/api/react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@zentro/ui/shadcn/tooltip";

export type PermissionMap = Record<string, boolean>;

type PermissionContextValue = {
  baseRole: string | null;
  permissions: PermissionMap;
};

const PermissionContext = createContext<PermissionContextValue>({
  baseRole: null,
  permissions: {},
});

export type PermissionResource = { projectId?: string; teamId?: string };

// Scoped answers (for one project or team) are fetched once and shared.
const scopedCache = new Map<string, Promise<PermissionMap>>();

export function PermissionProvider({
  value,
  children,
}: {
  value: PermissionContextValue;
  children: ReactNode;
}) {
  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermissionMap() {
  return useContext(PermissionContext).permissions;
}

export function useBaseRole() {
  return useContext(PermissionContext).baseRole;
}

function useScopedPermissions(resource?: PermissionResource) {
  const trpc = useTrpcClient();
  const [scoped, setScoped] = useState<PermissionMap | null>(null);
  const projectId = resource?.projectId;
  const teamId = resource?.teamId;

  useEffect(() => {
    if (!projectId && !teamId) {
      return;
    }

    let isMounted = true;
    const cacheKey = `${projectId ?? ""}:${teamId ?? ""}`;
    const request =
      scopedCache.get(cacheKey) ??
      trpc.permissions.check
        .query({ projectId, teamId })
        .then((result) => result.permissions);

    scopedCache.set(cacheKey, request);
    void request
      .then((result) => {
        if (isMounted) setScoped(result);
      })
      .catch(() => scopedCache.delete(cacheKey));

    return () => {
      isMounted = false;
    };
  }, [projectId, teamId, trpc]);

  return scoped;
}

/**
 * Whether the signed-in user holds a permission, optionally for one project or
 * team. This only shapes the UI; the server decides every request.
 */
export function usePermission(key: string, resource?: PermissionResource) {
  const { permissions } = useContext(PermissionContext);
  const scoped = useScopedPermissions(resource);

  if (resource && (resource.projectId || resource.teamId)) {
    return scoped?.[key] ?? false;
  }

  return permissions[key] ?? false;
}

/** True when the user holds at least one of the permissions. */
export function useAnyPermission(
  keys: string[],
  resource?: PermissionResource,
) {
  const { permissions } = useContext(PermissionContext);
  const scoped = useScopedPermissions(resource);
  const source =
    resource && (resource.projectId || resource.teamId) ? scoped : permissions;

  return keys.some((key) => source?.[key] ?? false);
}

type CanProps = {
  permission: string | string[];
  resource?: PermissionResource;
  children: ReactNode;
  /** Shown instead when the permission is missing. */
  fallback?: ReactNode;
};

/** Renders its children only for users who hold the permission. */
export function Can({
  permission,
  resource,
  children,
  fallback = null,
}: CanProps) {
  const keys = Array.isArray(permission) ? permission : [permission];
  const allowed = useAnyPermission(keys, resource);

  return allowed ? children : fallback;
}

/** Wraps a disabled control so people can see why it is unavailable. */
export function DisabledReason({
  reason,
  children,
}: {
  reason: string;
  children: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex">{children}</span>
      </TooltipTrigger>
      <TooltipContent>{reason}</TooltipContent>
    </Tooltip>
  );
}
