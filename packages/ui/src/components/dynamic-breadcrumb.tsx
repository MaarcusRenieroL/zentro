"use client";

import { ComponentType, FC, ReactNode } from "react";
import { EllipsisIcon } from "lucide-react";

import { useSidebar } from "./shadcn/sidebar";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./shadcn/breadcrumb";

type LinkComponentProps = {
  href: string;
  children: ReactNode;
  className?: string;
};

type BreadcrumbItemData = {
  label: string;
  href: string;
};

type VisibleBreadcrumbItem = BreadcrumbItemData | "ellipsis";

type Props = {
  pathname: string;
  LinkComponent: ComponentType<LinkComponentProps>;
  maxItems?: number;
};

function formatLabel(segment: string) {
  return decodeURIComponent(segment)
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getBreadcrumbItems(pathname: string): BreadcrumbItemData[] {
  const segments = pathname.split("/").filter(Boolean);

  return [
    { label: "Home", href: "/" },
    ...segments.map((segment, index) => {
      const href = "/" + segments.slice(0, index + 1).join("/");

      return {
        label: formatLabel(segment),
        href,
      };
    }),
  ];
}

function getVisibleBreadcrumbItems(
  items: BreadcrumbItemData[],
  maxItems: number,
): VisibleBreadcrumbItem[] {
  if (items.length <= maxItems) return items;

  const firstItem = items[0];

  if (!firstItem) return [];

  return [firstItem, "ellipsis", ...items.slice(items.length - (maxItems - 2))];
}

export const DynamicBreadcrumb: FC<Props> = ({
  pathname,
  LinkComponent,
  maxItems = 4,
}) => {
  const { open } = useSidebar();

  if (open) return null;

  const safeMaxItems = Math.max(maxItems, 3);

  const items = getBreadcrumbItems(pathname);
  const visibleItems = getVisibleBreadcrumbItems(items, safeMaxItems);

  return (
    <Breadcrumb className="min-w-0 overflow-hidden text-muted-foreground">
      <BreadcrumbList className="flex-nowrap overflow-hidden whitespace-nowrap">
        {visibleItems.map((item, index) => {
          const isLast = index === visibleItems.length - 1;
          const showSeparator = !isLast;

          if (item === "ellipsis") {
            return (
              <div key="ellipsis" className="flex shrink-0 items-center gap-2">
                <BreadcrumbItem>
                  <EllipsisIcon className="size-4" />
                </BreadcrumbItem>

                {showSeparator && <BreadcrumbSeparator />}
              </div>
            );
          }

          return (
            <div
              key={item.href}
              className="flex min-w-0 shrink-0 items-center gap-2 last:shrink"
            >
              <BreadcrumbItem className="min-w-0">
                {isLast ? (
                  <BreadcrumbPage className="block truncate">
                    {item.label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <LinkComponent className="block truncate" href={item.href}>
                      {item.label}
                    </LinkComponent>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>

              {showSeparator && <BreadcrumbSeparator />}
            </div>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
};
