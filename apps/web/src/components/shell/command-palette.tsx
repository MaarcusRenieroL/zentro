"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Command } from "cmdk";
import { MonitorIcon, MoonIcon, PlusIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";

import { applyDensity } from "@zentro/ui/components/appearance";
import { Kbd } from "@zentro/ui/components/kbd";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@zentro/ui/shadcn/dialog";

import { getModuleIcon } from "~/src/lib/module-icons";

import type { ShellModule } from "./app-sidebar";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  modules: ShellModule[];
  actions: Array<{ id: string; label: string; run: () => void }>;
};

const itemClass =
  "flex h-10 cursor-pointer items-center gap-3 rounded-md px-3 text-sm text-ink-2 data-[selected=true]:bg-hover data-[selected=true]:text-ink [&_svg]:size-4 [&_svg]:text-ink-3";

/** Jump anywhere, create something, or flip the theme, from the keyboard. */
export function CommandPalette({
  open,
  onOpenChange,
  modules,
  actions,
}: Props) {
  const router = useRouter();
  const { setTheme } = useTheme();
  const [, setTick] = useState(0);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        onOpenChange(!open);
      }
    };

    window.addEventListener("keydown", onKey);

    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  const done = (run: () => void) => {
    onOpenChange(false);
    run();
    setTick((value) => value + 1);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="top-[18%] max-w-xl translate-y-0 gap-0 overflow-hidden p-0"
      >
        <DialogTitle className="sr-only">Command palette</DialogTitle>
        <DialogDescription className="sr-only">
          Search for a place to go or something to create.
        </DialogDescription>
        <Command label="Command palette" loop>
          <Command.Input
            autoFocus
            placeholder="Go to, create, or switch theme"
            className="h-14 w-full border-b border-hairline bg-transparent px-4 text-base outline-none placeholder:text-ink-3"
          />
          <Command.List className="max-h-80 overflow-y-auto p-2">
            <Command.Empty className="px-3 py-6 text-center text-sm text-ink-2">
              Nothing matches that.
            </Command.Empty>
            <Command.Group
              heading="Go to"
              className="[&_[cmdk-group-heading]]:eyebrow [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2"
            >
              {modules.map((item) => {
                const Icon = getModuleIcon(item.icon);

                return (
                  <Command.Item
                    key={item.id}
                    value={`go ${item.label}`}
                    onSelect={() => done(() => router.push(item.href))}
                    className={itemClass}
                  >
                    <Icon aria-hidden="true" />
                    {item.label}
                  </Command.Item>
                );
              })}
            </Command.Group>
            {actions.length ? (
              <Command.Group
                heading="Create"
                className="[&_[cmdk-group-heading]]:eyebrow [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2"
              >
                {actions.map((action) => (
                  <Command.Item
                    key={action.id}
                    value={`create ${action.label}`}
                    onSelect={() => done(action.run)}
                    className={itemClass}
                  >
                    <PlusIcon aria-hidden="true" />
                    {action.label}
                  </Command.Item>
                ))}
              </Command.Group>
            ) : null}
            <Command.Group
              heading="Appearance"
              className="[&_[cmdk-group-heading]]:eyebrow [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2"
            >
              <Command.Item
                value="theme light"
                onSelect={() => done(() => setTheme("light"))}
                className={itemClass}
              >
                <SunIcon aria-hidden="true" /> Light theme
              </Command.Item>
              <Command.Item
                value="theme dark"
                onSelect={() => done(() => setTheme("dark"))}
                className={itemClass}
              >
                <MoonIcon aria-hidden="true" /> Dark theme
              </Command.Item>
              <Command.Item
                value="theme system"
                onSelect={() => done(() => setTheme("system"))}
                className={itemClass}
              >
                <MonitorIcon aria-hidden="true" /> Match system
              </Command.Item>
              <Command.Item
                value="density compact"
                onSelect={() => done(() => applyDensity("compact"))}
                className={itemClass}
              >
                Compact density
              </Command.Item>
              <Command.Item
                value="density comfortable"
                onSelect={() => done(() => applyDensity("comfortable"))}
                className={itemClass}
              >
                Comfortable density
              </Command.Item>
            </Command.Group>
          </Command.List>
          <div className="flex items-center gap-3 border-t border-hairline px-4 py-2.5 text-xs text-ink-3">
            <Kbd>↑↓</Kbd> move <Kbd>↵</Kbd> choose <Kbd>esc</Kbd> close
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
