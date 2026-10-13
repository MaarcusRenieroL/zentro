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
  userId?: string;
  /** Held organization-wide. */
  permissions: PermissionMap;
  /** Held organization-wide, or in at least one project or team. */
  reachable?: PermissionMap;
};

const PermissionContext = createContext<PermissionContextValue>({
  baseRole: null,
  permissions: {},
});

export type PermissionResource = {
  projectId?: string;
  teamId?: string;
  /** The user who created the item on screen, so `_own` permissions resolve. */
  ownerUserId?: string | null;
};

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

/**
 * Whether the user holds a permission anywhere: organization-wide, or through
 * a role on a project or team. Use it to decide if an area is worth showing.
 */
export function useReachable(key: string) {
  const { permissions, reachable } = useContext(PermissionContext);

  return (reachable ?? permissions)[key] ?? false;
}

export function useCurrentUserId() {
  return useContext(PermissionContext).userId;
}

export function useBaseRole() {
  return useContext(PermissionContext).baseRole;
}

function isScoped(resource?: PermissionResource) {
  return Boolean(
    resource?.projectId || resource?.teamId || resource?.ownerUserId,
  );
}

function useScopedPermissions(resource?: PermissionResource) {
  const trpc = useTrpcClient();
  const [scoped, setScoped] = useState<PermissionMap | null>(null);
  const projectId = resource?.projectId;
  const teamId = resource?.teamId;
  const ownerUserId = resource?.ownerUserId ?? undefined;

  useEffect(() => {
    if (!projectId && !teamId && !ownerUserId) {
      return;
    }

    let isMounted = true;
    const cacheKey = `${projectId ?? ""}:${teamId ?? ""}:${ownerUserId ?? ""}`;
    const request =
      scopedCache.get(cacheKey) ??
      trpc.permissions.check
        .query({ projectId, teamId, ownerUserId })
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
  }, [projectId, teamId, ownerUserId, trpc]);

  return scoped;
}

/**
 * Whether the signed-in user holds a permission, optionally for one project or
 * team. This only shapes the UI; the server decides every request.
 */
export function usePermission(key: string, resource?: PermissionResource) {
  const { permissions } = useContext(PermissionContext);
  const scoped = useScopedPermissions(resource);

  if (isScoped(resource)) {
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
  const source = isScoped(resource) ? scoped : permissions;

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
