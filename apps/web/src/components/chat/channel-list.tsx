"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  AtSignIcon,
  BellOffIcon,
  BookmarkIcon,
  ChevronDownIcon,
  FileEditIcon,
  HashIcon,
  LockIcon,
  MessageSquareIcon,
  NewspaperIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  SmileIcon,
} from "lucide-react";

import { cn } from "@zentro/ui/lib/utils";
import { Button } from "@zentro/ui/shadcn/button";
import { Skeleton } from "@zentro/ui/shadcn/skeleton";

import { StatusDialog } from "./chat-dialogs-extra";
import { useChatSidebar, type SidebarChannel } from "./chat-store";
import { Avatar } from "./message-item";

export function channelHref(
  channel: Pick<SidebarChannel, "kind" | "id" | "name">,
) {
  return channel.kind === "dm"
    ? `/chat/dm/${channel.id}`
    : `/chat/${channel.name}`;
}

function Count({ value, strong }: { value: number; strong: boolean }) {
  if (!value) return null;

  return (
    <span
      className={cn(
        "ml-auto shrink-0 rounded-full px-1.5 font-mono text-[11px] leading-[18px]",
        strong ? "bg-ink text-ink-inverse" : "bg-sunken text-ink-2",
      )}
    >
      {value}
    </span>
  );
}

