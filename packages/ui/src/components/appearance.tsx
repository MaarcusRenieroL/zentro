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
