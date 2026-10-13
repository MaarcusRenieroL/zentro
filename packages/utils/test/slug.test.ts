import { describe, expect, it } from "vitest";

import { slugify } from "../src";

describe("slugify", () => {
  it("lowercases and joins words with hyphens", () => {
    expect(slugify("Acme Inc")).toBe("acme-inc");
  });

  it("strips punctuation", () => {
    expect(slugify("Acme, Inc.!")).toBe("acme-inc");
  });

  it("collapses repeated spaces and hyphens", () => {
    expect(slugify("a   b---c")).toBe("a-b-c");
  });

  it("keeps digits", () => {
    expect(slugify("Team 42")).toBe("team-42");
  });

  it("returns an empty string when nothing usable is left", () => {
    expect(slugify("!!!")).toBe("");
  });

  // Bug: the trim runs after whitespace became hyphens, so surrounding
  // whitespace leaves leading/trailing hyphens that the slug validators reject.
  it.fails("does not leave leading or trailing hyphens", () => {
    expect(slugify("  Acme Inc  ")).toBe("acme-inc");
  });

  // Bug: underscores survive (\w), but the slug validators only allow
  // lowercase letters, digits and hyphens.
  it.fails("only produces characters the slug validators accept", () => {
    expect(slugify("my_org")).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  });
});
