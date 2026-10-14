"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { SectionNav } from "@zentro/ui/components/section-nav";

import { findActiveHref } from "~/src/lib/active-href";

type Item = { label: string; href: string };

/**
 * A module's sub-pages (the manifest's children) as page-level navigation.
 * It only shows on the module's own list pages, not on a task or a doc.
 */
export function ModuleSectionNav({
  items,
  label,
}: {
  items: Item[];
  label: string;
}) {
  const pathname = usePathname();
  const search = useSearchParams();

  if (items.length < 2) return null;

  const onListPage = items.some(
    (item) => new URL(item.href, "http://zentro.local").pathname === pathname,
  );

  if (!onListPage) return null;

  const activeHref = findActiveHref(
    items.map((item) => item.href),
    pathname,
    new URLSearchParams(search.toString()),
  );

  return (
    <SectionNav
      label={label}
      items={items}
      activeHref={activeHref}
      LinkComponent={Link}
      className="mb-5"
    />
  );
}
