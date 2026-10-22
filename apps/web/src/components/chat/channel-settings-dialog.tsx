"use client";

import { useEffect, useState } from "react";
import {
  ArchiveIcon,
  DownloadIcon,
  HashIcon,
  LockIcon,
  PlusIcon,
  SearchIcon,
} from "lucide-react";

import { useTrpcClient } from "@zentro/api/react";
import { toastError, toastSuccess } from "@zentro/ui/index";
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
import { Textarea } from "@zentro/ui/shadcn/textarea";

import type { ChannelData } from "./channel-view";
import type { Person } from "./composer";
import { LinkPicker, PeoplePicker } from "./pickers";
import { Avatar } from "./message-item";

type Tab = "about" | "members" | "notifications" | "data" | "archive";

const feedEvents = [
  ["created", "A task is created"],
  ["done", "A task is marked done"],
  ["assigned", "A task is assigned"],
  ["overdue", "A task becomes overdue"],
] as const;

/** Name, people, your notifications and archive for one channel. */
export function ChannelSettingsDialog({
  channel,
  people,
  onClose,
  onChanged,
}: {
  channel: ChannelData;
  people: Person[];
  onClose: () => void;
  onChanged: () => void;
}) {
  const trpc = useTrpcClient();
  const [tab, setTab] = useState<Tab>("members");
  const [name, setName] = useState(channel.name);
  const [topic, setTopic] = useState(channel.topic ?? "");
  const [description, setDescription] = useState(channel.description ?? "");
  const [visibility, setVisibility] = useState(channel.visibility);
  // Task and doc discussions stay tied to what they discuss; only teams and
  // projects can be changed here.
  const fixedLink =
    channel.link?.type === "task" || channel.link?.type === "doc";
  const [link, setLink] = useState<{
    type: "team" | "project";
    id: string;
  } | null>(
    channel.link && !fixedLink
      ? { type: channel.link.type as "team" | "project", id: channel.link.id }
      : null,
  );
  const [feed, setFeed] = useState<{
    enabled: boolean;
    events: string[];
  } | null>(null);
  const [find, setFind] = useState("");
  const [adding, setAdding] = useState(false);
  const [toAdd, setToAdd] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const canManage = channel.canManage;
  const memberIds = new Set(channel.people.map((person) => person.memberId));
  const visible = channel.people.filter((person) =>
    person.name.toLowerCase().includes(find.trim().toLowerCase()),
  );
  const dirty =
    name !== channel.name ||
    topic !== (channel.topic ?? "") ||
    description !== (channel.description ?? "") ||
    visibility !== channel.visibility ||
    (!fixedLink && link?.id !== channel.link?.id);

  const call = async (action: () => Promise<unknown>, done?: string) => {
    setBusy(true);

    try {
      await action();
      if (done) toastSuccess(done);
      onChanged();
    } catch (error) {
      toastError(error, "That didn’t work");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (tab !== "data" || channel.link?.type !== "project") return;

    let live = true;

    trpc.chat.feedGet
      .query({ channelId: channel.id })
      .then((data) => live && setFeed(data))
      .catch(() => undefined);

    return () => {
      live = false;
    };
  }, [tab, trpc, channel.id, channel.link?.type]);

  const exportChannel = async () => {
    setBusy(true);

    try {
      const data = await trpc.chat.exportChannel.query({
        channelId: channel.id,
      });
      const text = data.messages
        .map(
          (message) =>
            `[${new Date(message.at).toISOString()}] ${message.inThread ? "  ↳ " : ""}${message.author}: ${message.text}`,
        )
        .join("\n");
      const url = URL.createObjectURL(
        new Blob([`# ${data.channel}\n\n${text}\n`], { type: "text/plain" }),
      );
      const anchor = document.createElement("a");

      anchor.href = url;
      anchor.download = `${data.channel}-${new Date().toISOString().slice(0, 10)}.txt`;
      anchor.click();
      URL.revokeObjectURL(url);
      toastSuccess(`Exported ${data.messages.length} messages`);
    } catch (error) {
      toastError(error, "Could not export the channel");
    } finally {
      setBusy(false);
    }
  };

  const tabs: Array<[Tab, string, number?]> = [
    ["about", "About"],
    ["members", "Members", channel.people.length],
    ["notifications", "Notifications"],
    ["data", "Activity & data"],
    ["archive", channel.archivedAt ? "Restore" : "Archive"],
  ];

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[min(720px,90svh)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[640px]">
        <DialogHeader className="flex-row items-center gap-3 px-6 pt-5">
          <span className="flex size-9 items-center justify-center rounded-md bg-tint-teams">
            {channel.visibility === "private" ? (
              <LockIcon className="size-4" aria-hidden="true" />
            ) : (
              <HashIcon className="size-4" aria-hidden="true" />
            )}
          </span>
          <DialogTitle className="text-lg">{channel.name} settings</DialogTitle>
        </DialogHeader>

        <div
          role="tablist"
          aria-label="Channel settings"
          className="flex gap-5 border-b border-hairline px-6 pt-3 text-[15px]"
        >
          {tabs.map(([value, label, count]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={tab === value}
              onClick={() => setTab(value)}
              className={cn(
                "-mb-px border-b-2 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-ring",
                tab === value
                  ? "border-ink font-medium"
                  : "border-transparent text-ink-2 hover:text-ink",
              )}
            >
              {label}
              {count !== undefined ? (
                <span className="ml-1.5 font-mono text-xs text-ink-3">
                  {count}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {tab === "about" ? (
            <div className="flex flex-col gap-4">
              <label className="flex flex-col gap-1.5 text-sm font-medium">
                Name
                <Input
                  value={name}
                  disabled={!canManage}
                  onChange={(event) => setName(event.target.value)}
                  maxLength={80}
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-medium">
                Topic
                <Input
                  value={topic}
                  disabled={!canManage}
                  onChange={(event) => setTopic(event.target.value)}
                  maxLength={250}
                  placeholder="What’s this channel for?"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-medium">
                Description
                <Textarea
                  value={description}
                  disabled={!canManage}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={3}
                  maxLength={2000}
                />
              </label>
              <fieldset className="flex flex-col gap-2" disabled={!canManage}>
                <legend className="mb-1 text-sm font-medium">
                  Who can see it
                </legend>
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
                          ? "border-ink"
                          : "border-hairline hover:border-ink-3",
                      )}
                    >
                      <span className="flex items-center gap-1.5 text-sm font-medium">
                        {value === "private" ? (
                          <LockIcon className="size-3.5" aria-hidden="true" />
                        ) : (
                          <HashIcon className="size-3.5" aria-hidden="true" />
                        )}
                        {label}
                      </span>
                      <span className="text-[13px] text-ink-2">{hint}</span>
                    </button>
                  ))}
                </div>
              </fieldset>
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium">Link to</span>
                {fixedLink && channel.link ? (
                  <p className="rounded-md border border-hairline px-3 py-2 text-sm text-ink-2">
                    Discussion of{" "}
                    <a
                      href={channel.link.href}
                      className="font-medium text-signal-strong hover:underline"
                    >
                      {channel.link.key ? `${channel.link.key} · ` : ""}
                      {channel.link.name}
                    </a>
                    . It follows that {channel.link.type}.
                  </p>
                ) : (
                  <LinkPicker
                    value={link}
                    onChange={setLink}
                    disabled={!canManage}
                  />
                )}
              </div>
              {!canManage ? (
                <p className="text-[13px] text-ink-3">
                  Only channel admins can change these.
                </p>
              ) : null}
            </div>
          ) : null}

          {tab === "members" ? (
            <div className="flex flex-col gap-3">
              <div className="flex gap-2">
                <label className="relative flex-1">
                  <span className="sr-only">Find a member</span>
                  <SearchIcon
                    aria-hidden="true"
                    className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-3"
                  />
                  <Input
                    value={find}
                    onChange={(event) => setFind(event.target.value)}
                    placeholder="Find a member"
                    className="pl-9"
                  />
                </label>
                {canManage || channel.visibility === "public" ? (
                  <Button
                    variant="outline"
                    onClick={() => setAdding((value) => !value)}
                  >
                    <PlusIcon />
                    Add people
                  </Button>
                ) : null}
              </div>

              {adding ? (
                <div className="flex flex-col gap-2 rounded-lg border border-hairline p-3">
                  <PeoplePicker
                    people={people.filter(
                      (person) => !memberIds.has(person.memberId),
                    )}
                    selected={toAdd}
                    onChange={setToAdd}
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setAdding(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      disabled={!toAdd.length || busy}
                      onClick={() =>
                        void call(async () => {
                          await trpc.chat.addMembers.mutate({
                            channelId: channel.id,
                            memberIds: toAdd,
                          });
                          setToAdd([]);
                          setAdding(false);
                        }, "People added")
                      }
                    >
                      Add {toAdd.length || ""}
                    </Button>
                  </div>
                </div>
              ) : null}

              <ul className="flex flex-col">
                {visible.map((person) => {
                  const mine =
                    person.memberId === people.find((p) => p.isMe)?.memberId;

                  return (
                    <li
                      key={person.memberId}
                      className="flex items-center gap-3 border-b border-hairline/60 py-2.5"
                    >
                      <Avatar
                        name={person.name}
                        presence={person.presence}
                        size={30}
                      />
                      <span className="flex-1 text-[15px]">
                        {person.name}
                        {mine ? (
                          <span className="ml-1.5 text-xs text-ink-3">you</span>
                        ) : null}
                      </span>
                      {canManage ? (
                        <select
                          aria-label={`Role of ${person.name}`}
                          value={person.role}
                          disabled={busy}
                          onChange={(event) =>
                            void call(() =>
                              trpc.chat.setRole.mutate({
                                channelId: channel.id,
                                memberId: person.memberId,
                                role: event.target.value as "admin" | "member",
                              }),
                            )
                          }
                          className="rounded-md border border-hairline bg-surface px-2 py-1 text-sm"
                        >
                          <option value="admin">Channel admin</option>
                          <option value="member">Member</option>
                        </select>
                      ) : (
                        <span className="text-sm text-ink-2">
                          {person.role === "admin" ? "Channel admin" : "Member"}
                        </span>
                      )}
                      {canManage || mine ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={busy}
                          onClick={() =>
                            void call(
                              () =>
                                trpc.chat.removeMember.mutate({
                                  channelId: channel.id,
                                  memberId: person.memberId,
                                }),
                              mine ? "You left the channel" : "Removed",
                            )
                          }
                        >
                          {mine ? "Leave" : "Remove"}
                        </Button>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}

          {tab === "notifications" ? (
            <div className="flex flex-col gap-3">
              <p className="eyebrow">Your notifications</p>
              <div
                role="radiogroup"
                aria-label="Notify me about"
                className="flex w-fit gap-1 rounded-lg border border-hairline bg-sunken p-1"
              >
                {(
                  [
                    ["all", "All new messages"],
                    ["mentions", "Mentions only"],
                    ["mute", "Mute"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={channel.notify === value}
                    disabled={busy || !channel.joined}
                    onClick={() =>
                      void call(() =>
                        trpc.chat.setPreferences.mutate({
                          channelId: channel.id,
                          notify: value,
                        }),
                      )
                    }
                    className={cn(
                      "rounded-md px-3 py-1.5 text-sm",
                      channel.notify === value
                        ? "bg-surface font-medium shadow-sm"
                        : "text-ink-2 hover:text-ink",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className="text-[13px] text-ink-2">
                Mentions always reach you, even when a channel is muted: they
                land in Mentions.
              </p>
            </div>
          ) : null}

          {tab === "data" ? (
            <div className="flex flex-col gap-5">
              <section className="flex flex-col gap-2">
                <h3 className="font-semibold">Activity feed</h3>
                {channel.link?.type === "project" ? (
                  <>
                    <p className="text-[13px] text-ink-2">
                      Post what happens to {channel.link.name}’s tasks into this
                      channel.
                    </p>
                    <label className="flex items-center gap-2.5 text-sm">
                      <input
                        type="checkbox"
                        disabled={!canManage || busy || !feed}
                        checked={feed?.enabled ?? false}
                        onChange={(event) => {
                          const next = {
                            enabled: event.target.checked,
                            events: feed?.events.length
                              ? feed.events
                              : ["created", "done"],
                          };

                          setFeed(next);
                          void call(
                            () =>
                              trpc.chat.feedSet.mutate({
                                channelId: channel.id,
                                enabled: next.enabled,
                                events: next.events as Array<
                                  "created" | "done" | "assigned" | "overdue"
                                >,
                              }),
                            next.enabled
                              ? "Activity feed on"
                              : "Activity feed off",
                          );
                        }}
                        className="size-4 accent-[var(--signal)]"
                      />
                      Send task activity here
                    </label>
                    {feed?.enabled ? (
                      <div className="flex flex-col gap-1.5 pl-6">
                        {feedEvents.map(([event, label]) => (
                          <label
                            key={event}
                            className="flex items-center gap-2.5 text-sm"
                          >
                            <input
                              type="checkbox"
                              disabled={!canManage || busy}
                              checked={feed.events.includes(event)}
                              onChange={(change) => {
                                const events = change.target.checked
                                  ? [...feed.events, event]
                                  : feed.events.filter(
                                      (entry) => entry !== event,
                                    );

                                setFeed({ enabled: true, events });
                                void call(() =>
                                  trpc.chat.feedSet.mutate({
                                    channelId: channel.id,
                                    enabled: true,
                                    events: events as Array<
                                      | "created"
                                      | "done"
                                      | "assigned"
                                      | "overdue"
                                    >,
                                  }),
                                );
                              }}
                              className="size-4 accent-[var(--signal)]"
                            />
                            {label}
                          </label>
                        ))}
                      </div>
                    ) : null}
                  </>
                ) : (
                  <p className="text-[13px] text-ink-3">
                    Link this channel to a project to receive its task activity.
                  </p>
                )}
              </section>

              <section className="flex flex-col gap-2 border-t border-hairline pt-4">
                <h3 className="font-semibold">Keep messages for</h3>
                <p className="text-[13px] text-ink-2">
                  Older messages are deleted every night. Pinned messages are
                  always kept.
                </p>
                <select
                  aria-label="Retention"
                  disabled={!canManage || busy}
                  value={
                    channel.retentionDays ? String(channel.retentionDays) : ""
                  }
                  onChange={(event) =>
                    void call(
                      () =>
                        trpc.chat.setRetention.mutate({
                          channelId: channel.id,
                          days: event.target.value
                            ? Number(event.target.value)
                            : null,
                        }),
                      "Retention updated",
                    )
                  }
                  className="h-9 w-fit rounded-md border border-hairline bg-surface px-2 text-sm"
                >
                  <option value="">Forever</option>
                  <option value="30">30 days</option>
                  <option value="90">90 days</option>
                  <option value="365">1 year</option>
                </select>
                {!canManage ? (
                  <p className="text-[13px] text-ink-3">Channel admins only.</p>
                ) : null}
              </section>

              <section className="flex flex-col gap-2 border-t border-hairline pt-4">
                <h3 className="font-semibold">Export</h3>
                <p className="text-[13px] text-ink-2">
                  Download every message in this channel as a text file.
                </p>
                <Button
                  variant="outline"
                  className="w-fit"
                  disabled={!canManage || busy}
                  onClick={() => void exportChannel()}
                >
                  <DownloadIcon />
                  Export messages
                </Button>
              </section>
            </div>
          ) : null}

          {tab === "archive" ? (
            <div className="flex items-start gap-4 rounded-lg border border-hairline p-4">
              <div className="flex-1">
                <h3 className="font-semibold">
                  {channel.archivedAt ? "Restore" : "Archive"} #{channel.name}
                </h3>
                <p className="mt-1 text-[13px] text-ink-2">
                  {channel.archivedAt
                    ? "Opens the channel again so people can post."
                    : "Hides it from the list and makes it read-only. Messages, files and task links are kept."}
                </p>
              </div>
              {canManage ? (
                <Button
                  variant="outline"
                  className={
                    channel.archivedAt ? undefined : "text-danger-text"
                  }
                  disabled={busy}
                  onClick={() =>
                    void call(
                      () =>
                        trpc.chat.archive.mutate({
                          channelId: channel.id,
                          archived: !channel.archivedAt,
                        }),
                      channel.archivedAt
                        ? "Channel restored"
                        : "Channel archived",
                    )
                  }
                >
                  <ArchiveIcon />
                  {channel.archivedAt ? "Restore channel" : "Archive channel"}
                </Button>
              ) : (
                <span className="text-[13px] text-ink-3">
                  Channel admins only
                </span>
              )}
            </div>
          ) : null}
        </div>

        <DialogFooter className="items-center border-t border-hairline px-6 py-3 sm:justify-between">
          <span className="text-[13px] text-ink-3">
            {tab === "about" && dirty
              ? "You have unsaved changes."
              : "Changes save as you make them."}
          </span>
          <div className="flex gap-2">
            {tab === "about" && dirty ? (
              <Button
                disabled={busy || name.trim().length < 2}
                onClick={() =>
                  void call(
                    () =>
                      trpc.chat.update.mutate({
                        channelId: channel.id,
                        name,
                        topic: topic || null,
                        description: description || null,
                        visibility,
                        // Left out for task and doc discussions, so they keep it.
                        ...(fixedLink ? {} : { link }),
                      }),
                    "Saved",
                  )
                }
              >
                Save changes
              </Button>
            ) : null}
            <Button variant="outline" onClick={onClose}>
              Done
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
