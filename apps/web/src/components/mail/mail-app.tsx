"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArchiveRestoreIcon,
  ArrowLeftIcon,
  FileEditIcon,
  InboxIcon,
  MailOpenIcon,
  PenSquareIcon,
  ReplyAllIcon,
  ReplyIcon,
  SearchIcon,
  SendIcon,
  StarIcon,
  Trash2Icon,
  ForwardIcon,
} from "lucide-react";

import { useTrpcClient } from "@zentro/api/react";
import type { AppRouter } from "@zentro/api/server";
import type { inferRouterOutputs } from "@trpc/server";
import { Button } from "@zentro/ui/shadcn/button";
import { Input } from "@zentro/ui/shadcn/input";
import { toast, toastError } from "@zentro/ui/index";

import {
  ComposeDialog,
  type ComposeDraft,
  type Person,
} from "./compose-dialog";

type Outputs = inferRouterOutputs<AppRouter>["mail"];
type Row = Outputs["list"][number];
type Conversation = Outputs["get"];
type Folder = "inbox" | "starred" | "sent" | "drafts" | "trash";

const folders: { id: Folder; label: string; icon: typeof InboxIcon }[] = [
  { id: "inbox", label: "Inbox", icon: InboxIcon },
  { id: "starred", label: "Starred", icon: StarIcon },
  { id: "sent", label: "Sent", icon: SendIcon },
  { id: "drafts", label: "Drafts", icon: FileEditIcon },
  { id: "trash", label: "Trash", icon: Trash2Icon },
];

const emptyCopy: Record<Folder, string> = {
  inbox: "Nothing in your inbox. New messages show up here.",
  starred: "Star a message to find it again quickly.",
  sent: "Messages you send appear here.",
  drafts: "Unfinished messages are kept here.",
  trash: "Deleted messages stay here until you remove them for good.",
};

const stamp = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const reason = (error: unknown) =>
  error instanceof Error ? error.message : undefined;

const quote = (name: string, at: string, body: string) =>
  `\n\nOn ${stamp.format(new Date(at))}, ${name} wrote:\n${body
    .split("\n")
    .map((line) => `> ${line}`)
    .join("\n")}`;

