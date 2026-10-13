"use client";

import { useEffect, useState } from "react";

import { useTrpcClient } from "@zentro/api/react";

export type CatalogEntry = {
  key: string;
  label: string;
  description: string;
  module: string;
  group: string;
  scopes: string[];
  ownerOnly: boolean;
  uiOnly: string | null;
  enabled: boolean;
};

/** The permission catalog, loaded once per screen. */
export function useCatalog() {
  const trpc = useTrpcClient();
  const [catalog, setCatalog] = useState<CatalogEntry[] | null>(null);

  useEffect(() => {
    let isMounted = true;

    trpc.permissions.catalog
      .query()
      .then((result) => {
        if (isMounted) setCatalog(result.permissions);
      })
      .catch(() => {
        if (isMounted) setCatalog([]);
      });

    return () => {
      isMounted = false;
    };
  }, [trpc]);

  return catalog;
}

export const scopeLabels: Record<string, string> = {
  organization: "Organization",
  team: "Team",
  project: "Project",
};
