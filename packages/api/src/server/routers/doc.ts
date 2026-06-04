import { TRPCError } from "@trpc/server";
import { and, desc, eq, isNotNull, isNull } from "@zentro/db/drizzle";
import { docs, members, projects, users } from "@zentro/db/schema";

import {
  createDocSchema,
  deleteDocSchema,
  getDocByIdSchema,
  getDocsSchema,
  restoreDocSchema,
  updateDocContentSchema,
  updateDocTitleSchema,
} from "../../types/zod-schema";
import { organizationProcedure, protectedProcedure, router } from "../trpc";

export const docsRouter = router({
  getAll: protectedProcedure
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

      const docsList = await db
        .select({
          id: docs.id,
          title: docs.title,
          slug: docs.slug,
          projectId: docs.projectId,
          createdBy: users.name,
          deletedAt: docs.deletedAt,
          createdAt: docs.createdAt,
          updatedAt: docs.updatedAt,
        })
        .from(docs)
        .leftJoin(members, eq(members.id, docs.createdByMemberId))
        .leftJoin(users, eq(users.id, members.userId))
        .where(and(...conditions))
        .orderBy(desc(docs.updatedAt));

      return docsList;
    }),
  getById: protectedProcedure
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
          createdByMemberId: docs.createdByMemberId,
          createdBy: users.name,
          deletedAt: docs.deletedAt,
          createdAt: docs.createdAt,
          updatedAt: docs.updatedAt,
        })
        .from(docs)
        .leftJoin(members, eq(members.id, docs.createdByMemberId))
        .leftJoin(users, eq(users.id, members.userId))
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
  create: organizationProcedure
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

        if (input.projectId) {
          const [project] = await tx
            .select({
              id: projects.id,
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
        }

        const [doc] = await tx
          .insert(docs)
          .values({
            title: input.title,
            content: input.content,
            organizationId: activeOrganization.id,
            projectId: input.projectId,
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
  updateDocTitle: organizationProcedure
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
  updateDocContent: organizationProcedure
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
  delete: organizationProcedure
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
  restore: organizationProcedure
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
});