export function MailApp() {
  const trpc = useTrpcClient();
  const [folder, setFolder] = useState<Folder>("inbox");
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [unread, setUnread] = useState(0);
  const [people, setPeople] = useState<Person[]>([]);
  const [compose, setCompose] = useState<ComposeDraft | null>(null);

  const load = useCallback(async () => {
    try {
      const [list, count] = await Promise.all([
        trpc.mail.list.query({ folder, search: search || undefined }),
        trpc.mail.unread.query(),
      ]);
      setRows(list);
      setUnread(count.count);
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, [trpc, folder, search]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), search ? 200 : 0);
    return () => clearTimeout(timer);
  }, [load, search]);

  useEffect(() => {
    const timer = setInterval(() => void load(), 30_000);
    return () => clearInterval(timer);
  }, [load]);

  useEffect(() => {
    trpc.mail.people
      .query()
      .then(setPeople)
      .catch(() => undefined);
  }, [trpc]);

  useEffect(() => {
    if (!openId) {
      setConversation(null);
      return;
    }

    let cancelled = false;
    trpc.mail.get
      .query({ id: openId })
      .then((data) => {
        if (cancelled) return;
        setConversation(data);
        void load();
      })
      .catch(() => {
        if (cancelled) return;
        toastError("Could not open the message");
        setOpenId(null);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trpc, openId]);

  async function flag(
    ids: string[],
    change: { read?: boolean; starred?: boolean; trashed?: boolean },
  ) {
    try {
      await trpc.mail.update.mutate({ ids, ...change });
      if (change.trashed !== undefined) setOpenId(null);
      await load();
    } catch (error) {
      toastError("Could not update the message", reason(error));
    }
  }

  async function purge(ids: string[]) {
    if (!window.confirm("Delete for good? This cannot be undone.")) return;

    try {
      await trpc.mail.purge.mutate({ ids });
      setOpenId(null);
      await load();
    } catch (error) {
      toastError("Could not delete the message", reason(error));
    }
  }

  async function send(draft: ComposeDraft) {
    await trpc.mail.send.mutate(draft);
    setCompose(null);
    toast.success("Message sent");
    await load();
    if (openId) setOpenId(openId);
  }

  async function keep(draft: ComposeDraft) {
    await trpc.mail.saveDraft.mutate(draft);
    setCompose(null);
    toast.success("Draft saved");
    await load();
  }

  async function discard() {
    const id = compose?.id;
    setCompose(null);

    if (id) {
      try {
        await trpc.mail.purge.mutate({ ids: [id] });
        await load();
      } catch {
        // The draft stays in Drafts if it could not be removed.
      }
    }
  }

  function reply(all: boolean) {
    const last = conversation?.messages.filter((m) => !m.draft).at(-1);
    if (!last) return;

    const me = people.find((person) => person.isMe)?.id;
    const others = last.mine ? last.to.map((p) => p.id) : [last.from.id];
    const to = all
      ? [...new Set([...others, ...last.to.map((p) => p.id)])]
      : others;
    const cc = all ? last.cc.map((p) => p.id) : [];

    setCompose({
      to: to.filter((id) => id !== me || to.length === 1),
      cc: cc.filter((id) => id !== me),
      subject: /^re:/i.test(last.subject)
        ? last.subject
        : `Re: ${last.subject}`,
      body: quote(last.from.name, last.at, last.body),
      replyToId: last.id,
    });
  }

  function forward() {
    const last = conversation?.messages.filter((m) => !m.draft).at(-1);
    if (!last) return;

    setCompose({
      to: [],
      cc: [],
      subject: /^fwd:/i.test(last.subject)
        ? last.subject
        : `Fwd: ${last.subject}`,
      body: `\n\n---------- Forwarded message ----------\nFrom: ${last.from.name}\nDate: ${stamp.format(new Date(last.at))}\n\n${last.body}`,
    });
  }

  async function open(row: Row) {
    if (row.draft) {
      try {
        const data = await trpc.mail.get.query({ id: row.id });
        const draft = data.messages.find((message) => message.id === row.id);

        if (draft)
          setCompose({
            id: draft.id,
            to: draft.to.map((p) => p.id),
            cc: draft.cc.map((p) => p.id),
            subject: draft.subject,
            body: draft.body,
          });
      } catch (error) {
        toastError("Could not open the draft", reason(error));
      }
      return;
    }

    setOpenId(row.id);
  }

  const current = rows?.find((row) => row.id === openId);

  return (
    <div className="-mx-4 -mt-5 -mb-12 flex h-[calc(100svh-3.5rem)] min-h-[480px] overflow-hidden border-t border-hairline md:-mx-(--gutter) md:-mt-7 md:-mb-16">
      <nav
        aria-label="Mail folders"
        className="hidden w-52 shrink-0 flex-col gap-1 border-r border-line p-3 lg:flex"
      >
        <Button
          className="mb-2"
          onClick={() => setCompose({ to: [], cc: [], subject: "", body: "" })}
        >
          <PenSquareIcon aria-hidden />
          Compose
        </Button>
        {folders.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            aria-current={folder === id ? "page" : undefined}
            onClick={() => {
              setFolder(id);
              setOpenId(null);
              setRows(null);
            }}
            className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm ${folder === id ? "bg-sunken font-medium text-ink" : "text-ink-2 hover:bg-sunken"}`}
          >
            <Icon className="size-4" aria-hidden />
            {label}
            {id === "inbox" && unread > 0 ? (
              <span className="ml-auto rounded-full bg-ink px-1.5 text-xs text-canvas">
                {unread}
              </span>
            ) : null}
          </button>
        ))}
      </nav>

      <section
        aria-label="Messages"
        className={`min-w-0 flex-col border-r border-line md:flex md:w-80 md:shrink-0 lg:w-96 ${openId ? "hidden" : "flex w-full"}`}
      >
        <div className="flex items-center gap-2 border-b border-line p-3 lg:hidden">
          <select
            aria-label="Folder"
            value={folder}
            onChange={(event) => {
              setFolder(event.target.value as Folder);
              setRows(null);
            }}
            className="h-9 flex-1 rounded-md border border-line bg-transparent px-2 text-sm"
          >
            {folders.map(({ id, label }) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
          <Button
            size="sm"
            onClick={() =>
              setCompose({ to: [], cc: [], subject: "", body: "" })
            }
          >
            Compose
          </Button>
        </div>
        <div className="relative border-b border-line p-3">
          <SearchIcon
            className="pointer-events-none absolute top-1/2 left-6 size-4 -translate-y-1/2 text-ink-3"
            aria-hidden
          />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search mail"
            aria-label="Search mail"
            className="pl-9"
          />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {failed ? (
            <p role="alert" className="p-4 text-sm">
              Mail did not load.{" "}
              <button className="underline" onClick={() => void load()}>
                Retry
              </button>
            </p>
          ) : rows === null ? (
            <p role="status" className="p-4 text-sm text-ink-2">
              Loading…
            </p>
          ) : rows.length === 0 ? (
            <p className="p-6 text-center text-sm text-ink-2">
              {search ? "No messages match." : emptyCopy[folder]}
            </p>
          ) : (
            <ul>
              {rows.map((row) => (
                <li key={row.id} className="border-b border-line">
                  <button
                    type="button"
                    onClick={() => void open(row)}
                    aria-current={openId === row.id ? "true" : undefined}
                    className={`flex w-full flex-col gap-0.5 px-4 py-3 text-left hover:bg-sunken ${openId === row.id ? "bg-sunken" : ""}`}
                  >
                    <span className="flex items-center gap-2">
                      {row.unread ? (
                        <span
                          className="size-2 shrink-0 rounded-full bg-accent"
                          role="img"
                          aria-label="Unread"
                        />
                      ) : null}
                      <span
                        className={`truncate text-sm ${row.unread ? "font-semibold text-ink" : "text-ink-2"}`}
                      >
                        {folder === "sent" || folder === "drafts"
                          ? `To: ${row.to.join(", ") || "No recipient"}`
                          : row.from}
                      </span>
                      {row.starred ? (
                        <StarIcon
                          className="size-3.5 shrink-0 fill-warning text-warning"
                          aria-label="Starred"
                        />
                      ) : null}
                      <span className="ml-auto shrink-0 text-xs text-ink-3">
                        {stamp.format(new Date(row.at))}
                      </span>
                    </span>
                    <span
                      className={`truncate text-sm ${row.unread ? "font-medium" : ""}`}
                    >
                      {row.draft ? "Draft · " : ""}
                      {row.subject}
                    </span>
                    <span className="truncate text-xs text-ink-3">
                      {row.snippet}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <article
        aria-label="Message"
        className={`min-w-0 flex-1 flex-col overflow-y-auto ${openId ? "flex" : "hidden md:flex"}`}
      >
        {!openId || !conversation ? (
          <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-ink-3">
            {openId ? "Opening…" : "Select a message to read it."}
          </div>
        ) : (
          <>
            <header className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3">
              <Button
                variant="ghost"
                size="icon-sm"
                className="md:hidden"
                aria-label="Back to messages"
                onClick={() => setOpenId(null)}
              >
                <ArrowLeftIcon aria-hidden />
              </Button>
              <h2 className="min-w-0 flex-1 truncate text-lg font-semibold">
                {conversation.subject}
              </h2>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={current?.starred ? "Remove star" : "Star"}
                aria-pressed={current?.starred ?? false}
                onClick={() =>
                  void flag([openId], { starred: !current?.starred })
                }
              >
                <StarIcon
                  className={
                    current?.starred ? "fill-warning text-warning" : ""
                  }
                  aria-hidden
                />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Mark as unread"
                onClick={() => void flag([openId], { read: false })}
              >
                <MailOpenIcon aria-hidden />
              </Button>
              {folder === "trash" ? (
                <>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Restore"
                    onClick={() => void flag([openId], { trashed: false })}
                  >
                    <ArchiveRestoreIcon aria-hidden />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => void purge([openId])}
                  >
                    Delete forever
                  </Button>
                </>
              ) : (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Move to trash"
                  onClick={() => void flag([openId], { trashed: true })}
                >
                  <Trash2Icon aria-hidden />
                </Button>
              )}
            </header>

            <div className="flex flex-col gap-4 p-4">
              {conversation.messages.map((message) => (
                <section
                  key={message.id}
                  className="rounded-xl border border-line p-4"
                >
                  <div className="mb-3 flex flex-wrap items-baseline gap-x-2">
                    <span className="font-medium">
                      {message.mine ? "Me" : message.from.name}
                    </span>
                    <span className="text-xs text-ink-3">
                      {message.from.email}
                    </span>
                    <span className="ml-auto text-xs text-ink-3">
                      {stamp.format(new Date(message.at))}
                    </span>
                  </div>
                  <p className="mb-3 text-xs text-ink-3">
                    To {message.to.map((p) => p.name).join(", ")}
                    {message.cc.length
                      ? ` · Cc ${message.cc.map((p) => p.name).join(", ")}`
                      : ""}
                  </p>
                  <div className="text-sm leading-relaxed whitespace-pre-wrap">
                    {message.body}
                  </div>
                </section>
              ))}

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => reply(false)}>
                  <ReplyIcon aria-hidden />
                  Reply
                </Button>
                <Button variant="outline" onClick={() => reply(true)}>
                  <ReplyAllIcon aria-hidden />
                  Reply all
                </Button>
                <Button variant="outline" onClick={forward}>
                  <ForwardIcon aria-hidden />
                  Forward
                </Button>
              </div>
            </div>
          </>
        )}
      </article>

      <ComposeDialog
        draft={compose}
        people={people}
        onSend={send}
        onKeep={keep}
        onDiscard={() => void discard()}
      />
    </div>
  );
}
