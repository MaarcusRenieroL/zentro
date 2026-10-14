// The browser chrome color (mobile address bar) for each color scheme. These
// are the canvas token converted to sRGB; this file is part of the token layer.
export const themeColors = {
  light: "#f4f7fb",
  dark: "#0e1012",
} as const;

export const densityCookie = "zentro-density";
export const densities = ["compact", "comfortable"] as const;
export type Density = (typeof densities)[number];

export function parseDensity(value: string | undefined | null): Density {
  return value === "comfortable" ? "comfortable" : "compact";
}

// Brand colors for places that cannot read CSS variables (icons, social
// images). They are the signal color and its text color in sRGB.
export const brandColors = {
  accent: "#0056c5",
  onAccent: "#fafcfe",
  paper: themeColors.light,
  ink: "#171b20",
} as const;
