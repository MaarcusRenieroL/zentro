import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "@zentro/db/drizzle";
import { members, users, whiteboards } from "@zentro/db/schema";
import { z } from "zod";

import { currentMemberId } from "../chat";
import { permissionProcedure, router, type OrganizationContext } from "../trpc";

const uuid = z.string().uuid();

const procedure = (permission: string, audit?: string[], also?: string[]) =>
  permissionProcedure(permission, undefined, {
    module: "whiteboards",
    audit,
    also,
  });

const num = z.number().finite().min(-1e6).max(1e6);

/** One shape on the canvas. Points are flat [x, y, x, y, …] pairs. */
export const boardElement = z.object({
  id: z.string().min(1).max(40),
  type: z.enum(["pen", "rect", "ellipse", "line", "arrow", "text", "sticky"]),
  x: num,
  y: num,
  w: num.default(0),
  h: num.default(0),
  points: z.array(num).max(6000).optional(),
  color: z.string().max(20).default("#1f2937"),
  text: z.string().max(2000).optional(),
});

const title = z.string().trim().min(1, "Give the board a title.").max(120);

async function manageable(ctx: OrganizationContext, id: string) {
  const memberId = await currentMemberId(ctx);
  const [board] = await ctx.db
    .select({
      id: whiteboards.id,
      title: whiteboards.title,
      createdByMemberId: whiteboards.createdByMemberId,
    })
    .from(whiteboards)
    .where(
      and(
        eq(whiteboards.id, id),
        eq(whiteboards.organizationId, ctx.activeOrganization.id),
      ),
    )
    .limit(1);

  if (!board) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Board not found." });
  }

  const allowed =
    (await ctx.permissions.can("whiteboards.delete_any")) ||
    (board.createdByMemberId === memberId &&
      (await ctx.permissions.can("whiteboards.delete_own")));

  if (!allowed) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You can only change boards you created.",
    });
  }

  return board;
}

export const whiteboardRouter = router({
  list: procedure("whiteboards.view", undefined, [
    "whiteboards.delete_own",
    "whiteboards.delete_any",
  ]).query(async ({ ctx }) => {
    const memberId = await currentMemberId(ctx);
    const any = await ctx.permissions.can("whiteboards.delete_any");
    const own = await ctx.permissions.can("whiteboards.delete_own");

    const rows = await ctx.db
      .select({
        id: whiteboards.id,
        title: whiteboards.title,
        updatedAt: whiteboards.updatedAt,
        createdByMemberId: whiteboards.createdByMemberId,
        creator: users.name,
      })
      .from(whiteboards)
      .leftJoin(members, eq(members.id, whiteboards.createdByMemberId))
      .leftJoin(users, eq(users.id, members.userId))
      .where(eq(whiteboards.organizationId, ctx.activeOrganization.id))
      .orderBy(desc(whiteboards.updatedAt))
      .limit(200);

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      updatedAt: row.updatedAt.toISOString(),
      createdBy: row.creator ?? null,
      canManage: any || (own && row.createdByMemberId === memberId),
    }));
  }),

  get: procedure("whiteboards.view")
    .input(z.object({ id: uuid }))
    .query(async ({ ctx, input }) => {
      const [board] = await ctx.db
        .select()
        .from(whiteboards)
        .where(
          and(
            eq(whiteboards.id, input.id),
            eq(whiteboards.organizationId, ctx.activeOrganization.id),
          ),
        )
        .limit(1);

      if (!board) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Board not found." });
      }

      return {
        id: board.id,
        title: board.title,
        elements: z.array(boardElement).catch([]).parse(board.elements),
        updatedAt: board.updatedAt.toISOString(),
        canEdit: await ctx.permissions.can("whiteboards.edit"),
      };
    }),

  create: procedure("whiteboards.edit", ["whiteboard.created"])
    .input(z.object({ title }))
    .mutation(async ({ ctx, input }) => {
      const memberId = await currentMemberId(ctx);
      const id = await ctx.db.transaction(async (tx) => {
        const [row] = await tx
          .insert(whiteboards)
          .values({
            title: input.title,
            organizationId: ctx.activeOrganization.id,
            createdByMemberId: memberId,
          })
          .returning({ id: whiteboards.id });

        await ctx.audit.record(tx, {
          action: "whiteboard.created",
          target: { id: row!.id, label: input.title },
        });

        return row!.id;
      });

      return { id };
    }),

  /** Saves the drawing. Anyone who can edit boards may draw on any board. */
  save: procedure("whiteboards.edit")
    .input(z.object({ id: uuid, elements: z.array(boardElement).max(5000) }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db
        .update(whiteboards)
        .set({ elements: input.elements, updatedAt: new Date() })
        .where(
          and(
            eq(whiteboards.id, input.id),
            eq(whiteboards.organizationId, ctx.activeOrganization.id),
          ),
        )
        .returning({ id: whiteboards.id });

      if (!result.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Board not found." });
      }

      return { savedAt: new Date().toISOString() };
    }),

  rename: procedure(
    "whiteboards.view",
    ["whiteboard.renamed"],
    ["whiteboards.delete_own", "whiteboards.delete_any"],
  )
    .input(z.object({ id: uuid, title }))
    .mutation(async ({ ctx, input }) => {
      const board = await manageable(ctx, input.id);

      await ctx.db.transaction(async (tx) => {
        await tx
          .update(whiteboards)
          .set({ title: input.title, updatedAt: new Date() })
          .where(eq(whiteboards.id, board.id));
        await ctx.audit.record(tx, {
          action: "whiteboard.renamed",
          target: { id: board.id, label: input.title },
        });
      });

      return { id: board.id };
    }),

  remove: procedure(
    "whiteboards.view",
    ["whiteboard.deleted"],
    ["whiteboards.delete_own", "whiteboards.delete_any"],
  )
    .input(z.object({ id: uuid }))
    .mutation(async ({ ctx, input }) => {
      const board = await manageable(ctx, input.id);

      await ctx.db.transaction(async (tx) => {
        await tx.delete(whiteboards).where(eq(whiteboards.id, board.id));
        await ctx.audit.record(tx, {
          action: "whiteboard.deleted",
          target: { id: board.id, label: board.title },
        });
      });

      return { id: board.id };
    }),
});
