import { TRPCError } from "@trpc/server";
import {
  and,
  asc,
  desc,
  eq,
  ilike,
  inArray,
  isNull,
  or,
  sql,
} from "@zentro/db/drizzle";
import {
  chatAttachments,
  chatChannels,
  chatMembers,
  chatMessages,
  docs,
  files,
  projects,
  tasks,
} from "@zentro/db/schema";
import { z } from "zod";

import { visibleDocsCondition } from "../access";
import {
  currentMemberId,
  memberProfiles,
  normalizeChannelName,
  readableChannelIds,
} from "../chat";
import { loadProjectById } from "../resources";
import {
  denialFor,
  permissionProcedure,
  type OrganizationContext,
} from "../trpc";

const uuid = z.string().uuid();
const itemType = z.enum(["task", "doc", "project"]);

type Item = {
  type: "task" | "doc" | "project";
  id: string;
  /** A short, name-safe label for the channel. */
  slug: string;
  title: string;
  href: string;
};

const chatProcedure = (
  permission: string,
  options: { also?: string[]; audit?: string[] } = {},
) => permissionProcedure(permission, undefined, { module: "chat", ...options });

/** The item, if the caller may open it; otherwise a not-found error. */
async function viewableItem(
  ctx: OrganizationContext,
  type: Item["type"],
  id: string,
): Promise<Item> {
  const orgId = ctx.activeOrganization.id;
  const missing = new TRPCError({
    code: "NOT_FOUND",
    message: "That item was not found.",
  });

  if (type === "task") {
    const [task] = await ctx.db
      .select({
        id: tasks.id,
        key: tasks.key,
        name: tasks.name,
        projectId: tasks.projectId,
        teamId: tasks.teamId,
      })
      .from(tasks)
      .where(
        and(
          eq(tasks.id, id),
          eq(tasks.organizationId, orgId),
          isNull(tasks.deletedAt),
        ),
      )
      .limit(1);

    if (!task) throw missing;

    const decision = await ctx.permissions.check("tasks.view", {
      project: (await loadProjectById(ctx, task.projectId)) ?? null,
      teamId: task.teamId,
    });

    if (!decision.allowed) throw denialFor(decision);

    return {
      type,
      id: task.id,
      slug: `task-${task.key}`,
      title: task.name,
      href: `/tasks/${task.key}`,
    };
  }

  if (type === "doc") {
    const [doc] = await ctx.db
      .select({ id: docs.id, slug: docs.slug, title: docs.title })
      .from(docs)
      .where(
        and(
          eq(docs.id, id),
          eq(docs.organizationId, orgId),
          isNull(docs.deletedAt),
          await visibleDocsCondition(ctx.permissions, "docs.view"),
        ),
      )
      .limit(1);

    if (!doc) throw missing;

    return {
      type,
      id: doc.id,
      slug: `doc-${doc.slug}`,
      title: doc.title || "Untitled",
      href: `/docs/${doc.slug}`,
    };
  }

  const project = await loadProjectById(ctx, id);

  if (!project) throw missing;

  const decision = await ctx.permissions.check("projects.view", { project });

  if (!decision.allowed) throw denialFor(decision);

  const [row] = await ctx.db
    .select({ id: projects.id, slug: projects.slug, name: projects.name })
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.organizationId, orgId)))
    .limit(1);

  if (!row) throw missing;

  return {
    type,
    id: row.id,
    slug: `project-${row.slug}`,
    title: row.name,
    href: `/projects/${row.slug}`,
  };
}

