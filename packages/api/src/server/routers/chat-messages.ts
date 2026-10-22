import { TRPCError } from "@trpc/server";
import {
  and,
  asc,
  desc,
  eq,
  gt,
  gte,
  ilike,
  inArray,
  isNull,
  lt,
  lte,
  or,
  sql,
  type SQL,
} from "@zentro/db/drizzle";
import {
  chatAttachments,
  chatChannels,
  chatLinkPreviews,
  chatMembers,
  chatMessages,
  chatPolls,
  chatPollVotes,
  chatReactions,
  chatSaved,
  docs,
  files,
  members,
  projects,
  tasks,
  users,
  workLinks,
} from "@zentro/db/schema";
import { z } from "zod";

import {
  channelAccess,
  currentMemberId,
  memberProfiles,
  mentionedMemberIds,
  plainBody,
  readableChannel,
  readableChannelIds,
  type Profile,
} from "../chat";
import { syncMentions, taskKeysIn } from "../mentions";
import { runMessageAutomations } from "../automations/engine";
import { postChatMessage } from "../chat-post";
import { visibleDocsCondition } from "../access";
import { externalUrls } from "../chat-unfurl";
import { permissionProcedure, type OrganizationContext } from "../trpc";

const uuid = z.string().uuid();
const PAGE = 50;

const chatProcedure = (permission: string, options: { also?: string[] } = {}) =>
  permissionProcedure(permission, undefined, { module: "chat", ...options });

type Row = typeof chatMessages.$inferSelect;

export type ChatAttachment = {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  url: string;
};

export type ChatTaskRef = {
  id: string;
  key: string;
  name: string;
  status: string;
  assignee: string | null;
};

/** An internal page a message links to, shown as a card. */
export type ChatEntityRef =
  | {
      type: "doc";
      id: string;
      title: string;
      subtitle: string | null;
      href: string;
    }
  | {
      type: "project";
      id: string;
      title: string;
      subtitle: string | null;
      status: string;
      href: string;
    }
  | {
      type: "file";
      id: string;
      title: string;
      subtitle: string | null;
      mimeType: string;
      href: string;
    }
  | {
      type: "message";
      id: string;
      title: string;
      subtitle: string | null;
      excerpt: string;
      href: string;
    }
  // Exists, but the viewer cannot open it: nothing about it is shown.
  | { type: "missing"; href: string };

export type ChatPollView = {
  id: string;
  question: string;
  multiple: boolean;
  closed: boolean;
  total: number;
  options: Array<{
    label: string;
    votes: number;
    mine: boolean;
    voters: string[];
  }>;
};

export type ChatLinkPreview = {
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
  siteName: string | null;
};

export type ChatMessageView = {
  id: string;
  channelId: string;
  parentId: string | null;
  clientId: string | null;
  kind: "message" | "poll" | "event" | "huddle";
  meta: Record<string, unknown> | null;
  author: Pick<Profile, "memberId" | "name" | "presence" | "status"> | null;
  /** Saved by the caller, with the reminder if there is one. */
  saved: { remindAt: Date | null } | null;
  poll: ChatPollView | null;
  forwarded: {
    id: string;
    channelId: string;
    channelName: string | null;
    authorName: string;
    excerpt: string;
  } | null;
  entities: ChatEntityRef[];
  links: ChatLinkPreview[];
  mine: boolean;
  body: string;
  createdAt: Date;
  editedAt: Date | null;
  deleted: boolean;
  pinned: boolean;
  /** Display names of the people mentioned, by member id. */
  names: Record<string, string>;
  reactions: Array<{
    emoji: string;
    count: number;
    mine: boolean;
    names: string[];
  }>;
  attachments: ChatAttachment[];
  tasks: ChatTaskRef[];
  replies: { count: number; lastAt: Date | null; people: string[] } | null;
};

const internalRef =
  /(?:https?:\/\/([^\s/<>]+))?\/(docs|projects|files)\/([A-Za-z0-9_-]{2,80})(?![A-Za-z0-9_/-])/g;
const reservedDocSlugs = new Set([
  "my-docs",
  "recent",
  "projects",
  "trash",
  "search",
]);

function ownHosts() {
  const hosts = new Set<string>(["localhost:3000", "localhost:3100"]);

  for (const value of [
    process.env.BETTER_AUTH_URL,
    process.env.NEXT_PUBLIC_BASE_URL,
  ]) {
    try {
      if (value) hosts.add(new URL(value).host);
    } catch {
      // ignore a malformed setting
    }
  }

  return hosts;
}

