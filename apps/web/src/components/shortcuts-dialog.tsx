"use client";

import { FC } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@zentro/ui/shadcn/dialog";
import { Kbd } from "@zentro/ui/components/kbd";
import { KeyboardIcon } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type ShortcutItem = {
  keys: string[];
  description: string;
};

type ShortcutGroup = {
  title: string;
  items: ShortcutItem[];
};

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: "Task Navigation & Focus",
    items: [
      { keys: ["J", "↓"], description: "Navigate to next task" },
      { keys: ["K", "↑"], description: "Navigate to previous task" },
      { keys: ["Enter", "O"], description: "Open focused task detail" },
      { keys: ["1"], description: "Switch to List view" },
      { keys: ["2"], description: "Switch to Board view" },
      { keys: ["3"], description: "Switch to Calendar view" },
    ],
  },
  {
    title: "Selection & Batch Actions",
    items: [
      { keys: ["X"], description: "Toggle select active task" },
      { keys: ["⇧", "A"], description: "Select all visible tasks" },
      { keys: ["Esc"], description: "Clear selection / close dialogs" },
    ],
  },
  {
    title: "God Mode Fast Actions",
    items: [
      {
        keys: ["S"],
        description: "Cycle status (Todo → In Progress → Review → Done)",
      },
      { keys: ["P"], description: "Cycle priority (Low → Medium → High)" },
      { keys: ["E"], description: "Cycle estimate points (1 → 2 → 3 → 5 → 8)" },
      { keys: ["C"], description: "Create new task" },
    ],
  },
  {
    title: "Global & Navigation",
    items: [
      { keys: ["⌘", "K"], description: "Open command palette" },
      { keys: ["G", "T"], description: "Go to Tasks" },
      { keys: ["G", "P"], description: "Go to Projects" },
      { keys: ["G", "D"], description: "Go to Docs" },
      { keys: ["G", "M"], description: "Go to Team members" },
      { keys: ["?"], description: "Show this shortcuts cheat sheet" },
    ],
  },
];

export const ShortcutsDialog: FC<Props> = ({ open, onOpenChange }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto rounded-2xl border border-hairline bg-surface p-6 shadow-2xl">
        <DialogHeader className="mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-surface-subtle border border-hairline text-ink">
              <KeyboardIcon className="size-4 text-signal" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-ink">
                Keyboard Shortcuts
              </DialogTitle>
              <p className="text-xs text-ink-3">
                Power user shortcuts to navigate and edit work instantly.
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.title} className="flex flex-col gap-2">
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">
                {group.title}
              </h4>
              <div className="flex flex-col gap-1.5 rounded-xl border border-hairline bg-surface-subtle/50 p-2.5">
                {group.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs py-1"
                  >
                    <span className="text-ink-2">{item.description}</span>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      {item.keys.map((k, kIdx) => (
                        <Kbd
                          key={kIdx}
                          className="text-[10px] min-w-5 justify-center"
                        >
                          {k}
                        </Kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