/** The id behind a task key or a doc or project slug. */
async function itemIdFromRef(
  ctx: OrganizationContext,
  type: Item["type"],
  ref: string,
) {
  const orgId = ctx.activeOrganization.id;
  const [row] =
    type === "task"
      ? await ctx.db
          .select({ id: tasks.id })
          .from(tasks)
          .where(and(eq(tasks.organizationId, orgId), eq(tasks.key, ref)))
          .limit(1)
      : type === "doc"
        ? await ctx.db
            .select({ id: docs.id })
            .from(docs)
            .where(and(eq(docs.organizationId, orgId), eq(docs.slug, ref)))
            .limit(1)
        : await ctx.db
            .select({ id: projects.id })
            .from(projects)
            .where(
              and(eq(projects.organizationId, orgId), eq(projects.slug, ref)),
            )
            .limit(1);

  if (!row) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "That item was not found.",
    });
  }

  return row.id;
}

async function discussionChannel(ctx: OrganizationContext, item: Item) {
  const [existing] = await ctx.db
    .select()
    .from(chatChannels)
    .where(
      and(
        eq(chatChannels.organizationId, ctx.activeOrganization.id),
        eq(chatChannels.linkType, item.type),
        eq(chatChannels.linkId, item.id),
        eq(chatChannels.kind, "channel"),
      ),
    )
    .orderBy(asc(chatChannels.createdAt))
    .limit(1);

  return existing ?? null;
}