/** Docs, projects and files a body links to by address. */
export function internalRefsIn(body: string) {
  const hosts = ownHosts();
  const refs: Array<{ kind: "docs" | "projects" | "files"; key: string }> = [];

  for (const match of body.matchAll(internalRef)) {
    const [, host, kind, key] = match;

    if (host && !hosts.has(host)) continue;
    if (kind === "docs" && reservedDocSlugs.has(key!)) continue;

    refs.push({ kind: kind as "docs" | "projects" | "files", key: key! });
  }

  return refs.filter(
    (ref, index) =>
      refs.findIndex((r) => r.kind === ref.kind && r.key === ref.key) === index,
  );
}

const messageLink =
  /(?:https?:\/\/([^\s/<>]+))?\/chat\/(?:dm\/)?[\w-]+\?(?:[^\s<>]*&)?m=([0-9a-f-]{36})/g;

/** Ids of chat messages a body links to by address. */
export function messageLinksIn(body: string) {
  const hosts = ownHosts();
  const ids: string[] = [];

  for (const match of body.matchAll(messageLink)) {
    const [, host, id] = match;

    if (host && !hosts.has(host)) continue;

    ids.push(id!);
  }

  return [...new Set(ids)].slice(0, 3);
}

/** Cards for the docs, projects and files bodies link to, for this viewer. */
async function resolveEntities(
  ctx: OrganizationContext,
  rows: Row[],
  memberId: string,
): Promise<Map<string, ChatEntityRef>> {
  const refs = rows.flatMap((row) => internalRefsIn(row.body));
  const found = new Map<string, ChatEntityRef>();
  const messageIds = [
    ...new Set(rows.flatMap((row) => messageLinksIn(row.body))),
  ];

  if (messageIds.length) {
    const readable = new Set(await readableChannelIds(ctx, memberId));
    const linked = await ctx.db
      .select({
        id: chatMessages.id,
        body: chatMessages.body,
        channelId: chatMessages.channelId,
        authorMemberId: chatMessages.authorMemberId,
        deletedAt: chatMessages.deletedAt,
        channelName: chatChannels.name,
      })
      .from(chatMessages)
      .innerJoin(chatChannels, eq(chatChannels.id, chatMessages.channelId))
      .where(
        and(
          eq(chatMessages.organizationId, ctx.activeOrganization.id),
          inArray(chatMessages.id, messageIds),
        ),
      );
    const authors = await memberProfiles(
      ctx,
      linked
        .map((row) => row.authorMemberId)
        .filter((id): id is string => Boolean(id)),
    );

    for (const row of linked) {
      const href = row.channelName
        ? `/chat/${row.channelName}?m=${row.id}`
        : `/chat/dm/${row.channelId}?m=${row.id}`;

      found.set(
        `messages:${row.id}`,
        row.deletedAt || !readable.has(row.channelId)
          ? { type: "missing", href }
          : {
              type: "message",
              id: row.id,
              title:
                (row.authorMemberId
                  ? authors.get(row.authorMemberId)?.name
                  : null) ?? "Someone",
              subtitle: row.channelName
                ? `#${row.channelName}`
                : "Direct message",
              excerpt: excerptOf(row.body),
              href,
            },
      );
    }
  }

  if (!refs.length) return found;

  const orgId = ctx.activeOrganization.id;
  const docSlugs = refs.filter((r) => r.kind === "docs").map((r) => r.key);
  const projectSlugs = refs
    .filter((r) => r.kind === "projects")
    .map((r) => r.key);
  const fileIds = refs
    .filter((r) => r.kind === "files" && /^[0-9a-f-]{36}$/.test(r.key))
    .map((r) => r.key);
  const enabled = await ctx.enabledModules();

  if (docSlugs.length && enabled.has("docs")) {
    const [all, visible] = await Promise.all([
      ctx.db
        .select({ id: docs.id, slug: docs.slug, title: docs.title })
        .from(docs)
        .where(
          and(
            eq(docs.organizationId, orgId),
            inArray(docs.slug, docSlugs),
            isNull(docs.deletedAt),
          ),
        ),
      ctx.db
        .select({ id: docs.id })
        .from(docs)
        .where(
          and(
            eq(docs.organizationId, orgId),
            inArray(docs.slug, docSlugs),
            isNull(docs.deletedAt),
            await visibleDocsCondition(ctx.permissions, "docs.view"),
          ),
        ),
    ]);
    const canOpen = new Set(visible.map((row) => row.id));

    for (const doc of all) {
      found.set(
        `docs:${doc.slug}`,
        canOpen.has(doc.id)
          ? {
              type: "doc",
              id: doc.id,
              title: doc.title || "Untitled",
              subtitle: "Doc",
              href: `/docs/${doc.slug}`,
            }
          : { type: "missing", href: `/docs/${doc.slug}` },
      );
    }
  }

  if (projectSlugs.length && enabled.has("projects")) {
    const viewable = new Set(
      await ctx.permissions.viewableProjectIds("projects.view"),
    );
    const all = await ctx.db
      .select({
        id: projects.id,
        slug: projects.slug,
        name: projects.name,
        key: projects.taskKeyPrefix,
        status: projects.status,
      })
      .from(projects)
      .where(
        and(
          eq(projects.organizationId, orgId),
          inArray(projects.slug, projectSlugs),
        ),
      );

    for (const project of all) {
      found.set(
        `projects:${project.slug}`,
        viewable.has(project.id)
          ? {
              type: "project",
              id: project.id,
              title: project.name,
              subtitle: project.key ? `Project · ${project.key}` : "Project",
              status: project.status,
              href: `/projects/${project.slug}`,
            }
          : { type: "missing", href: `/projects/${project.slug}` },
      );
    }
  }

  if (fileIds.length) {
    const all = await ctx.db
      .select({
        id: files.id,
        name: files.name,
        mimeType: files.mimeType,
        size: files.size,
      })
      .from(files)
      .where(
        and(
          eq(files.organizationId, orgId),
          inArray(files.id, fileIds),
          isNull(files.deletedAt),
        ),
      );

    for (const file of all) {
      found.set(`files:${file.id}`, {
        type: "file",
        id: file.id,
        title: file.name,
        subtitle: `${Math.max(1, Math.round(file.size / 1024))} KB`,
        mimeType: file.mimeType,
        href: `/api/files/${file.id}`,
      });
    }
  }

  return found;
}

