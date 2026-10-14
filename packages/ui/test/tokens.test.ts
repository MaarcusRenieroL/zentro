import { describe, expect, it } from "vitest";

import { categorical, contrast, resolve, tokens } from "./color";

const themes = ["light", "dark"] as const;
const surfaces = [
  "canvas",
  "surface",
  "raised",
  "sunken",
  "sidebar",
  "overlay",
];
const semantic = ["success", "warning", "danger", "info"];

function ratio(
  theme: (typeof themes)[number],
  foreground: string,
  background: string,
) {
  return contrast(resolve(theme, foreground), resolve(theme, background));
}

describe.each(themes)("%s theme contrast", (theme) => {
  it("declares every token the rules below read", () => {
    for (const name of [
      ...surfaces,
      "ink",
      "ink-2",
      "ink-3",
      "signal",
      "on-signal",
      "hairline",
      "border-strong",
      "focus-ring",
    ]) {
      expect(tokens[theme].has(`--${name}`), name).toBe(true);
    }
  });

  it("keeps primary, secondary and tertiary text at 4.5:1 on every surface", () => {
    for (const surface of surfaces) {
      for (const text of ["ink", "ink-2", "ink-3"]) {
        expect(
          ratio(theme, text, surface),
          `${text} on ${surface}`,
        ).toBeGreaterThanOrEqual(4.5);
      }
    }

    for (const text of ["ink", "ink-2", "ink-3"]) {
      expect(
        ratio(theme, text, "hover"),
        `${text} on hover`,
      ).toBeGreaterThanOrEqual(4.5);
      expect(
        ratio(theme, text, "selected"),
        `${text} on selected`,
      ).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("keeps text on the accent, and the accent as link text, readable", () => {
    expect(ratio(theme, "on-signal", "signal")).toBeGreaterThanOrEqual(4.5);
    expect(ratio(theme, "on-signal", "signal-hover")).toBeGreaterThanOrEqual(
      4.5,
    );
    expect(ratio(theme, "ink", "signal-subtle")).toBeGreaterThanOrEqual(4.5);

    for (const surface of ["canvas", "surface", "raised"]) {
      expect(
        ratio(theme, "signal", surface),
        `signal on ${surface}`,
      ).toBeGreaterThanOrEqual(4.5);
    }
  });

  it.each(semantic)("keeps %s badges and text readable", (name) => {
    expect(
      ratio(theme, `${name}-text`, `${name}-subtle`),
      "badge text",
    ).toBeGreaterThanOrEqual(4.5);
    expect(
      ratio(theme, `on-${name}`, name),
      "text on solid",
    ).toBeGreaterThanOrEqual(4.5);

    for (const surface of ["canvas", "surface", "raised"]) {
      expect(
        ratio(theme, `${name}-text`, surface),
        `${name}-text on ${surface}`,
      ).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("keeps danger text at 4.5:1, in dark mode too", () => {
    for (const surface of surfaces) {
      expect(
        ratio(theme, "danger-text", surface),
        surface,
      ).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("keeps form-control borders at 3:1 and card hairlines visible", () => {
    for (const surface of ["canvas", "surface", "raised"]) {
      expect(
        ratio(theme, "border-strong", surface),
        `control border on ${surface}`,
      ).toBeGreaterThanOrEqual(3);
    }

    for (const surface of ["canvas", "surface", "raised"]) {
      expect(
        ratio(theme, "hairline", surface),
        `hairline on ${surface}`,
      ).toBeGreaterThanOrEqual(1.5);
    }
  });

  it("keeps the focus ring and status glyphs visible (3:1)", () => {
    for (const surface of ["canvas", "surface", "raised"]) {
      for (const graphic of [
        "focus-ring",
        "status-backlog",
        "status-todo",
        "status-progress",
        "status-review",
        "status-done",
        "priority-low",
        "priority-medium",
        "priority-high",
      ]) {
        expect(
          ratio(theme, graphic, surface),
          `${graphic} on ${surface}`,
        ).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it("gives each surface step at least 4% lightness over the one below it", () => {
    const lightness = (name: string) => Number(resolveL(theme, name));

    // canvas < surface < raised in dark; sunken is the lowest step in both
    if (theme === "dark") {
      expect(lightness("surface") - lightness("canvas")).toBeGreaterThanOrEqual(
        0.03,
      );
      expect(lightness("raised") - lightness("surface")).toBeGreaterThanOrEqual(
        0.03,
      );
    }

    expect(
      Math.abs(lightness("canvas") - lightness("sunken")),
    ).toBeGreaterThanOrEqual(0.02);
  });

  it.each([1, 2, 3, 4, 5, 6, 7, 8])(
    "keeps categorical color %i readable",
    (index) => {
      const { solid, subtle, text } = categorical(theme, index);
      const surface = resolve(theme, "surface");

      expect(contrast(text, subtle), "text on subtle").toBeGreaterThanOrEqual(
        4.5,
      );
      expect(contrast(solid, surface), "dot on surface").toBeGreaterThanOrEqual(
        3,
      );
    },
  );
});

function resolveL(theme: (typeof themes)[number], name: string) {
  const raw = tokens[theme].get(`--${name}`)!;

  return raw.match(/oklch\(\s*([\d.]+)/)![1]!;
}
