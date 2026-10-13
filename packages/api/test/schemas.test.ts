import { describe, expect, it } from "vitest";

import { createDocSchema, reservedDocSlugs } from "../src/types/zod-schema";

describe("createDocSchema slug", () => {
  it.each(reservedDocSlugs)("rejects the reserved slug %s", (slug) => {
    const result = createDocSchema.safeParse({ slug });

    expect(result.success).toBe(false);
  });

  it("covers every static route that sits next to /docs/[slug]", () => {
    expect([...reservedDocSlugs].sort()).toEqual(
      ["my-docs", "new", "projects", "recent", "search", "trash"].sort(),
    );
  });

  it("accepts a normal slug and slugs that merely contain a reserved word", () => {
    expect(createDocSchema.safeParse({ slug: "team-handbook" }).success).toBe(
      true,
    );
    expect(createDocSchema.safeParse({ slug: "trash-me" }).success).toBe(true);
  });

  it.each(["Upper", "with space", "-lead", "trail-", "double--dash", ""])(
    "rejects the malformed slug %j",
    (slug) => {
      expect(createDocSchema.safeParse({ slug }).success).toBe(false);
    },
  );
});