function excerptOf(body: string) {
  const text = body
    .replace(/<@[0-9a-f-]{36}>/g, "@someone")
    .replace(/\s+/g, " ")
    .trim();

  return text.length > 160 ? `${text.slice(0, 157)}…` : text;
}

/** Everything a message needs on screen, for a batch of rows at once. */
export async function hydrateMessages(
  ctx: OrganizationContext,
  rows: Row[],
  memberId: string,
  options: { withReplies?: boolean } = {},
): Promise<ChatMessageView[]> {
  if (!rows.length) return [];

  const ids = rows.map((row) => row.id);
  const [reactionRows, attachmentRows, replyRows] = await Promise.all([
    ctx.db
      .select({
        messageId: chatReactions.messageId,
        emoji: chatReactions.emoji,
        memberId: chatReactions.memberId,
      })
      .from(chatReactions)
      .where(inArray(chatReactions.messageId, ids))
      .orderBy(asc(chatReactions.createdAt)),
    ctx.db
      .select({
        messageId: chatAttachments.messageId,
        id: files.id,
        name: files.name,
        mimeType: files.mimeType,
        size: files.size,
        width: files.width,
        height: files.height,
      })
      .from(chatAttachments)
      .innerJoin(files, eq(files.id, chatAttachments.fileId))
      .where(
        and(inArray(chatAttachments.messageId, ids), isNull(files.deletedAt)),
      )
      .orderBy(asc(chatAttachments.position)),
    options.withReplies
      ? ctx.db
          .select({
            parentId: chatMessages.parentId,
            count: sql<number>`count(*)`.mapWith(Number),
            lastAt: sql<Date>`max(${chatMessages.createdAt})`.mapWith(
              chatMessages.createdAt,
            ),
            people: sql<
              string[]
            >`array_agg(distinct ${chatMessages.authorMemberId}::text)`,
          })
          .from(chatMessages)
          .where(
            and(
              inArray(chatMessages.parentId, ids),
              isNull(chatMessages.deletedAt),
            ),
          )
          .groupBy(chatMessages.parentId)
      : [],
  ]);

  const peopleIds = new Set<string>();

  for (const row of rows) {
    if (row.authorMemberId) peopleIds.add(row.authorMemberId);
    mentionedMemberIds(row.body).forEach((id) => peopleIds.add(id));
  }

  reactionRows.forEach((row) => peopleIds.add(row.memberId));
  replyRows.forEach((row) =>
    row.people.forEach((id) => id && peopleIds.add(id)),
  );

  const profiles = await memberProfiles(ctx, [...peopleIds]);
  const nameOf = (id: string) => profiles.get(id)?.name ?? "Someone";

  // Tasks made from a message by its "Create task" action are linked to it.
  const createdLinks = await ctx.db
    .select({ messageId: workLinks.sourceId, taskId: workLinks.targetId })
    .from(workLinks)
    .where(
      and(
        eq(workLinks.organizationId, ctx.activeOrganization.id),
        eq(workLinks.sourceType, "message"),
        eq(workLinks.targetType, "task"),
        eq(workLinks.kind, "relates"),
        inArray(workLinks.sourceId, ids),
      ),
    );

  // Task keys become cards, but only for tasks the caller can see.
  const keys = [...new Set(rows.flatMap((row) => taskKeysIn(row.body)))];
  const enabled = await ctx.enabledModules();
  const viewable =
    (keys.length || createdLinks.length) && enabled.has("tasks")
      ? await ctx.permissions.viewableProjectIds("tasks.view")
      : [];
  const taskRows = viewable.length
    ? await ctx.db
        .select({
          id: tasks.id,
          key: tasks.key,
          name: tasks.name,
          status: tasks.status,
          assignee: users.name,
        })
        .from(tasks)
        .leftJoin(members, eq(members.id, tasks.assignedToMemberId))
        .leftJoin(users, eq(users.id, members.userId))
        .where(
          and(
            eq(tasks.organizationId, ctx.activeOrganization.id),
            or(
              keys.length ? inArray(tasks.key, keys) : undefined,
              createdLinks.length
                ? inArray(
                    tasks.id,
                    createdLinks.map((link) => link.taskId),
                  )
                : undefined,
            ),
            inArray(tasks.projectId, viewable),
            isNull(tasks.deletedAt),
          ),
        )
    : [];

  const readableIds = new Set(await readableChannelIds(ctx, memberId));
  const forwardIds = rows
    .map((row) => row.forwardedFromId)
    .filter((id): id is string => Boolean(id));
  const urls = [...new Set(rows.flatMap((row) => externalUrls(row.body)))];
  const [savedRows, pollRows, forwardRows, previewRows, entityMap] =
    await Promise.all([
      ctx.db
        .select({
          messageId: chatSaved.messageId,
          remindAt: chatSaved.remindAt,
        })
        .from(chatSaved)
        .where(
          and(
            eq(chatSaved.memberId, memberId),
            inArray(chatSaved.messageId, ids),
          ),
        ),
      ctx.db.select().from(chatPolls).where(inArray(chatPolls.messageId, ids)),
      forwardIds.length
        ? ctx.db
            .select({
              id: chatMessages.id,
              channelId: chatMessages.channelId,
              body: chatMessages.body,
              authorMemberId: chatMessages.authorMemberId,
              deletedAt: chatMessages.deletedAt,
              channelName: chatChannels.name,
            })
            .from(chatMessages)
            .innerJoin(
              chatChannels,
              eq(chatChannels.id, chatMessages.channelId),
            )
            .where(inArray(chatMessages.id, forwardIds))
        : [],
      urls.length
        ? ctx.db
            .select()
            .from(chatLinkPreviews)
            .where(
              and(
                eq(chatLinkPreviews.organizationId, ctx.activeOrganization.id),
                inArray(chatLinkPreviews.url, urls),
                eq(chatLinkPreviews.failed, false),
              ),
            )
        : [],
      resolveEntities(ctx, rows, memberId),
    ]);
  const voteRows = pollRows.length
    ? await ctx.db
        .select()
        .from(chatPollVotes)
        .where(
          inArray(
            chatPollVotes.pollId,
            pollRows.map((poll) => poll.id),
          ),
        )
    : [];
  const voterProfiles = await memberProfiles(
    ctx,
    voteRows.map((vote) => vote.memberId),
  );
  const forwardAuthors = await memberProfiles(
    ctx,
    forwardRows
      .map((row) => row.authorMemberId)
      .filter((id): id is string => Boolean(id)),
  );

  return rows.map((row) => {
    const deleted = Boolean(row.deletedAt);
    const reactions = new Map<
      string,
      { emoji: string; count: number; mine: boolean; names: string[] }
    >();

    for (const reaction of reactionRows) {
      if (reaction.messageId !== row.id) continue;

      const entry = reactions.get(reaction.emoji) ?? {
        emoji: reaction.emoji,
        count: 0,
        mine: false,
        names: [],
      };

      entry.count += 1;
      entry.mine ||= reaction.memberId === memberId;
      entry.names.push(nameOf(reaction.memberId));
      reactions.set(reaction.emoji, entry);
    }

    const reply = replyRows.find((entry) => entry.parentId === row.id);
    const author = row.authorMemberId
      ? profiles.get(row.authorMemberId)
      : undefined;

    return {
      id: row.id,
      channelId: row.channelId,
      parentId: row.parentId,
      clientId: row.clientId,
      kind: (row.kind ?? "message") as ChatMessageView["kind"],
      meta: row.meta ?? null,
      author: author
        ? {
            memberId: author.memberId,
            name: author.name,
            presence: author.presence,
            status: author.status,
          }
        : null,
      saved: (() => {
        const saved = savedRows.find((entry) => entry.messageId === row.id);

        return saved ? { remindAt: saved.remindAt } : null;
      })(),
      poll: (() => {
        const poll = pollRows.find((entry) => entry.messageId === row.id);

        if (!poll || deleted) return null;

        const votes = voteRows.filter((vote) => vote.pollId === poll.id);

        return {
          id: poll.id,
          question: poll.question,
          multiple: poll.multiple,
          closed: Boolean(poll.closedAt),
          total: new Set(votes.map((vote) => vote.memberId)).size,
          options: poll.options.map((label, index) => {
            const forOption = votes.filter(
              (vote) => vote.optionIndex === index,
            );

            return {
              label,
              votes: forOption.length,
              mine: forOption.some((vote) => vote.memberId === memberId),
              voters: forOption
                .map((vote) => voterProfiles.get(vote.memberId)?.name)
                .filter((name): name is string => Boolean(name))
                .slice(0, 8),
            };
          }),
        };
      })(),
      forwarded: (() => {
        const source = forwardRows.find(
          (entry) => entry.id === row.forwardedFromId,
        );

        // Only people who can read the original see where it came from.
        if (!source || source.deletedAt || !readableIds.has(source.channelId)) {
          return null;
        }

        return {
          id: source.id,
          channelId: source.channelId,
          channelName: source.channelName,
          authorName:
            (source.authorMemberId
              ? forwardAuthors.get(source.authorMemberId)?.name
              : null) ?? "Someone",
          excerpt: excerptOf(source.body),
        };
      })(),
      entities: deleted
        ? []
        : [
            ...messageLinksIn(row.body).map((id) =>
              entityMap.get(`messages:${id}`),
            ),
            ...internalRefsIn(row.body).map((ref) =>
              entityMap.get(`${ref.kind}:${ref.key}`),
            ),
          ].filter((entry): entry is ChatEntityRef => entry !== undefined),
      links: deleted
        ? []
        : externalUrls(row.body)
            .map((url) => previewRows.find((entry) => entry.url === url))
            .filter((entry) => entry !== undefined && entry.title !== null)
            .map((entry) => ({
              url: entry!.url,
              title: entry!.title,
              description: entry!.description,
              image: entry!.image,
              siteName: entry!.siteName,
            })),
      mine: row.authorMemberId === memberId,
      body: deleted ? "" : row.body,
      createdAt: row.createdAt,
      editedAt: row.editedAt,
      deleted,
      pinned: Boolean(row.pinnedAt),
      names: Object.fromEntries(
        mentionedMemberIds(row.body).map((id) => [id, nameOf(id)]),
      ),
      reactions: deleted ? [] : [...reactions.values()],
      attachments: deleted
        ? []
        : attachmentRows
            .filter((entry) => entry.messageId === row.id)
            .map((entry) => ({
              id: entry.id,
              name: entry.name,
              mimeType: entry.mimeType,
              size: entry.size,
              width: entry.width,
              height: entry.height,
              url: `/api/files/${entry.id}`,
            })),
      tasks: deleted
        ? []
        : [
            ...taskKeysIn(row.body).map((key) =>
              taskRows.find((task) => task.key === key),
            ),
            ...createdLinks
              .filter((link) => link.messageId === row.id)
              .map((link) => taskRows.find((task) => task.id === link.taskId)),
          ]
            .filter((task) => task !== undefined)
            .filter(
              (task, index, all) =>
                all.findIndex((other) => other.id === task.id) === index,
            ),
      replies:
        options.withReplies && reply
          ? {
              count: reply.count,
              lastAt: reply.lastAt,
              people: reply.people.filter(Boolean).map(nameOf).slice(0, 3),
            }
          : options.withReplies
            ? { count: 0, lastAt: null, people: [] }
            : null,
    };
  });
}