export const chatLinkProcedures = {
  /** Tasks, docs and projects matching a few typed letters, to link in chat. */
  linkSearch: chatProcedure("chat.view")
    .input(z.object({ q: z.string().trim().max(60) }))
    .query(async ({ ctx, input }) => {
      const needle = `%${input.q.replace(/[%_\\]/g, "\\$&")}%`;
      const enabled = await ctx.enabledModules();
      const orgId = ctx.activeOrganization.id;
      const viewable = enabled.has("tasks")
        ? await ctx.permissions.viewableProjectIds("tasks.view")
        : [];
      const projectIds = enabled.has("projects")
        ? await ctx.permissions.viewableProjectIds("projects.view")
        : [];
      const [taskRows, docRows, projectRows] = await Promise.all([
        viewable.length
          ? ctx.db
              .select({
                key: tasks.key,
                name: tasks.name,
                status: tasks.status,
              })
              .from(tasks)
              .where(
                and(
                  eq(tasks.organizationId, orgId),
                  inArray(tasks.projectId, viewable),
                  isNull(tasks.deletedAt),
                  input.q
                    ? or(ilike(tasks.name, needle), ilike(tasks.key, needle))
                    : undefined,
                ),
              )
              .orderBy(desc(tasks.updatedAt))
              .limit(5)
          : [],
        enabled.has("docs")
          ? ctx.db
              .select({ slug: docs.slug, title: docs.title })
              .from(docs)
              .where(
                and(
                  eq(docs.organizationId, orgId),
                  isNull(docs.deletedAt),
                  await visibleDocsCondition(ctx.permissions, "docs.view"),
                  input.q ? ilike(docs.title, needle) : undefined,
                ),
              )
              .orderBy(desc(docs.updatedAt))
              .limit(5)
          : [],
        projectIds.length
          ? ctx.db
              .select({ slug: projects.slug, name: projects.name })
              .from(projects)
              .where(
                and(
                  eq(projects.organizationId, orgId),
                  inArray(projects.id, projectIds),
                  isNull(projects.deletedAt),
                  input.q ? ilike(projects.name, needle) : undefined,
                ),
              )
              .orderBy(asc(projects.name))
              .limit(4)
          : [],
      ]);

      return {
        tasks: taskRows,
        docs: docRows.map((doc) => ({
          title: doc.title || "Untitled",
          slug: doc.slug,
        })),
        projects: projectRows,
      };
    }),

  /**
   * The conversation about a task, doc or project, made on first use. It is
   * private to people who can open the item: anyone who can see the item and
   * opens its discussion is added.
   */
  discuss: chatProcedure("chat.post", {
    audit: ["chat.channel_created", "chat.member_added"],
  })
    .input(
      z
        .object({
          type: itemType,
          id: uuid.optional(),
          /** A task key or a doc or project slug, from an address. */
          ref: z.string().trim().min(1).max(120).optional(),
        })
        .refine((value) => value.id || value.ref, "Say which item."),
    )
    .mutation(async ({ ctx, input }) => {
      const id = input.id ?? (await itemIdFromRef(ctx, input.type, input.ref!));
      const item = await viewableItem(ctx, input.type, id);
      const memberId = await currentMemberId(ctx);
      let channel = await discussionChannel(ctx, item);
      let created = false;

      if (!channel) {
        const base = normalizeChannelName(item.slug) || "discussion";
        let name = base;

        for (let attempt = 2; attempt < 6; attempt += 1) {
          const [taken] = await ctx.db
            .select({ id: chatChannels.id })
            .from(chatChannels)
            .where(
              and(
                eq(chatChannels.organizationId, ctx.activeOrganization.id),
                eq(chatChannels.name, name),
              ),
            )
            .limit(1);

          if (!taken) break;

          name = `${base.slice(0, 76)}-${attempt}`;
        }

        const [row] = await ctx.db
          .insert(chatChannels)
          .values({
            organizationId: ctx.activeOrganization.id,
            kind: "channel",
            name,
            topic: item.title.slice(0, 250),
            visibility: "private",
            linkType: item.type,
            linkId: item.id,
            createdByMemberId: memberId,
          })
          .onConflictDoNothing()
          .returning();

        channel = row ?? (await discussionChannel(ctx, item));
        created = Boolean(row);

        if (row) {
          await ctx.audit.record(ctx.db, {
            action: "chat.channel_created",
            target: { id: row.id, label: `#${row.name}` },
            metadata: { visibility: "private", link: item.type },
          });
        }
      }

      if (!created) ctx.audit.skipped("chat.channel_created");

      if (!channel) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not open the discussion.",
        });
      }

      const joined = await ctx.db
        .insert(chatMembers)
        .values({
          channelId: channel.id,
          memberId,
          role: created ? "admin" : "member",
        })
        .onConflictDoNothing()
        .returning({ id: chatMembers.id });

      if (joined.length && !created) {
        await ctx.audit.record(ctx.db, {
          action: "chat.member_added",
          target: { id: channel.id, label: `#${channel.name}` },
          metadata: { count: 1 },
        });
      } else {
        ctx.audit.skipped("chat.member_added");
      }

      return {
        channelId: channel.id,
        name: channel.name ?? "",
        created,
      };
    }),

  /** What the discussion panel on an item shows, without creating anything. */
  discussion: chatProcedure("chat.view")
    .input(z.object({ type: itemType, id: uuid }))
    .query(async ({ ctx, input }) => {
      const item = await viewableItem(ctx, input.type, input.id);
      const memberId = await currentMemberId(ctx);
      const channel = await discussionChannel(ctx, item);

      if (!channel) {
        return { exists: false as const, title: item.title };
      }

      const [counts] = await ctx.db
        .select({
          messages: sql<number>`count(*)`.mapWith(Number),
          lastAt: sql<Date | null>`max(${chatMessages.createdAt})`.mapWith(
            chatMessages.createdAt,
          ),
        })
        .from(chatMessages)
        .where(
          and(
            eq(chatMessages.channelId, channel.id),
            isNull(chatMessages.deletedAt),
          ),
        );
      const [mine] = await ctx.db
        .select({ lastReadAt: chatMembers.lastReadAt })
        .from(chatMembers)
        .where(
          and(
            eq(chatMembers.channelId, channel.id),
            eq(chatMembers.memberId, memberId),
          ),
        )
        .limit(1);
      const [unread] = mine
        ? await ctx.db
            .select({ count: sql<number>`count(*)`.mapWith(Number) })
            .from(chatMessages)
            .where(
              and(
                eq(chatMessages.channelId, channel.id),
                isNull(chatMessages.deletedAt),
                sql`${chatMessages.createdAt} > ${mine.lastReadAt}`,
                sql`${chatMessages.authorMemberId} is distinct from ${memberId}`,
              ),
            )
        : [{ count: 0 }];
      const people = await ctx.db
        .select({ memberId: chatMembers.memberId })
        .from(chatMembers)
        .where(eq(chatMembers.channelId, channel.id))
        .limit(6);
      const profiles = await memberProfiles(
        ctx,
        people.map((row) => row.memberId),
      );
      const shared = await ctx.db
        .select({
          id: files.id,
          name: files.name,
          mimeType: files.mimeType,
          size: files.size,
        })
        .from(chatAttachments)
        .innerJoin(chatMessages, eq(chatMessages.id, chatAttachments.messageId))
        .innerJoin(files, eq(files.id, chatAttachments.fileId))
        .where(
          and(
            eq(chatMessages.channelId, channel.id),
            isNull(chatMessages.deletedAt),
            isNull(files.deletedAt),
          ),
        )
        .orderBy(desc(chatMessages.createdAt))
        .limit(6);

      return {
        exists: true as const,
        title: item.title,
        channelId: channel.id,
        name: channel.name ?? "",
        joined: Boolean(mine),
        messages: counts?.messages ?? 0,
        lastAt: counts?.lastAt ?? null,
        unread: unread?.count ?? 0,
        people: people
          .map((row) => profiles.get(row.memberId)?.name)
          .filter((name): name is string => Boolean(name)),
        files: shared.map((file) => ({
          ...file,
          url: `/api/files/${file.id}`,
        })),
      };
    }),

  /** Where a file has been shared in chat, for the file's own page. */
  fileDiscussions: chatProcedure("chat.view")
    .input(z.object({ fileId: uuid }))
    .query(async ({ ctx, input }) => {
      const memberId = await currentMemberId(ctx);
      const readable = await readableChannelIds(ctx, memberId);

      if (!readable.length) return [];

      const rows = await ctx.db
        .select({
          messageId: chatMessages.id,
          channelId: chatChannels.id,
          channelName: chatChannels.name,
          kind: chatChannels.kind,
          at: chatMessages.createdAt,
        })
        .from(chatAttachments)
        .innerJoin(chatMessages, eq(chatMessages.id, chatAttachments.messageId))
        .innerJoin(chatChannels, eq(chatChannels.id, chatMessages.channelId))
        .where(
          and(
            eq(chatAttachments.fileId, input.fileId),
            inArray(chatMessages.channelId, readable),
            isNull(chatMessages.deletedAt),
          ),
        )
        .orderBy(desc(chatMessages.createdAt))
        .limit(20);

      return rows.map((row) => ({
        ...row,
        kind: row.kind as "channel" | "dm",
      }));
    }),

  /** Tasks with the most chat around them, for the overview. */
  mostDiscussed: chatProcedure("chat.view", { also: ["tasks.view"] }).query(
    async ({ ctx }) => {
      const memberId = await currentMemberId(ctx);
      const readable = await readableChannelIds(ctx, memberId);
      const viewable = await ctx.permissions.viewableProjectIds("tasks.view");

      if (!readable.length || !viewable.length) return [];

      const rows = await ctx.db.execute(sql`
        select t."key", t."name", t."status", count(distinct m.id)::int as messages
        from "workLink" l
        join "chatMessage" m on m.id = l."sourceId" and l."sourceType" = 'message'
        join "task" t on t.id = l."targetId" and l."targetType" = 'task'
        where l."organizationId" = ${ctx.activeOrganization.id}
          and m."deletedAt" is null
          and m."createdAt" > now() - interval '30 days'
          and m."channelId" in (${sql.join(
            readable.map((id) => sql`${id}`),
            sql`, `,
          )})
          and t."projectId" in (${sql.join(
            viewable.map((id) => sql`${id}`),
            sql`, `,
          )})
          and t."deletedAt" is null
        group by t."key", t."name", t."status"
        order by messages desc
        limit 5
      `);

      return (
        rows as unknown as {
          rows: Array<{
            key: string;
            name: string;
            status: string;
            messages: number;
          }>;
        }
      ).rows;
    },
  ),
};
