"use client";

import { useEffect, useState, type FC } from "react";
import { useTheme } from "next-themes";
import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";

import {
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@zentro/ui/shadcn/dropdown-menu";
import {
  densityCookie,
  parseDensity,
  type Density,
} from "@zentro/ui/lib/theme-colors";

/** Applies a density to the page and remembers it for the next request. */
export function applyDensity(density: Density) {
  document.documentElement.dataset.density = density;
  document.cookie = `${densityCookie}=${density}; path=/; max-age=31536000; samesite=lax`;
}

export function useDensity() {
  const [density, setDensity] = useState<Density>("comfortable");

  useEffect(() => {
    setDensity(parseDensity(document.documentElement.dataset.density));
  }, []);

  return [
    density,
    (next: Density) => {
      setDensity(next);
      applyDensity(next);
    },
  ] as const;
}

const themes = [
  { value: "light", label: "Light", icon: SunIcon },
  { value: "dark", label: "Dark", icon: MoonIcon },
  { value: "system", label: "System", icon: MonitorIcon },
] as const;

/** Theme choice as radio items for a dropdown menu. */
export const ThemeMenuItems: FC = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <>
      <DropdownMenuLabel className="text-xs font-normal text-ink-3">
        Theme
      </DropdownMenuLabel>
      <DropdownMenuRadioGroup
        value={mounted ? (theme ?? "system") : "system"}
        onValueChange={setTheme}
      >
        {themes.map(({ value, label, icon: Icon }) => (
          <DropdownMenuRadioItem key={value} value={value}>
            <Icon className="size-4" aria-hidden="true" />
            {label}
          </DropdownMenuRadioItem>
        ))}
      </DropdownMenuRadioGroup>
    </>
  );
};

/** Density choice as radio items for a dropdown menu. */
export const DensityMenuItems: FC = () => {
  const [density, setDensity] = useDensity();

  return (
    <>
      <DropdownMenuLabel className="text-xs font-normal text-ink-3">
        Density
      </DropdownMenuLabel>
      <DropdownMenuRadioGroup
        value={density}
        onValueChange={(value) => setDensity(parseDensity(value))}
      >
        <DropdownMenuRadioItem value="comfortable">
          Comfortable
        </DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="compact">Compact</DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
    </>
  );
};

const segmentGroup =
  "mx-2 mb-2 flex gap-0.5 rounded-md border border-hairline p-[3px]";
const segment =
  "h-7 flex-1 justify-center rounded-[9px] px-2 text-xs text-ink-2 focus:bg-hover focus:text-ink data-[state=checked]:bg-ink data-[state=checked]:text-ink-inverse [&>[data-slot=dropdown-menu-radio-item-indicator]]:hidden";

/** Theme choice as a segmented control inside a dropdown menu. */
export const ThemeSegments: FC = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <>
      <DropdownMenuLabel className="eyebrow px-2.5 pt-2 pb-1 text-[10px]">
        Theme
      </DropdownMenuLabel>
      <DropdownMenuRadioGroup
        value={mounted ? (theme ?? "system") : "system"}
        onValueChange={setTheme}
        className={segmentGroup}
      >
        {themes.map(({ value, label }) => (
          <DropdownMenuRadioItem
            key={value}
            value={value}
            // Switching stays in the menu, so the change can be compared.
            onSelect={(event) => event.preventDefault()}
            className={segment}
          >
            {label}
          </DropdownMenuRadioItem>
        ))}
      </DropdownMenuRadioGroup>
    </>
  );
};

/** Density choice as a segmented control inside a dropdown menu. */
export const DensitySegments: FC = () => {
  const [density, setDensity] = useDensity();

  return (
    <>
      <DropdownMenuLabel className="eyebrow px-2.5 pt-1 pb-1 text-[10px]">
        Density
      </DropdownMenuLabel>
      <DropdownMenuRadioGroup
        value={density}
        onValueChange={(value) => setDensity(parseDensity(value))}
        className={segmentGroup}
      >
        {(["comfortable", "compact"] as const).map((value) => (
          <DropdownMenuRadioItem
            key={value}
            value={value}
            onSelect={(event) => event.preventDefault()}
            className={segment}
          >
            {value === "comfortable" ? "Comfortable" : "Compact"}
          </DropdownMenuRadioItem>
        ))}
      </DropdownMenuRadioGroup>
    </>
  );
};
