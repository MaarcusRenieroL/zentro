// The browser chrome color (mobile address bar) for each color scheme. These
// are the canvas token converted to sRGB; this file is part of the token layer.
export const themeColors = {
  light: "#f9f6f2",
  dark: "#110f0d",
} as const;

export const densityCookie = "zentro-density";
export const densities = ["compact", "comfortable"] as const;
export type Density = (typeof densities)[number];

export function parseDensity(value: string | undefined | null): Density {
  return value === "comfortable" ? "comfortable" : "compact";
}
