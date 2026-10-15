import { cn } from "@zentro/ui/lib/utils";
import { initialsOf } from "@zentro/ui/lib/tone";

const tints = [
  "bg-tint-tasks",
  "bg-tint-projects",
  "bg-tint-docs",
  "bg-tint-teams",
  "bg-tint-audit",
] as const;

function tintFor(name: string) {
  let hash = 0;

  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;

  return tints[hash % tints.length];
}

/** Initials on a module tint, the way the design draws people. */
export function ActorAvatar({
  name,
  size = 28,
}: {
  name: string;
  size?: number;
}) {
  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full border border-hairline font-mono text-ink",
        tintFor(name),
      )}
    >
      {initialsOf(name)}
    </span>
  );
}
