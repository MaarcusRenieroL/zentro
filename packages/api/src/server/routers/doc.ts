import { TRPCError } from "@trpc/server";
import {
  and,
  asc,
  desc,
  eq,
  ilike,
  isNotNull,
  isNull,
  or,
  sql,
} from "@zentro/db/drizzle";
import {
  docComments,
  docs,
  members,
  projects,
  teams,
  users,
  workLinks,
} from "@zentro/db/schema";

import {
  createDocCommentSchema,
  createDocSchema,
  deleteDocSchema,
  getDocCommentsSchema,
  getDocByIdSchema,
  getDocBySlugSchema,
  getDocsSchema,
  restoreDocSchema,
  resolveDocCommentSchema,
  searchDocsSchema,
  updateDocContentSchema,
  updateDocTitleSchema,
} from "../../types/zod-schema";
import type { TRPCContext } from "../../types";
import { hasRecentDocEdit, visibleDocsCondition } from "../access";
import { syncMentions } from "../mentions";
import { resolveTarget } from "./link";
import { buildChanges } from "@zentro/audit";
import { listProcedure, permissionProcedure, router } from "../trpc";
import {
  docByCommentId,
  docById,
  docBySlug,
  projectFromInput,
} from "../resources";
import { getCurrentMember } from "./task-helpers";

async function getDocForActiveOrganization({
  ctx,
  id,
}: {
  ctx: TRPCContext & {
    activeOrganization: NonNullable<TRPCContext["activeOrganization"]>;
  };
  id: string;
}) {
  const [doc] = await ctx.db
    .select({
      id: docs.id,
      title: docs.title,
      slug: docs.slug,
      projectId: docs.projectId,
      teamId: docs.teamId,
    })
    .from(docs)
    .where(
      and(
        eq(docs.id, id),
        eq(docs.organizationId, ctx.activeOrganization.id),
        isNull(docs.deletedAt),
      ),
    )
    .limit(1);

  if (!doc) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Doc not found.",
    });
  }

  return doc;
}

// A doc's text with Markdown marks and runs of whitespace taken out.
const plainContent = sql`regexp_replace(regexp_replace(${docs.content}, '[[][ xX][]]|[#>\`*_|]+|-{2,}', ' ', 'g'), '[[:space:]]+', ' ', 'g')`;