async function loadMessage(ctx: OrganizationContext, messageId: string) {
  const [row] = await ctx.db
    .select()
    .from(chatMessages)
    .where(
      and(
        eq(chatMessages.id, messageId),
        eq(chatMessages.organizationId, ctx.activeOrganization.id),
      ),
    )
    .limit(1);

  if (!row) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Message not found." });
  }

  return row;
}

/** Files the caller uploaded and has not attached anywhere yet. */
async function claimFiles(
  ctx: OrganizationContext,
  memberId: string,
  fileIds: string[],
) {
  if (!fileIds.length) return [];

  const rows = await ctx.db
    .select({ id: files.id })
    .from(files)
    .leftJoin(chatAttachments, eq(chatAttachments.fileId, files.id))
    .where(
      and(
        inArray(files.id, fileIds),
        eq(files.organizationId, ctx.activeOrganization.id),
        eq(files.uploadedByMemberId, memberId),
        isNull(files.deletedAt),
        isNull(chatAttachments.id),
      ),
    );
  const owned = new Set(rows.map((row) => row.id));

  return fileIds.filter((id) => owned.has(id));
}

export const chatMessageProcedures = {
  /** A page of top-level messages, oldest first; or the page around one. */
  messages: chatProcedure("chat.view")
    .input(
      z.object({
        channelId: uuid,
        before: z.coerce.date().optional(),
        aroundId: uuid.optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const access = await readableChannel(ctx, input.channelId);
      const base = and(
        eq(chatMessages.channelId, input.channelId),
        isNull(chatMessages.parentId),
      );
      let rows: Row[];

      if (input.aroundId) {
        const anchor = await loadMessage(ctx, input.aroundId);
        const at = anchor.parentId
          ? (await loadMessage(ctx, anchor.parentId)).createdAt
          : anchor.createdAt;
        const [older, newer] = await Promise.all([
          ctx.db
            .select()
            .from(chatMessages)
            .where(and(base, lte(chatMessages.createdAt, at)))
            .orderBy(desc(chatMessages.createdAt))
            .limit(PAGE / 2),
          ctx.db
            .select()
            .from(chatMessages)
            .where(and(base, gt(chatMessages.createdAt, at)))
            .orderBy(asc(chatMessages.createdAt))
            .limit(PAGE / 2),
        ]);

        rows = [...older.reverse(), ...newer];
      } else {
        rows = (
          await ctx.db
            .select()
            .from(chatMessages)
            .where(
              and(
                base,
                input.before
                  ? lt(chatMessages.createdAt, input.before)
                  : undefined,
              ),
            )
            .orderBy(desc(chatMessages.createdAt))
            .limit(PAGE + 1)
        ).reverse();
      }

      const hasMore = !input.aroundId && rows.length > PAGE;
      const page = hasMore ? rows.slice(1) : rows;

      return {
        messages: await hydrateMessages(ctx, page, access.memberId, {
          withReplies: true,
        }),
        hasMore: input.aroundId ? true : hasMore,
      };
    }),

  /** A thread: the first message and every reply. */
  thread: chatProcedure("chat.view")
    .input(z.object({ messageId: uuid }))
    .query(async ({ ctx, input }) => {
      const parent = await loadMessage(ctx, input.messageId);
      const access = await readableChannel(ctx, parent.channelId);
      const replies = await ctx.db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.parentId, parent.id))
        .orderBy(asc(chatMessages.createdAt));
      const [head, ...rest] = await hydrateMessages(
        ctx,
        [parent, ...replies],
        access.memberId,
      );

      return { parent: head!, replies: rest };
    }),

  send: chatProcedure("chat.post", { also: ["chat.files.upload"] })
    .input(
      z.object({
        channelId: uuid,
        body: z.string().max(10_000).default(""),
        parentId: uuid.optional(),
        clientId: z.string().max(64).optional(),
        fileIds: z.array(uuid).max(10).default([]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const body = input.body.trim();

      if (!body && !input.fileIds.length) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Write something or attach a file.",
        });
      }

      const access = await channelAccess(ctx, input.channelId);

      if (!access.canPost) {
        throw new TRPCError({
          code: access.canRead ? "FORBIDDEN" : "NOT_FOUND",
          message: access.channel.archivedAt
            ? "This channel is archived."
            : access.canRead
              ? "You can't post here."
              : "Channel not found.",
        });
      }

      if (
        input.fileIds.length &&
        !(await ctx.permissions.can("chat.files.upload"))
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can't share files here.",
        });
      }

      // The same queued message sent twice is one message.
      if (input.clientId) {
        const [existing] = await ctx.db
          .select()
          .from(chatMessages)
          .where(
            and(
              eq(chatMessages.authorMemberId, access.memberId),
              eq(chatMessages.clientId, input.clientId),
            ),
          )
          .limit(1);

        if (existing) {
          return (await hydrateMessages(ctx, [existing], access.memberId))[0]!;
        }
      }

      if (input.parentId) {
        const parent = await loadMessage(ctx, input.parentId);

        if (parent.channelId !== input.channelId || parent.parentId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Reply in the thread of a message in this channel.",
          });
        }
      }

      const fileIds = await claimFiles(ctx, access.memberId, input.fileIds);
      const row = await ctx.db.transaction((tx) =>
        postChatMessage(tx, {
          organizationId: ctx.activeOrganization.id,
          channelId: input.channelId,
          memberId: access.memberId,
          body,
          parentId: input.parentId,
          clientId: input.clientId,
          fileIds,
          // Posting in a public channel joins it.
          join: !access.membership,
        }),
      );

      // Rules that watch chat run after the message is saved.
      await runMessageAutomations({
        db: ctx.db,
        organizationId: ctx.activeOrganization.id,
        message: {
          id: row.id,
          channelId: row.channelId,
          parentId: row.parentId,
          body: row.body,
          authorMemberId: row.authorMemberId,
        },
      });

      return (
        await hydrateMessages(ctx, [row], access.memberId, {
          withReplies: !row.parentId,
        })
      )[0]!;
    }),

  edit: chatProcedure("chat.post")
    .input(
      z.object({ messageId: uuid, body: z.string().trim().min(1).max(10_000) }),
    )
    .mutation(async ({ ctx, input }) => {
      const message = await loadMessage(ctx, input.messageId);
      const memberId = await currentMemberId(ctx);

      if (message.authorMemberId !== memberId || message.deletedAt) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only edit your own messages.",
        });
      }

      await ctx.db.transaction(async (tx) => {
        await tx
          .update(chatMessages)
          .set({ body: input.body, editedAt: new Date() })
          .where(eq(chatMessages.id, message.id));
        await syncMentions(tx, {
          organizationId: ctx.activeOrganization.id,
          memberId,
          source: { type: "message", id: message.id },
          text: input.body,
          via: "chat",
          mode: "replace",
        });
      });

      return { ok: true };
    }),

  remove: chatProcedure("chat.post", { also: ["chat.channels.manage"] })
    .input(z.object({ messageId: uuid }))
    .mutation(async ({ ctx, input }) => {
      const message = await loadMessage(ctx, input.messageId);
      const access = await channelAccess(ctx, message.channelId);

      if (message.authorMemberId !== access.memberId && !access.canManage) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only delete your own messages.",
        });
      }

      await ctx.db.transaction(async (tx) => {
        await tx
          .update(chatMessages)
          .set({ deletedAt: new Date(), pinnedAt: null })
          .where(eq(chatMessages.id, message.id));
        await syncMentions(tx, {
          organizationId: ctx.activeOrganization.id,
          memberId: access.memberId,
          source: { type: "message", id: message.id },
          text: "",
          via: "chat",
          mode: "replace",
        });
      });

      return { ok: true };
    }),

  /** Adds the reaction, or takes it back when it is already yours. */
  react: chatProcedure("chat.post")
    .input(z.object({ messageId: uuid, emoji: z.string().min(1).max(16) }))
    .mutation(async ({ ctx, input }) => {
      const message = await loadMessage(ctx, input.messageId);
      const access = await channelAccess(ctx, message.channelId);

      if (!access.canPost || message.deletedAt) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can't react here.",
        });
      }

      const removed = await ctx.db
        .delete(chatReactions)
        .where(
          and(
            eq(chatReactions.messageId, message.id),
            eq(chatReactions.memberId, access.memberId),
            eq(chatReactions.emoji, input.emoji),
          ),
        )
        .returning({ id: chatReactions.id });

      if (!removed.length) {
        await ctx.db
          .insert(chatReactions)
          .values({
            messageId: message.id,
            memberId: access.memberId,
            emoji: input.emoji,
          })
          .onConflictDoNothing();
      }

      return { reacted: !removed.length };
    }),

  pin: chatProcedure("chat.post")
    .input(z.object({ messageId: uuid, pinned: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const message = await loadMessage(ctx, input.messageId);
      const access = await channelAccess(ctx, message.channelId);

      if (!access.membership || message.deletedAt) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Join the channel to pin messages.",
        });
      }

      await ctx.db
        .update(chatMessages)
        .set({
          pinnedAt: input.pinned ? new Date() : null,
          pinnedByMemberId: input.pinned ? access.memberId : null,
        })
        .where(eq(chatMessages.id, message.id));

      return { ok: true };
    }),

  pins: chatProcedure("chat.view")
    .input(z.object({ channelId: uuid }))
    .query(async ({ ctx, input }) => {
      const access = await readableChannel(ctx, input.channelId);
      const rows = await ctx.db
        .select()
        .from(chatMessages)
        .where(
          and(
            eq(chatMessages.channelId, input.channelId),
            isNull(chatMessages.deletedAt),
            sql`${chatMessages.pinnedAt} is not null`,
          ),
        )
        .orderBy(desc(chatMessages.pinnedAt));

      return hydrateMessages(ctx, rows, access.memberId);
    }),

  /**
   * Messages matching words, across every conversation the caller may read,
   * narrowed by who wrote them, where, what they carry and when.
   */
  search: chatProcedure("chat.view")
    .input(
      z.object({
        q: z.string().trim().max(200),
        fromMemberId: uuid.optional(),
        channelId: uuid.optional(),
        has: z.enum(["file", "link", "task"]).optional(),
        after: z.coerce.date().optional(),
        before: z.coerce.date().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const memberId = await currentMemberId(ctx);
      const readable = await readableChannelIds(ctx, memberId);
      const channelIds = input.channelId
        ? readable.filter((id) => id === input.channelId)
        : readable;

      if (
        !channelIds.length ||
        (!input.q && !input.fromMemberId && !input.has)
      ) {
        return { results: [], total: 0 };
      }

      const words = input.q.split(/\s+/).filter(Boolean).slice(0, 8);
      const filters: Array<SQL | undefined> = [
        inArray(chatMessages.channelId, channelIds),
        isNull(chatMessages.deletedAt),
        ...words.map((word) =>
          ilike(chatMessages.body, `%${word.replace(/[%_\\]/g, "\\$&")}%`),
        ),
        input.fromMemberId
          ? eq(chatMessages.authorMemberId, input.fromMemberId)
          : undefined,
        input.after ? gte(chatMessages.createdAt, input.after) : undefined,
        input.before ? lte(chatMessages.createdAt, input.before) : undefined,
        input.has === "file"
          ? sql`exists (select 1 from ${chatAttachments} a where a."messageId" = ${chatMessages.id})`
          : input.has === "link"
            ? sql`${chatMessages.body} ~* 'https?://'`
            : input.has === "task"
              ? sql`${chatMessages.body} ~ '\\m[A-Z][A-Z0-9]{1,9}-[0-9]+\\M'`
              : undefined,
      ];
      const rows = await ctx.db
        .select()
        .from(chatMessages)
        .where(and(...filters))
        .orderBy(desc(chatMessages.createdAt))
        .limit(100);
      const channelRows = rows.length
        ? await ctx.db
            .select({
              id: chatChannels.id,
              name: chatChannels.name,
              kind: chatChannels.kind,
            })
            .from(chatChannels)
            .where(
              inArray(
                chatChannels.id,
                rows.map((row) => row.channelId),
              ),
            )
        : [];
      const views = await hydrateMessages(ctx, rows, memberId);

      return {
        total: rows.length,
        results: views.map((view) => {
          const channel = channelRows.find(
            (entry) => entry.id === view.channelId,
          );

          return {
            ...view,
            channel: {
              id: view.channelId,
              name: channel?.name ?? null,
              kind: (channel?.kind ?? "channel") as "channel" | "dm",
            },
          };
        }),
      };
    }),

  /** Messages that mention the caller, newest first, with unread marks. */
  mentions: chatProcedure("chat.view")
    .input(
      z
        .object({ unreadOnly: z.boolean().default(false) })
        .default({ unreadOnly: false }),
    )
    .query(async ({ ctx, input }) => {
      const memberId = await currentMemberId(ctx);
      const rows = await ctx.db
        .select({ message: chatMessages, lastReadAt: chatMembers.lastReadAt })
        .from(chatMessages)
        .innerJoin(
          chatMembers,
          and(
            eq(chatMembers.channelId, chatMessages.channelId),
            eq(chatMembers.memberId, memberId),
          ),
        )
        .where(
          and(
            eq(chatMessages.organizationId, ctx.activeOrganization.id),
            isNull(chatMessages.deletedAt),
            sql`${chatMessages.authorMemberId} is distinct from ${memberId}`,
            or(
              sql`${chatMessages.body} like ${`%<@${memberId}>%`}`,
              sql`${chatMessages.body} ~ '<!(channel|here)>'`,
            ),
            input.unreadOnly
              ? sql`${chatMessages.createdAt} > ${chatMembers.lastReadAt}`
              : undefined,
          ),
        )
        .orderBy(desc(chatMessages.createdAt))
        .limit(100);
      const views = await hydrateMessages(
        ctx,
        rows.map((row) => row.message),
        memberId,
      );
      const channelRows = rows.length
        ? await ctx.db
            .select({ id: chatChannels.id, name: chatChannels.name })
            .from(chatChannels)
            .where(
              inArray(
                chatChannels.id,
                rows.map((row) => row.message.channelId),
              ),
            )
        : [];

      return views.map((view, index) => ({
        ...view,
        unread: rows[index]!.message.createdAt > rows[index]!.lastReadAt,
        channelName:
          channelRows.find((entry) => entry.id === view.channelId)?.name ??
          null,
      }));
    }),

  /** Marks every conversation with an unread mention as read. */
  markMentionsRead: chatProcedure("chat.view").mutation(async ({ ctx }) => {
    const memberId = await currentMemberId(ctx);

    await ctx.db
      .update(chatMembers)
      .set({ lastReadAt: new Date() })
      .where(
        and(
          eq(chatMembers.memberId, memberId),
          sql`exists (select 1 from ${chatMessages} m where m."channelId" = ${chatMembers.channelId} and m."deletedAt" is null and m."createdAt" > ${chatMembers.lastReadAt} and (m.body like ${`%<@${memberId}>%`} or m.body ~ '<!(channel|here)>'))`,
        ),
      );

    return { ok: true };
  }),
};

export { plainBody };
