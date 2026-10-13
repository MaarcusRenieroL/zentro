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
} from "@zentro/db/drizzle";
import {
  docComments,
  docs,
  members,
  projects,
  teams,
  users,
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
import { authorizedModuleProcedure, moduleProcedure, router } from "../trpc";
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
    .select({ id: docs.id })
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

export const docsRouter = router({
  getAll: moduleProcedure("docs")
    .input(getDocsSchema)
    .query(async ({ ctx, input }) => {
      const { db, activeOrganization } = ctx;
      const conditions = [eq(docs.organizationId, activeOrganization.id)];

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
          teamId: docs.teamId,
          teamName: teams.name,
          teamColor: teams.color,
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
        .where(and(...conditions))
        .orderBy(desc(docs.updatedAt));

      return docsList;
    }),
  search: moduleProcedure("docs")
    .input(searchDocsSchema)
    .query(async ({ ctx, input }) => {
      const { db, activeOrganization } = ctx;
      const query = input.query.trim();
      const conditions = [eq(docs.organizationId, activeOrganization.id)];

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
  getById: moduleProcedure("docs")
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
  getBySlug: moduleProcedure("docs")
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
  create: authorizedModuleProcedure("docs", { doc: ["create"] })
    .input(createDocSchema)
    .mutation(async ({ ctx, input }) => {
      const { db, user, activeOrganization } = ctx;

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

        return doc;
      });
    }),
  updateDocTitle: authorizedModuleProcedure("docs", { doc: ["update"] })
    .input(updateDocTitleSchema)
    .mutation(async ({ ctx, input }) => {
      const { db, activeOrganization } = ctx;
      const { id, title } = input;

      const [updatedDoc] = await db
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

      return updatedDoc;
    }),
  updateDocContent: authorizedModuleProcedure("docs", { doc: ["update"] })
    .input(updateDocContentSchema)
    .mutation(async ({ ctx, input }) => {
      const { db, activeOrganization } = ctx;
      const { id, content } = input;

      const [updatedDoc] = await db
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

      return updatedDoc;
    }),
  delete: authorizedModuleProcedure("docs", { doc: ["delete"] })
    .input(deleteDocSchema)
    .mutation(async ({ ctx, input }) => {
      const { db, activeOrganization } = ctx;
      const { id } = input;

      const [deletedDoc] = await db
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
        .returning({ id: docs.id, slug: docs.slug });

      if (!deletedDoc) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Doc not found",
        });
      }

      return deletedDoc;
    }),
  restore: authorizedModuleProcedure("docs", { doc: ["restore"] })
    .input(restoreDocSchema)
    .mutation(async ({ ctx, input }) => {
      const { db, activeOrganization } = ctx;
      const { id } = input;

      const [restoredDoc] = await db
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
        .returning({ id: docs.id, slug: docs.slug });

      if (!restoredDoc) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Doc not found",
        });
      }

      return restoredDoc;
    }),
  getComments: moduleProcedure("docs")
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
  createComment: authorizedModuleProcedure("docs", { doc: ["comment"] })
    .input(createDocCommentSchema)
    .mutation(async ({ ctx, input }) => {
      const { db, activeOrganization } = ctx;
      const doc = await getDocForActiveOrganization({ ctx, id: input.docId });
      const member = await getCurrentMember(ctx);

      const [comment] = await db
        .insert(docComments)
        .values({
          organizationId: activeOrganization.id,
          docId: doc.id,
          authorMemberId: member.id,
          body: input.body,
        })
        .returning();

      if (!comment) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create comment.",
        });
      }

      return comment;
    }),
  resolveComment: authorizedModuleProcedure("docs", { doc: ["comment"] })
    .input(resolveDocCommentSchema)
    .mutation(async ({ ctx, input }) => {
      const { db, activeOrganization } = ctx;

      const [comment] = await db
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

      return comment;
    }),
});
