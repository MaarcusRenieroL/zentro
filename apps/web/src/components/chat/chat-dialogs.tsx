"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { HashIcon, LockIcon } from "lucide-react";

import { useTrpcClient } from "@zentro/api/react";
import { toastError } from "@zentro/ui/index";
import { cn } from "@zentro/ui/lib/utils";
import { Button } from "@zentro/ui/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@zentro/ui/shadcn/dialog";
import { Input } from "@zentro/ui/shadcn/input";
import { Skeleton } from "@zentro/ui/shadcn/skeleton";

import { useChatSidebar } from "./chat-store";
import { usePeople } from "./channel-view";
import { LinkPicker, PeoplePicker } from "./pickers";

const toName = (value: string) =>
  value
    .toLowerCase()
    .replace(/^#/, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-{2,}/g, "-");

/** Name, who can see it, what it's linked to and who's in it. */
export function NewChannelDialog({
  onClose,
  defaultLink = null,
}: {
  onClose: () => void;
  defaultLink?: { type: "team" | "project"; id: string } | null;
}) {
  const trpc = useTrpcClient();
  const router = useRouter();
  const sidebar = useChatSidebar();
  const people = usePeople();
  const [name, setName] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [link, setLink] = useState(defaultLink);
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const clean = toName(name).replace(/^-|-$/g, "");

  const submit = async () => {
    if (clean.length < 2) {
      setError("Use at least 2 letters or numbers.");

      return;
    }

    setSaving(true);
    setError(null);

    try {
      const channel = await trpc.chat.create.mutate({
        name: clean,
        visibility,
        link,
        memberIds,
      });

      await sidebar.refresh();
      onClose();
      router.push(`/chat/${channel.name}`);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not create it.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-h-[90svh] gap-5 overflow-y-auto sm:max-w-[600px]"
        onKeyDown={(event) => {
          if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
            void submit();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-xl">New channel</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="channel-name" className="text-sm font-medium">
            Name
          </label>
          <div
            className={cn(
              "flex items-center gap-2 rounded-lg border bg-surface px-3 focus-within:ring-2 focus-within:ring-ring",
              error ? "border-danger" : "border-input",
            )}
          >
            <HashIcon className="size-4 text-ink-3" aria-hidden="true" />
            <Input
              id="channel-name"
              autoFocus
              value={name}
              maxLength={80}
              aria-invalid={Boolean(error) || undefined}
              onChange={(event) => {
                setName(toName(event.target.value));
                setError(null);
              }}
              placeholder="checkout-qa"
              className="h-10 border-0 px-0 shadow-none focus-visible:ring-0"
            />
            <span className="font-mono text-[11px] text-ink-3">
              {name.length}/80
            </span>
          </div>
          {error ? (
            <p role="alert" className="text-[13px] text-danger-text">
              {error}
            </p>
          ) : (
            <p className="text-[13px] text-ink-3">
              Lowercase, numbers and dashes.
            </p>
          )}
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium">Who can see it</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {(
              [
                [
                  "public",
                  "Public",
                  "Anyone at the organization can find and join it.",
                ],
                [
                  "private",
                  "Private",
                  "Only invited people can see it or read messages.",
                ],
              ] as const
            ).map(([value, label, hint]) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={visibility === value}
                onClick={() => setVisibility(value)}
                className={cn(
                  "flex flex-col gap-1 rounded-lg border p-3 text-left",
                  visibility === value
                    ? "border-ink ring-1 ring-ink"
                    : "border-hairline hover:border-ink-3",
                )}
              >
                <span className="flex items-center gap-2 text-sm font-medium">
                  <span
                    className={cn(
                      "size-4 rounded-full border",
                      visibility === value
                        ? "border-[5px] border-ink"
                        : "border-line-strong",
                    )}
                  />
                  {value === "private" ? (
                    <LockIcon className="size-3.5" aria-hidden="true" />
                  ) : (
                    <HashIcon className="size-3.5" aria-hidden="true" />
                  )}
                  {label}
                </span>
                <span className="pl-6 text-[13px] text-ink-2">{hint}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Link to</span>
          <LinkPicker value={link} onChange={setLink} />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Members</span>
          <PeoplePicker
            people={people}
            selected={memberIds}
            onChange={setMemberIds}
          />
        </div>

        <DialogFooter className="items-center sm:justify-between">
          <span className="text-[13px] text-ink-3">
            You’ll be the channel admin.
          </span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button loading={saving} onClick={() => void submit()}>
              Create channel
              <kbd className="ml-1 rounded-xs bg-on-signal/20 px-1 font-mono text-[10px]">
                ⌘↵
              </kbd>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Pick people to message; reuses an existing conversation with them. */
export function NewDmDialog({ onClose }: { onClose: () => void }) {
  const trpc = useTrpcClient();
  const router = useRouter();
  const sidebar = useChatSidebar();
  const people = usePeople();
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const open = async () => {
    setSaving(true);

    try {
      const dm = await trpc.chat.openDm.mutate({ memberIds: selected });

      await sidebar.refresh();
      onClose();
      router.push(`/chat/dm/${dm.id}`);
    } catch (error) {
      toastError(error, "Could not start that conversation");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="gap-5 sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-xl">New message</DialogTitle>
        </DialogHeader>
        <PeoplePicker
          people={people}
          selected={selected}
          onChange={setSelected}
          placeholder="Find people…"
        />
        <p className="text-[13px] text-ink-3">
          Pick one person for a direct message, or several for a group.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!selected.length}
            loading={saving}
            onClick={() => void open()}
          >
            Open conversation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Public channels you aren't in yet. */
export function BrowseChannelsDialog({ onClose }: { onClose: () => void }) {
  const trpc = useTrpcClient();
  const router = useRouter();
  const sidebar = useChatSidebar();
  const [rows, setRows] = useState<Awaited<
    ReturnType<typeof trpc.chat.browse.query>
  > | null>(null);
  const [joining, setJoining] = useState<string | null>(null);

  useEffect(() => {
    void trpc.chat.browse.query().then(setRows);
  }, [trpc]);

  const join = async (id: string, name: string) => {
    setJoining(id);

    try {
      await trpc.chat.join.mutate({ channelId: id });
      await sidebar.refresh();
      onClose();
      router.push(`/chat/${name}`);
    } catch (error) {
      toastError(error, "Could not join");
    } finally {
      setJoining(null);
    }
  };

  return (
    <Dialog open onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="gap-4 sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Browse channels</DialogTitle>
        </DialogHeader>
        {rows === null ? (
          <Skeleton className="h-24" />
        ) : rows.length === 0 ? (
          <p className="py-6 text-center text-[15px] text-ink-2">
            You’re in every public channel.
          </p>
        ) : (
          <ul className="flex max-h-96 flex-col overflow-y-auto">
            {rows.map((row) => (
              <li
                key={row.id}
                className="flex items-center gap-3 border-b border-hairline/60 py-2.5"
              >
                <HashIcon className="size-4 text-ink-3" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-medium">{row.name}</p>
                  <p className="truncate text-[13px] text-ink-2">
                    {row.topic || "No topic yet"} · {row.members}{" "}
                    {row.members === 1 ? "member" : "members"}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  loading={joining === row.id}
                  onClick={() => void join(row.id, row.name)}
                >
                  Join
                </Button>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
