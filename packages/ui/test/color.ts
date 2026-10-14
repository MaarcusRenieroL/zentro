import { readFileSync } from "node:fs";
import path from "node:path";

const css = readFileSync(
  path.resolve(process.cwd(), "src/styles/globals.css"),
  "utf8",
);

type Theme = "light" | "dark";

function block(selector: RegExp) {
  const start = css.search(selector);
  const open = css.indexOf("{", start);
  let depth = 0;

  for (let index = open; index < css.length; index += 1) {
    if (css[index] === "{") depth += 1;
    if (css[index] === "}") depth -= 1;
    if (depth === 0) return css.slice(open + 1, index);
  }

  return "";
}

function declarations(source: string) {
  const map = new Map<string, string>();

  for (const match of source.matchAll(/(--[a-z0-9-]+):\s*([^;]+);/g)) {
    map.set(match[1]!, match[2]!.trim());
  }

  return map;
}

// The first :root block holds the light values, `.dark` overrides them.
const rootBlocks = [...css.matchAll(/(^|\n):root\s*\{/g)].map((match) => {
  const start = match.index! + match[0].length - 1;
  let depth = 0;

  for (let index = start; index < css.length; index += 1) {
    if (css[index] === "{") depth += 1;
    if (css[index] === "}") depth -= 1;
    if (depth === 0) return css.slice(start + 1, index);
  }

  return "";
});

export const tokens: Record<Theme, Map<string, string>> = {
  light: new Map(rootBlocks.flatMap((source) => [...declarations(source)])),
  dark: new Map([
    ...rootBlocks.flatMap((source) => [...declarations(source)]),
    ...declarations(block(/\n\.dark\s*\{/)),
  ]),
};

export type Rgb = [number, number, number];

function oklchToLinear(l: number, c: number, h: number): Rgb {
  const a = c * Math.cos((h * Math.PI) / 180);
  const b = c * Math.sin((h * Math.PI) / 180);
  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.291485548 * b;
  const [L, M, S] = [l_ ** 3, m_ ** 3, s_ ** 3];
  const rgb: Rgb = [
    4.0767416621 * L - 3.3077115913 * M + 0.2309699292 * S,
    -1.2684380046 * L + 2.6097574011 * M - 0.3413193965 * S,
    -0.0041960863 * L - 0.7034186147 * M + 1.707614701 * S,
  ];

  return rgb.map((value) => Math.min(1, Math.max(0, value))) as Rgb;
}

/** Resolves a token to linear RGB, following var() aliases and the categorical hue formula. */
export function resolve(
  theme: Theme,
  name: string,
  extra: Record<string, string> = {},
): Rgb {
  const read = (key: string): string => {
    const value = extra[key] ?? tokens[theme].get(key);

    if (value === undefined) throw new Error(`Unknown token ${key}`);

    return value;
  };
  const expand = (value: string): string =>
    value.replace(/var\((--[a-z0-9-]+)\)/g, (_, key: string) =>
      expand(read(key)),
    );
  const value = expand(read(name.startsWith("--") ? name : `--${name}`));
  const hex = value.match(/^#([0-9a-f]{6})$/i);

  if (hex) return hexToLinear(hex[1]!);

  const match = value.match(/oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)/);

  if (!match) throw new Error(`Cannot parse ${name}: ${value}`);

  return oklchToLinear(Number(match[1]), Number(match[2]), Number(match[3]));
}

function hexToLinear(hex: string): Rgb {
  const channel = (index: number) => {
    const value = parseInt(hex.slice(index, index + 2), 16) / 255;

    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };

  return [channel(0), channel(2), channel(4)];
}

/** OKLab lightness of a token, for hex and oklch values alike. */
export function lightnessOf(theme: Theme, name: string, extra = {}) {
  const [r, g, b] = resolve(theme, name, extra);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

  return 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
}

const luminance = ([r, g, b]: Rgb) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

export function contrast(a: Rgb, b: Rgb) {
  const [x, y] = [luminance(a), luminance(b)];

  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

export function categorical(theme: Theme, index: number) {
  const hue = tokens[theme].get(`--cat-${index}-h`)!;
  const get = (key: string) => tokens[theme].get(key)!;
  const color = (l: string, c: string): Rgb =>
    oklchToLinear(Number(get(l)), Number(get(c)), Number(hue));

  return {
    solid: color("--cat-l", "--cat-c"),
    subtle: color("--cat-subtle-l", "--cat-subtle-c"),
    text: color("--cat-text-l", "--cat-text-c"),
  };
}
