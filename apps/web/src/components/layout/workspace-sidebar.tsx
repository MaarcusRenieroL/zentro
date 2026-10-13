"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import type { ModuleNavLink, ModuleNavSection } from "@zentro/modules";
import {
  WorkspaceSidebar as BaseWorkspaceSidebar,
  type WorkspaceSidebarSection,
} from "@zentro/ui/components/workspace-sidebar";

import { getModuleIcon } from "~/src/lib/module-icons";

function parseHref(href: string) {
  const url = new URL(href, "http://zentro.local");

  return { path: url.pathname, params: url.searchParams };
}

/**
 * Picks the one link that matches the current route. A link's own query
 * parameters must all be present; more specific matches (exact path, matching
 * query) beat a plain path prefix.
 */
export function findActiveHref(
  hrefs: string[],
  pathname: string,
  searchParams: URLSearchParams,
) {
  let best: { href: string; score: number } | null = null;

  for (const href of hrefs) {
    const { path, params } = parseHref(href);
    const exact = pathname === path;
    const prefix = pathname.startsWith(`${path}/`);

    if (!exact && !prefix) {
      continue;
    }

    let queryMatches = true;

    params.forEach((value, key) => {
      if (searchParams.get(key) !== value) {
        queryMatches = false;
      }
    });

    if (!queryMatches) {
      continue;
    }

    const score = (exact ? 1000 : 0) + path.length + params.size * 10_000;

    if (!best || score > best.score) {
      best = { href, score };
    }
  }

  return best?.href ?? null;
}

function toLink(link: ModuleNavLink) {
  return { ...link, icon: getModuleIcon(link.icon) };
}

function toSidebarSections(
  sections: ModuleNavSection[],
): WorkspaceSidebarSection[] {
  return sections.map((section) => ({
    label: section.label,
    items: section.items.map((item) => ({
      ...toLink(item),
      children: item.children?.map(toLink),
    })),
  }));
}

function getLeafHrefs(sections: ModuleNavSection[]) {
  return sections.flatMap((section) =>
    section.items.flatMap((item) =>
      item.children?.length
        ? item.children.map((child) => child.href)
        : [item.href],
    ),
  );
}

type Props = {
  sections: ModuleNavSection[];
};

export const WorkspaceSidebar = ({ sections }: Props) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeHref = findActiveHref(
    getLeafHrefs(sections),
    pathname,
    searchParams,
  );

  return (
    <BaseWorkspaceSidebar
      pathname={pathname}
      LinkComponent={Link}
      isActivePath={(_, href) => href === activeHref}
      sections={toSidebarSections(sections)}
    />
  );
};
