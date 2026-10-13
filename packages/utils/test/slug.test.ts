import { describe, expect, it } from "vitest";

import { slugify, slugifyInput } from "../src";

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

  it("does not leave leading or trailing hyphens", () => {
    expect(slugify("  Acme Inc  ")).toBe("acme-inc");
    expect(slugify("--acme--")).toBe("acme");
  });

  it("turns underscores into hyphens", () => {
    expect(slugify("my_org")).toBe("my-org");
    expect(slugify("_a__b_")).toBe("a-b");
  });

  it("always produces something the slug validators accept", () => {
    for (const input of [
      "Acme Inc",
      "  spaced  out  ",
      "my_org",
      "A--B__C",
      "Ünï Cödé 42",
      "-leading",
      "trailing-",
    ]) {
      const slug = slugify(input);

      if (slug) {
        expect(slug, input).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      }
    }
  });
});

describe("slugifyInput", () => {
  it("keeps a trailing hyphen so typing can continue", () => {
    expect(slugifyInput("my-")).toBe("my-");
    expect(slugifyInput("my-o")).toBe("my-o");
    expect(slugifyInput("Acme ")).toBe("acme-");
  });

  it("never starts with a hyphen", () => {
    expect(slugifyInput("-a")).toBe("a");
    expect(slugifyInput("_a")).toBe("a");
  });

  it("collapses repeated separators and strips punctuation", () => {
    expect(slugifyInput("a__b  c--d!")).toBe("a-b-c-d");
  });
});
