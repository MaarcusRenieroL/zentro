"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { cn } from "@zentro/ui/lib/utils";

import { findActiveHref } from "~/src/lib/active-href";

type Item = { label: string; href: string };

type NavContext = {
  items: Item[];
  label: string;
  /** A page that draws the tabs itself (under its own title) claims them. */
  claimed: boolean;
  setClaimed: (claimed: boolean) => void;
};

const ModuleNavContext = createContext<NavContext | null>(null);

/**
 * Holds a module's sub-pages so either the layout (above the page) or the
 * page itself (under its title) can draw them, never both.
 */
export function ModuleNavProvider({
  items,
  label,
  children,
}: {
  items: Item[];
  label: string;
  children: ReactNode;
}) {
  const [claimed, setClaimed] = useState(false);
  const value = useMemo(
    () => ({ items, label, claimed, setClaimed }),
    [items, label, claimed],
  );

  return (
    <ModuleNavContext.Provider value={value}>
      {children}
    </ModuleNavContext.Provider>
  );
}

function useActive(items: Item[]) {
  const pathname = usePathname();
  const search = useSearchParams();

  const onListPage = items.some(
    (item) => new URL(item.href, "http://zentro.local").pathname === pathname,
  );
  const activeHref = findActiveHref(
    items.map((item) => item.href),
    pathname,
    new URLSearchParams(search.toString()),
  );

  return { onListPage, activeHref };
}

/**
 * A module's sub-pages (the manifest's children) as page-level navigation.
 * It only shows on the module's own list pages, not on a task or a doc, and
 * stays out of the way when the page draws its own tabs under its title.
 */
export function ModuleSectionNav() {
  const context = useContext(ModuleNavContext);
  const items = context?.items ?? [];
  const { onListPage } = useActive(items);

  if (!context || context.claimed || items.length < 2 || !onListPage) {
    return null;
  }

  return <TabsList className="mb-5" />;
}

/** Claims the module tabs without drawing them (a page that has no tabs). */
export function ModuleNavClaim() {
  const context = useContext(ModuleNavContext);
  const setClaimed = context?.setClaimed;

  useEffect(() => {
    if (!setClaimed) return;

    setClaimed(true);

    return () => setClaimed(false);
  }, [setClaimed]);

  return null;
}

function TabsList({
  counts = {},
  className,
}: {
  counts?: Record<string, number | undefined>;
  className?: string;
}) {
  const context = useContext(ModuleNavContext);
  const items = context?.items ?? [];
  const { activeHref } = useActive(items);

  if (!context) return null;

  return (
    <nav
      data-slot="section-nav"
      aria-label={context.label}
      className={cn(
        "hide-scrollbar flex gap-5 overflow-x-auto border-b border-hairline text-sm",
        className,
      )}
    >
      {items.map((item) => {
        const active = item.href === activeHref;
        const count = counts[item.href];

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "-mb-px flex gap-1.5 border-b-2 py-2.5 whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "border-ink font-medium text-ink"
                : "border-transparent text-ink-2 hover:text-ink",
            )}
          >
            {item.label}
            {count !== undefined ? (
              <span className="font-mono text-xs text-ink-3">{count}</span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

/** The same sub-pages as underline tabs, with optional mono counts. */
export function ModuleTabs({
  counts = {},
  className,
}: {
  counts?: Record<string, number | undefined>;
  className?: string;
}) {
  const context = useContext(ModuleNavContext);
  const setClaimed = context?.setClaimed;
  const items = context?.items ?? [];
  const { onListPage } = useActive(items);
  const show = Boolean(context) && items.length >= 2 && onListPage;

  useEffect(() => {
    if (!show || !setClaimed) return;

    setClaimed(true);

    return () => setClaimed(false);
  }, [show, setClaimed]);

  if (!show) return null;

  return <TabsList counts={counts} className={className} />;
}