export const docsRouter = router({
  getAll: listProcedure("docs.view", "docs")
    .input(getDocsSchema)
    .query(async ({ ctx, input }) => {
      const { db, activeOrganization } = ctx;
      const conditions = [
        eq(docs.organizationId, activeOrganization.id),
        await visibleDocsCondition(ctx.permissions, "docs.view"),
      ];

      if (!input.includeDeleted) {
        conditions.push(isNull(docs.deletedAt));
      }

      if (input.projectId) {
        conditions.push(eq(docs.projectId, input.projectId));
      }

      if (input.teamId) {
        conditions.push(eq(docs.teamId, input.teamId));
      }

      const docsList = await db
        .select({
          id: docs.id,
          title: docs.title,
          slug: docs.slug,
          projectId: docs.projectId,
          projectName: projects.name,
          projectKey: projects.taskKeyPrefix,
          teamId: docs.teamId,
          teamName: teams.name,
          teamColor: teams.color,
          createdBy: users.name,
          createdByUserId: members.userId,
          // The opening words, without Markdown marks, for previews.
          excerpt: sql<string>`left(trim(${plainContent}), 180)`,
          deletedAt: docs.deletedAt,
          createdAt: docs.createdAt,
          updatedAt: docs.updatedAt,
        })
        .from(docs)
        .leftJoin(members, eq(members.id, docs.createdByMemberId))
        .leftJoin(users, eq(users.id, members.userId))
        .leftJoin(projects, eq(projects.id, docs.projectId))
        .leftJoin(teams, eq(teams.id, docs.teamId))
        .where(and(...conditions))
        .orderBy(desc(docs.updatedAt));

      return docsList;
    }),
  search: listProcedure("docs.search", "docs")
    .input(searchDocsSchema)
    .query(async ({ ctx, input }) => {
      const { db, activeOrganization } = ctx;
      const query = input.query.trim();
      const conditions = [
        eq(docs.organizationId, activeOrganization.id),
        await visibleDocsCondition(ctx.permissions, "docs.search"),
      ];

      if (!input.includeDeleted) {
        conditions.push(isNull(docs.deletedAt));
      }

      if (input.projectId) {
        conditions.push(eq(docs.projectId, input.projectId));
      }

      if (input.teamId) {
        conditions.push(eq(docs.teamId, input.teamId));
      }

      if (query) {
        const pattern = `%${query}%`;

        conditions.push(
          or(
            ilike(docs.title, pattern),
            ilike(docs.content, pattern),
            ilike(projects.name, pattern),
            ilike(teams.name, pattern),
            ilike(users.name, pattern),
          )!,
        );
      }

      return db
        .select({
          id: docs.id,
          title: docs.title,
          slug: docs.slug,
          projectId: docs.projectId,
          projectName: projects.name,
          teamId: docs.teamId,
          teamName: teams.name,
          teamColor: teams.color,
          createdBy: users.name,
          createdByUserId: members.userId,
          projectKey: projects.taskKeyPrefix,
          // About 160 characters of plain text around the first match.
          snippet: sql<string>`substr(${plainContent}, greatest(strpos(lower(${plainContent}), lower(${query})) - 50, 1), 160)`,
          deletedAt: docs.deletedAt,
          createdAt: docs.createdAt,
          updatedAt: docs.updatedAt,
        })
        .from(docs)
        .leftJoin(members, eq(members.id, docs.createdByMemberId))
        .leftJoin(users, eq(users.id, members.userId))
        .leftJoin(projects, eq(projects.id, docs.projectId))
        .leftJoin(teams, eq(teams.id, docs.teamId))
        .where(and(...conditions))
        .orderBy(desc(docs.updatedAt))
        .limit(50);
    }),
  getById: permissionProcedure("docs.view", docById("id"), {
    module: "docs",
  })
    .input(getDocByIdSchema)
    .query(async ({ ctx, input }) => {
      const { db, activeOrganization } = ctx;

      const [doc] = await db
        .select({
          id: docs.id,
          title: docs.title,
          content: docs.content,
          slug: docs.slug,
          projectId: docs.projectId,
          projectName: projects.name,
          teamId: docs.teamId,
          teamName: teams.name,
          teamColor: teams.color,
          createdByMemberId: docs.createdByMemberId,
          createdByUserId: members.userId,
          createdBy: users.name,
          deletedAt: docs.deletedAt,
          createdAt: docs.createdAt,
          updatedAt: docs.updatedAt,
        })
        .from(docs)
        .leftJoin(members, eq(members.id, docs.createdByMemberId))
        .leftJoin(users, eq(users.id, members.userId))
        .leftJoin(projects, eq(projects.id, docs.projectId))
        .leftJoin(teams, eq(teams.id, docs.teamId))
        .where(
          and(
            eq(docs.id, input.id),
            eq(docs.organizationId, activeOrganization.id),
            isNull(docs.deletedAt),
          ),
        )
        .limit(1);

      if (!doc) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Doc not found.",
        });
      }

      return doc;
    }),
  getBySlug: permissionProcedure("docs.view", docBySlug, {
    module: "docs",
  })
    .input(getDocBySlugSchema)
    .query(async ({ ctx, input }) => {
      const { db, activeOrganization } = ctx;

      const [doc] = await db
        .select({
          id: docs.id,
          title: docs.title,
          content: docs.content,
          slug: docs.slug,
          projectId: docs.projectId,
          projectName: projects.name,
          teamId: docs.teamId,
          teamName: teams.name,
          teamColor: teams.color,
          createdByMemberId: docs.createdByMemberId,
          createdByUserId: members.userId,
          createdBy: users.name,
          deletedAt: docs.deletedAt,
          createdAt: docs.createdAt,
          updatedAt: docs.updatedAt,
        })
        .from(docs)
        .leftJoin(members, eq(members.id, docs.createdByMemberId))
        .leftJoin(users, eq(users.id, members.userId))
        .leftJoin(projects, eq(projects.id, docs.projectId))
        .leftJoin(teams, eq(teams.id, docs.teamId))
        .where(
          and(
            eq(docs.slug, input.slug),
            eq(docs.organizationId, activeOrganization.id),
            isNull(docs.deletedAt),
          ),
        )
        .limit(1);

      if (!doc) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Doc not found.",
        });
      }

      return doc;
    }),
  create: permissionProcedure("docs.create", projectFromInput, {
    module: "docs",
    also: ["tasks.view"],
    audit: ["doc.created"],
  })
    .input(createDocSchema)
    .mutation(async ({ ctx, input }) => {
      const { db, user, activeOrganization } = ctx;
      // Written for a task: the task must be one the caller can see.
      const linkTask = input.linkTaskKey
        ? await resolveTarget(ctx, { type: "task", key: input.linkTaskKey })
        : null;

      return db.transaction(async (tx) => {
        const [member] = await tx
          .select({ id: members.id })
          .from(members)
          .where(
            and(
              eq(members.userId, user.id),
              eq(members.organizationId, activeOrganization.id),
            ),
          )
          .limit(1);

        if (!member) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Member not found in active organization",
          });
        }

        let teamId = input.teamId ?? null;

        if (input.projectId) {
          const [project] = await tx
            .select({
              id: projects.id,
              teamId: projects.teamId,
            })
            .from(projects)
            .where(
              and(
                eq(projects.id, input.projectId),
                eq(projects.organizationId, activeOrganization.id),
              ),
            )
            .limit(1);

          if (!project) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Project not found",
            });
          }

          teamId = project.teamId;
        } else if (teamId) {
          const [team] = await tx
            .select({ id: teams.id })
            .from(teams)
            .where(
              and(
                eq(teams.id, teamId),
                eq(teams.organizationId, activeOrganization.id),
              ),
            )
            .limit(1);

          if (!team) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Team not found",
            });
          }

          teamId = team.id;
        }

        const [doc] = await tx
          .insert(docs)
          .values({
            title: input.title,
            content: input.content,
            organizationId: activeOrganization.id,
            projectId: input.projectId,
            teamId,
            createdByMemberId: member.id,
            slug: input.slug,
          })
          .returning();

        if (!doc) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create doc.",
          });
        }

        await ctx.audit.record(tx, {
          action: "doc.created",
          target: { id: doc.id, label: doc.title },
          projectId: doc.projectId,
          teamId: doc.teamId,
          metadata: {
            slug: doc.slug,
            ...(linkTask ? { linkedTo: linkTask.label } : {}),
          },
        });

        if (linkTask) {
          await tx.insert(workLinks).values({
            organizationId: activeOrganization.id,
            sourceType: "doc",
            sourceId: doc.id,
            targetType: "task",
            targetId: linkTask.id,
            kind: "relates",
            createdByMemberId: member.id,
          });
        }

        await syncMentions(tx, {
          organizationId: activeOrganization.id,
          memberId: member.id,
          source: { type: "doc", id: doc.id },
          text: doc.content,
          via: "content",
          mode: "replace",
        });

        return doc;
      });
    }),
  updateDocTitle: permissionProcedure("docs.update_own", docById("id"), {
    module: "docs",
    audit: ["doc.updated"],
  })
    .input(updateDocTitleSchema)
    .mutation(async ({ ctx, input }) => {
      const { db, user, activeOrganization } = ctx;
      const { id, title } = input;

      return db.transaction(async (tx) => {
        const [previous] = await tx
          .select({ title: docs.title })
          .from(docs)
          .where(
            and(
              eq(docs.id, id),
              eq(docs.organizationId, activeOrganization.id),
              isNull(docs.deletedAt),
            ),
          )
          .limit(1);

        const [updatedDoc] = await tx
          .update(docs)
          .set({
            title,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(docs.id, id),
              eq(docs.organizationId, activeOrganization.id),
              isNull(docs.deletedAt),
            ),
          )
          .returning();

        if (!updatedDoc) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Doc not found.",
          });
        }

        if (
          await hasRecentDocEdit(tx, {
            organizationId: activeOrganization.id,
            docId: updatedDoc.id,
            userId: user.id,
          })
        ) {
          ctx.audit.skipped("doc.updated");
        } else {
          await ctx.audit.record(tx, {
            action: "doc.updated",
            target: { id: updatedDoc.id, label: updatedDoc.title },
            projectId: updatedDoc.projectId,
            teamId: updatedDoc.teamId,
            metadata: { slug: updatedDoc.slug },
            changes: buildChanges(
              { title: previous?.title },
              { title: updatedDoc.title },
            ),
          });
        }

        return updatedDoc;
      });
    }),
  updateDocContent: permissionProcedure("docs.update_own", docById("id"), {
    module: "docs",
    audit: ["doc.updated"],
  })
    .input(updateDocContentSchema)
    .mutation(async ({ ctx, input }) => {
      const { db, user, activeOrganization } = ctx;
      const { id, content } = input;
      const member = await getCurrentMember(ctx);

      return db.transaction(async (tx) => {
        const [updatedDoc] = await tx
          .update(docs)
          .set({
            content,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(docs.id, id),
              eq(docs.organizationId, activeOrganization.id),
              isNull(docs.deletedAt),
            ),
          )
          .returning();

        if (!updatedDoc) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Doc not found.",
          });
        }

        if (
          await hasRecentDocEdit(tx, {
            organizationId: activeOrganization.id,
            docId: updatedDoc.id,
            userId: user.id,
          })
        ) {
          ctx.audit.skipped("doc.updated");
        } else {
          await ctx.audit.record(tx, {
            action: "doc.updated",
            target: { id: updatedDoc.id, label: updatedDoc.title },
            projectId: updatedDoc.projectId,
            teamId: updatedDoc.teamId,
            metadata: { slug: updatedDoc.slug, fields: ["content"] },
          });
        }

        // Task keys named in the doc link the doc to those tasks.
        await syncMentions(tx, {
          organizationId: activeOrganization.id,
          memberId: member.id,
          source: { type: "doc", id: updatedDoc.id },
          text: content,
          via: "content",
          mode: "replace",
        });

        return updatedDoc;
      });
    }),
  delete: permissionProcedure("docs.trash_own", docById("id"), {
    module: "docs",
    audit: ["doc.trashed"],
  })
    .input(deleteDocSchema)
    .mutation(async ({ ctx, input }) => {
      const { db, activeOrganization } = ctx;
      const { id } = input;

      return db.transaction(async (tx) => {
        const [deletedDoc] = await tx
          .update(docs)
          .set({
            deletedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(docs.organizationId, activeOrganization.id),
              eq(docs.id, id),
              isNull(docs.deletedAt),
            ),
          )
          .returning({
            id: docs.id,
            slug: docs.slug,
            title: docs.title,
            projectId: docs.projectId,
            teamId: docs.teamId,
          });

        if (!deletedDoc) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Doc not found",
          });
        }

        await ctx.audit.record(tx, {
          action: "doc.trashed",
          target: { id: deletedDoc.id, label: deletedDoc.title },
          projectId: deletedDoc.projectId,
          teamId: deletedDoc.teamId,
          metadata: { slug: deletedDoc.slug },
        });

        return { id: deletedDoc.id, slug: deletedDoc.slug };
      });
    }),
  restore: permissionProcedure("docs.restore", docById("id"), {
    module: "docs",
    audit: ["doc.restored"],
  })
    .input(restoreDocSchema)
    .mutation(async ({ ctx, input }) => {
      const { db, activeOrganization } = ctx;
      const { id } = input;

      return db.transaction(async (tx) => {
        const [restoredDoc] = await tx
          .update(docs)
          .set({
            deletedAt: null,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(docs.organizationId, activeOrganization.id),
              eq(docs.id, id),
              isNotNull(docs.deletedAt),
            ),
          )
          .returning({
            id: docs.id,
            slug: docs.slug,
            title: docs.title,
            projectId: docs.projectId,
            teamId: docs.teamId,
          });

        if (!restoredDoc) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Doc not found",
          });
        }

        await ctx.audit.record(tx, {
          action: "doc.restored",
          target: { id: restoredDoc.id, label: restoredDoc.title },
          projectId: restoredDoc.projectId,
          teamId: restoredDoc.teamId,
          metadata: { slug: restoredDoc.slug },
        });

        return { id: restoredDoc.id, slug: restoredDoc.slug };
      });
    }),
  getComments: permissionProcedure("docs.view", docById("docId"), {
    module: "docs",
  })
    .input(getDocCommentsSchema)
    .query(async ({ ctx, input }) => {
      const { db, activeOrganization } = ctx;
      const doc = await getDocForActiveOrganization({ ctx, id: input.docId });

      return db
        .select({
          id: docComments.id,
          body: docComments.body,
          authorMemberId: docComments.authorMemberId,
          authorName: users.name,
          authorEmail: users.email,
          authorImage: users.image,
          resolvedAt: docComments.resolvedAt,
          createdAt: docComments.createdAt,
          updatedAt: docComments.updatedAt,
        })
        .from(docComments)
        .leftJoin(members, eq(members.id, docComments.authorMemberId))
        .leftJoin(users, eq(users.id, members.userId))
        .where(
          and(
            eq(docComments.organizationId, activeOrganization.id),
            eq(docComments.docId, doc.id),
            isNull(docComments.deletedAt),
          ),
        )
        .orderBy(asc(docComments.createdAt));
    }),
  createComment: permissionProcedure("docs.comment", docById("docId"), {
    module: "docs",
    audit: ["doc.comment_added"],
  })
    .input(createDocCommentSchema)
    .mutation(async ({ ctx, input }) => {
      const { db, activeOrganization } = ctx;
      const doc = await getDocForActiveOrganization({ ctx, id: input.docId });
      const member = await getCurrentMember(ctx);

      const comment = await db.transaction(async (tx) => {
        const [row] = await tx
          .insert(docComments)
          .values({
            organizationId: activeOrganization.id,
            docId: doc.id,
            authorMemberId: member.id,
            body: input.body,
          })
          .returning();

        if (!row) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create comment.",
          });
        }

        await ctx.audit.record(tx, {
          action: "doc.comment_added",
          target: { id: doc.id, label: doc.title },
          projectId: doc.projectId,
          teamId: doc.teamId,
          metadata: { commentId: row.id, slug: doc.slug },
        });
        await syncMentions(tx, {
          organizationId: activeOrganization.id,
          memberId: member.id,
          source: { type: "doc", id: doc.id },
          text: input.body,
          via: "comment",
          mode: "append",
        });

        return row;
      });

      return comment;
    }),
  resolveComment: permissionProcedure("docs.comment", docByCommentId(), {
    module: "docs",
    audit: ["doc.comment_resolved"],
  })
    .input(resolveDocCommentSchema)
    .mutation(async ({ ctx, input }) => {
      const { db, activeOrganization } = ctx;

      return db.transaction(async (tx) => {
        const [comment] = await tx
          .update(docComments)
          .set({
            resolvedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(docComments.id, input.id),
              eq(docComments.organizationId, activeOrganization.id),
              isNull(docComments.deletedAt),
              isNull(docComments.resolvedAt),
            ),
          )
          .returning();

        if (!comment) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Comment not found.",
          });
        }

        const [doc] = await tx
          .select({
            id: docs.id,
            title: docs.title,
            slug: docs.slug,
            projectId: docs.projectId,
            teamId: docs.teamId,
          })
          .from(docs)
          .where(eq(docs.id, comment.docId))
          .limit(1);

        await ctx.audit.record(tx, {
          action: "doc.comment_resolved",
          target: { id: comment.docId, label: doc?.title },
          projectId: doc?.projectId,
          teamId: doc?.teamId,
          metadata: { commentId: comment.id, slug: doc?.slug },
        });

        return comment;
      });
    }),
});
