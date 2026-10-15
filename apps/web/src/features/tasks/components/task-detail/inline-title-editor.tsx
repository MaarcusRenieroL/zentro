"use client";

import { useEffect, useState } from "react";

import { Input } from "@zentro/ui/shadcn/input";

type Props = {
  value: string;
  disabled: boolean;
  onSave: (value: string) => void;
};

export function InlineTitleEditor({ value, disabled, onSave }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  function save() {
    const nextValue = draft.trim();

    if (!nextValue || nextValue === value) {
      setDraft(value);
      setIsEditing(false);
      return;
    }

    onSave(nextValue);
    setIsEditing(false);
  }

  if (!isEditing) {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsEditing(true)}
        className="block w-full rounded-md border border-transparent px-0 py-1 text-left font-display text-[1.75rem] leading-8 text-balance hover:border-hairline hover:bg-hover focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 sm:text-[2.25rem] sm:leading-10"
      >
        {value}
      </button>
    );
  }

  return (
    <Input
      value={draft}
      disabled={disabled}
      autoFocus
      onChange={(event) => setDraft(event.target.value)}
      onBlur={save}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.currentTarget.blur();
        }

        if (event.key === "Escape") {
          setDraft(value);
          setIsEditing(false);
          event.currentTarget.blur();
        }
      }}
      className="h-auto border-transparent bg-transparent px-0 py-1 font-display text-[1.75rem] shadow-none focus-visible:border-transparent focus-visible:ring-0 sm:text-[2.25rem]"
    />
  );
}
