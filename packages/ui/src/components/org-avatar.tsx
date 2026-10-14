import type { ReactElement } from "react";

import { cn } from "@zentro/ui/lib/utils";
import { initialsOf, toneClass } from "@zentro/ui/lib/tone";

const sizes = {
  sm: "size-6 text-[0.625rem]",
  md: "size-8 text-xs",
  lg: "size-12 text-base",
} as const;

/** An organization's mark: a squircle with its initials in a stable tone. */
export function OrgAvatar({
  name,
  seed,
  size = "md",
  className,
}: {
  name: string;
  seed?: string;
  size?: keyof typeof sizes;
  className?: string;
}): ReactElement {
  return (
    <span
      aria-hidden="true"
      data-slot="org-avatar"
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-[28%] bg-(--cat-subtle) font-semibold text-(--cat-text) ring-1 ring-border-default select-none",
        toneClass(seed ?? name),
        sizes[size],
        className,
      )}
    >
      {initialsOf(name)}
    </span>
  );
}
