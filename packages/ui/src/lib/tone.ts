/** A stable number from a string, for picking a categorical color. */
export function hashSeed(seed: string) {
  let hash = 0;

  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }

  return hash;
}

/** `cat-1` to `cat-8`: the same seed always gets the same tone. */
export function toneClass(seed: string | null | undefined) {
  return `cat-${(hashSeed(seed ?? "") % 8) + 1}`;
}

export function initialsOf(name: string | null | undefined) {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);

  if (!parts.length) {
    return "?";
  }

  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}
