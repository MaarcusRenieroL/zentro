"use client";

import { StarIcon } from "lucide-react";

import { cn } from "@zentro/ui/lib/utils";
import { Button } from "@zentro/ui/shadcn/button";

import {
  useFavorites,
  type FavoriteType,
} from "~/src/components/projects/favorites";

/** Stars a project, doc or task for the signed-in person. */
export function StarButton({
  type,
  id,
  title,
  href,
  className,
}: {
  type: FavoriteType;
  id: string;
  title: string;
  href: string;
  className?: string;
}) {
  const { isFavorite, toggle } = useFavorites();
  const starred = isFavorite(type, id);

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-pressed={starred}
      aria-label={starred ? "Remove from favorites" : "Add to favorites"}
      onClick={() => void toggle({ type, id, title, href })}
      className={cn("size-8", className)}
    >
      <StarIcon
        className={cn("size-4", starred ? "fill-signal text-signal" : "")}
      />
    </Button>
  );
}