function Group({
  label,
  action,
  children,
}: {
  label: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(true);

  return (
    <section aria-label={label} className="flex flex-col gap-0.5">
      <div className="flex items-center gap-1 px-2 pt-3 pb-1">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className="eyebrow flex flex-1 items-center gap-1 rounded-xs text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ChevronDownIcon
            className={cn("size-3 transition-transform", !open && "-rotate-90")}
            aria-hidden="true"
          />
          {label}
        </button>
        {action}
      </div>
      {open ? children : null}
    </section>
  );
}

const row =
  "flex h-8 items-center gap-2 rounded-md px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

function ChannelRow({
  channel,
  active,
}: {
  channel: SidebarChannel;
  active: boolean;
}) {
  const unread = channel.unread > 0 && !channel.muted;
  const dm = channel.kind === "dm";
  const person = channel.people[0];

  return (
    <Link
      href={channelHref(channel)}
      aria-current={active ? "page" : undefined}
      className={cn(
        row,
        active
          ? "bg-selected font-medium text-ink"
          : unread
            ? "font-semibold text-ink hover:bg-hover"
            : "text-ink-2 hover:bg-hover hover:text-ink",
        channel.archived && "opacity-60",
      )}
    >
      {dm ? (
        channel.people.length === 1 && person ? (
          <Avatar name={person.name} presence={person.presence} size={20} />
        ) : (
          <span className="flex size-5 shrink-0 items-center justify-center rounded-sm bg-sunken font-mono text-[10px]">
            {channel.people.length + 1}
          </span>
        )
      ) : channel.visibility === "private" ? (
        <LockIcon className="size-3.5 shrink-0 text-ink-3" aria-hidden="true" />
      ) : (
        <HashIcon className="size-3.5 shrink-0 text-ink-3" aria-hidden="true" />
      )}
      <span className="min-w-0 flex-1 truncate">{channel.title}</span>
      {channel.link?.key ? (
        <span className="font-mono text-[10px] text-ink-3">
          {channel.link.key}
        </span>
      ) : null}
      <Count
        value={channel.mentions || (unread ? channel.unread : 0)}
        strong={channel.mentions > 0}
      />
    </Link>
  );
}

/** The left column of Chat: places to go, then the person's conversations. */
export function ChannelList({
  onNewChannel,
  onNewDm,
  onBrowse,
}: {
  onNewChannel: () => void;
  onNewDm: () => void;
  onBrowse: () => void;
}) {
  const pathname = usePathname();
  const { data, error, refresh } = useChatSidebar();
  const [statusOpen, setStatusOpen] = useState(false);
  const extras = data?.extras;
  const channels = data?.channels ?? [];
  const live = channels.filter((channel) => !channel.archived);
  const pinned = live.filter((channel) => channel.pinned);
  const rest = live.filter((channel) => !channel.pinned);
  const discussion = rest.filter(
    (channel) =>
      channel.kind === "channel" &&
      (channel.link?.type === "task" || channel.link?.type === "doc"),
  );
  const team = rest.filter(
    (channel) =>
      channel.kind === "channel" &&
      channel.link?.type !== "project" &&
      channel.link?.type !== "task" &&
      channel.link?.type !== "doc",
  );
  const project = rest.filter(
    (channel) => channel.kind === "channel" && channel.link?.type === "project",
  );
  const dms = rest.filter((channel) => channel.kind === "dm");
  const archived = channels.filter((channel) => channel.archived);
  const mentionTotal = channels.reduce(
    (total, channel) => total + (channel.muted ? 0 : channel.mentions),
    0,
  );
  const isActive = (channel: SidebarChannel) =>
    pathname === channelHref(channel);

  const plus = (label: string, onClick: () => void) => (
    <Button
      variant="ghost"
      size="icon-sm"
      className="size-6"
      aria-label={label}
      onClick={onClick}
    >
      <PlusIcon className="size-3.5" />
    </Button>
  );

  return (
    <nav aria-label="Conversations" className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-1 px-3 pt-3 pb-2">
        <h1 className="font-display flex-1 text-[22px] leading-7">Chat</h1>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={
            data?.dnd ? "Status: do not disturb is on" : "Set your status"
          }
          title="Status and do not disturb"
          onClick={() => setStatusOpen(true)}
        >
          {data?.dnd ? (
            <BellOffIcon className="size-4 text-danger-text" />
          ) : (
            <SmileIcon className="size-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="New direct message"
          onClick={onNewDm}
        >
          <PencilIcon className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="New channel"
          onClick={onNewChannel}
        >
          <PlusIcon className="size-4" />
        </Button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-2 pb-4">
        {(
          [
            [
              "/chat/threads",
              MessageSquareIcon,
              "Threads",
              extras?.threadsUnread ?? 0,
              true,
            ],
            ["/chat/mentions", AtSignIcon, "Mentions", mentionTotal, true],
            [
              "/chat/saved",
              BookmarkIcon,
              "Saved",
              extras?.dueReminders ?? 0,
              true,
            ],
            [
              "/chat/drafts",
              FileEditIcon,
              "Drafts & scheduled",
              (extras?.drafts ?? 0) + (extras?.scheduled ?? 0),
              false,
            ],
            ["/chat/catch-up", NewspaperIcon, "Catch up", 0, false],
          ] as const
        ).map(([href, Icon, label, count, strong]) => (
          <Link
            key={href}
            href={href}
            aria-current={pathname === href ? "page" : undefined}
            className={cn(
              row,
              pathname === href
                ? "bg-selected font-medium"
                : "text-ink-2 hover:bg-hover hover:text-ink",
            )}
          >
            <Icon className="size-4 shrink-0" aria-hidden="true" />
            {label}
            <Count value={count} strong={strong} />
          </Link>
        ))}
        <Link
          href="/chat/search"
          aria-current={pathname === "/chat/search" ? "page" : undefined}
          className={cn(
            row,
            pathname === "/chat/search"
              ? "bg-selected font-medium"
              : "text-ink-2 hover:bg-hover hover:text-ink",
          )}
        >
          <SearchIcon className="size-4 shrink-0" aria-hidden="true" />
          Search messages
          <span className="ml-auto font-mono text-[10px] text-ink-3">⌘⇧F</span>
        </Link>

        {!data && !error ? (
          <div className="flex flex-col gap-2 px-2 pt-5" aria-busy="true">
            {[60, 44, 52, 38, 56].map((width) => (
              <Skeleton
                key={width}
                className="h-4"
                style={{ width: `${width}%` }}
              />
            ))}
          </div>
        ) : null}

        {error && !data ? (
          <div className="px-2 pt-5 text-[13px] text-ink-2">
            Couldn’t load your conversations.{" "}
            <button
              type="button"
              onClick={() => void refresh()}
              className="text-signal-strong underline underline-offset-2"
            >
              Try again
            </button>
          </div>
        ) : null}

        {pinned.length ? (
          <Group label="Pinned">
            {pinned.map((channel) => (
              <ChannelRow
                key={channel.id}
                channel={channel}
                active={isActive(channel)}
              />
            ))}
          </Group>
        ) : null}

        {data ? (
          <>
            <Group
              label="Team channels"
              action={plus("New channel", onNewChannel)}
            >
              {team.map((channel) => (
                <ChannelRow
                  key={channel.id}
                  channel={channel}
                  active={isActive(channel)}
                />
              ))}
              <button
                type="button"
                onClick={onBrowse}
                className={cn(row, "text-ink-3 hover:bg-hover hover:text-ink")}
              >
                <SearchIcon className="size-3.5" aria-hidden="true" />
                Browse channels
              </button>
            </Group>

            {project.length ? (
              <Group
                label="Project channels"
                action={plus("New channel", onNewChannel)}
              >
                {project.map((channel) => (
                  <ChannelRow
                    key={channel.id}
                    channel={channel}
                    active={isActive(channel)}
                  />
                ))}
              </Group>
            ) : null}

            {discussion.length ? (
              <Group label="Discussions">
                {discussion.map((channel) => (
                  <ChannelRow
                    key={channel.id}
                    channel={channel}
                    active={isActive(channel)}
                  />
                ))}
              </Group>
            ) : null}

            <Group
              label="Direct messages"
              action={plus("New direct message", onNewDm)}
            >
              {dms.length ? (
                dms.map((channel) => (
                  <ChannelRow
                    key={channel.id}
                    channel={channel}
                    active={isActive(channel)}
                  />
                ))
              ) : (
                <p className="px-2 py-1 text-[13px] text-ink-3">
                  Message someone directly.
                </p>
              )}
            </Group>

            {archived.length ? (
              <Group label="Archived">
                {archived.map((channel) => (
                  <ChannelRow
                    key={channel.id}
                    channel={channel}
                    active={isActive(channel)}
                  />
                ))}
              </Group>
            ) : null}
          </>
        ) : null}
      </div>
      {statusOpen ? (
        <StatusDialog onClose={() => setStatusOpen(false)} />
      ) : null}
    </nav>
  );
}
