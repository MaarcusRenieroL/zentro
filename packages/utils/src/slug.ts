/**
 * For fields that are normalized while the user types: a trailing hyphen is
 * kept so the user can keep typing the next word ("my-" -> "my-org").
 */
export function slugifyInput(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[_\s]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+/, "");
}

/** A finished slug: lowercase letters, digits and single inner hyphens. */
export function slugify(text: string): string {
  return slugifyInput(text).replace(/-+$/, "");
}
