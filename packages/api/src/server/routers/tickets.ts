import { TRPCError } from "@trpc/server";
import {
  and,
  asc,
  desc,
  eq,
  ilike,
  isNull,
  or,
  sql,
  type SQL,
} from "@zentro/db/drizzle";
import {
  members,
  tasks,
  ticketMessages,
  tickets,
  users,
} from "@zentro/db/schema";
import { z } from "zod";

import { currentMemberId } from "../chat";
import { permissionProcedure, router, type OrganizationContext } from "../trpc";

const uuid = z.string().uuid();

export const ticketStatuses = ["open", "pending", "resolved", "spam"] as const;
export const ticketPriorities = ["low", "normal", "high", "urgent"] as const;
export const ticketViews = [
  "mine",
  "unassigned",
  "open",
  "pending",
  "resolved",
  "spam",
] as const;

const procedure = (permission: string, audit?: string[], also?: string[]) =>
  permissionProcedure(permission, undefined, {
    module: "tickets",
    audit,
    also,
  });

const escapeLike = (value: string) => value.replace(/[\\%_]/g, "\\$&");

const ticketRef = (number: number) => `SUP-${number}`;

async function findTicket(ctx: OrganizationContext, id: string) {
  const [ticket] = await ctx.db
    .select()
    .from(tickets)
    .where(
      and(
        eq(tickets.id, id),
        eq(tickets.organizationId, ctx.activeOrganization.id),
      ),
    )
    .limit(1);

  if (!ticket) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Ticket not found." });
  }

  return ticket;
}

async function assertAssignee(ctx: OrganizationContext, memberId: string) {
  const [row] = await ctx.db
    .select({ id: members.id })
    .from(members)
    .where(
      and(
        eq(members.id, memberId),
        eq(members.organizationId, ctx.activeOrganization.id),
      ),
    )
    .limit(1);

  if (!row) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "That person isn't in this organization.",
    });
  }
}

const createInput = z.object({
  subject: z.string().trim().min(1, "Give the ticket a subject.").max(200),
  description: z.string().trim().max(10_000).default(""),
  requesterName: z.string().trim().min(1, "Who is asking?").max(120),
  requesterEmail: z
    .string()
    .trim()
    .email("That email address doesn't look right.")
    .max(200)
    .nullable()
    .default(null),
  priority: z.enum(ticketPriorities).default("normal"),
  category: z.string().trim().max(60).nullable().default(null),
  assigneeMemberId: uuid.nullable().default(null),
});

export const ticketsRouter = router({
  /** The queue for one view, newest activity first, plus a count per view. */
  list: procedure("tickets.view")
    .input(
      z.object({
        view: z.enum(ticketViews).default("mine"),
        q: z.string().trim().max(100).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const memberId = await currentMemberId(ctx);
      const organizationId = ctx.activeOrganization.id;

      const viewCondition = (view: (typeof ticketViews)[number]): SQL => {
        switch (view) {
          case "mine":
            return and(
              eq(tickets.status, "open"),
              eq(tickets.assigneeMemberId, memberId),
            )!;
          case "unassigned":
            return and(
              eq(tickets.status, "open"),
              isNull(tickets.assigneeMemberId),
            )!;
          default:
            return eq(tickets.status, view);
        }
      };

      const counts: Record<string, number> = {};

      for (const view of ticketViews) {
        const [row] = await ctx.db
          .select({ count: sql<number>`count(*)::int` })
          .from(tickets)
          .where(
            and(
              eq(tickets.organizationId, organizationId),
              viewCondition(view),
            ),
          );

        counts[view] = row?.count ?? 0;
      }

      const conditions: SQL[] = [
        eq(tickets.organizationId, organizationId),
        viewCondition(input.view),
      ];

      if (input.q) {
        const pattern = `%${escapeLike(input.q)}%`;

        conditions.push(
          or(
            ilike(tickets.subject, pattern),
            ilike(tickets.requesterName, pattern),
            ilike(tickets.requesterEmail, pattern),
          )!,
        );
      }

      const rows = await ctx.db
        .select({
          ticket: tickets,
          assignee: users.name,
        })
        .from(tickets)
        .leftJoin(members, eq(members.id, tickets.assigneeMemberId))
        .leftJoin(users, eq(users.id, members.userId))
        .where(and(...conditions))
        .orderBy(desc(tickets.updatedAt))
        .limit(200);

      return {
        counts,
        tickets: rows.map(({ ticket, assignee }) => ({
          id: ticket.id,
          ref: ticketRef(ticket.number),
          subject: ticket.subject,
          requesterName: ticket.requesterName,
          status: ticket.status,
          priority: ticket.priority,
          category: ticket.category,
          assignee: assignee ?? null,
          updatedAt: ticket.updatedAt.toISOString(),
        })),
      };
    }),

  /** People a ticket can be assigned to. */
  assignees: procedure("tickets.view").query(async ({ ctx }) => {
    return ctx.db
      .select({ id: members.id, name: users.name })
      .from(members)
      .innerJoin(users, eq(users.id, members.userId))
      .where(eq(members.organizationId, ctx.activeOrganization.id))
      .orderBy(asc(users.name));
  }),

  get: procedure("tickets.view")
    .input(z.object({ id: uuid }))
    .query(async ({ ctx, input }) => {
      const ticket = await findTicket(ctx, input.id);

      const messages = await ctx.db
        .select({ message: ticketMessages, author: users.name })
        .from(ticketMessages)
        .leftJoin(members, eq(members.id, ticketMessages.authorMemberId))
        .leftJoin(users, eq(users.id, members.userId))
        .where(eq(ticketMessages.ticketId, ticket.id))
        .orderBy(asc(ticketMessages.createdAt));

      const [task] = ticket.linkedTaskId
        ? await ctx.db
            .select({ id: tasks.id, key: tasks.key, name: tasks.name })
            .from(tasks)
            .where(eq(tasks.id, ticket.linkedTaskId))
            .limit(1)
        : [];

      return {
        id: ticket.id,
        ref: ticketRef(ticket.number),
        subject: ticket.subject,
        description: ticket.description,
        requesterName: ticket.requesterName,
        requesterEmail: ticket.requesterEmail,
        status: ticket.status,
        priority: ticket.priority,
        category: ticket.category,
        assigneeMemberId: ticket.assigneeMemberId,
        linkedTask: task ?? null,
        createdAt: ticket.createdAt.toISOString(),
        resolvedAt: ticket.resolvedAt?.toISOString() ?? null,
        messages: messages.map(({ message, author }) => ({
          id: message.id,
          kind: message.kind,
          body: message.body,
          author: author ?? "Former member",
          createdAt: message.createdAt.toISOString(),
        })),
        canReply: await ctx.permissions.can("tickets.reply"),
        canUpdate: await ctx.permissions.can("tickets.update"),
        canDelete: await ctx.permissions.can("tickets.delete"),
      };
    }),

  create: procedure("tickets.create", ["ticket.created"])
    .input(createInput)
    .mutation(async ({ ctx, input }) => {
      const memberId = await currentMemberId(ctx);

      if (input.assigneeMemberId) {
        await assertAssignee(ctx, input.assigneeMemberId);
      }

      return ctx.db.transaction(async (tx) => {
        const [last] = await tx
          .select({
            max: sql<number>`coalesce(max(${tickets.number}), 0)::int`,
          })
          .from(tickets)
          .where(eq(tickets.organizationId, ctx.activeOrganization.id));
        const number = (last?.max ?? 0) + 1;

        const [row] = await tx
          .insert(tickets)
          .values({
            ...input,
            number,
            organizationId: ctx.activeOrganization.id,
            createdByMemberId: memberId,
          })
          .returning({ id: tickets.id });

        await ctx.audit.record(tx, {
          action: "ticket.created",
          target: {
            id: row!.id,
            label: `${ticketRef(number)} ${input.subject}`,
          },
        });

        return { id: row!.id, ref: ticketRef(number) };
      });
    }),

  update: procedure("tickets.update", ["ticket.updated"])
    .input(
      z.object({
        id: uuid,
        status: z.enum(ticketStatuses).optional(),
        priority: z.enum(ticketPriorities).optional(),
        category: z.string().trim().max(60).nullable().optional(),
        assigneeMemberId: uuid.nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const ticket = await findTicket(ctx, input.id);

      if (input.assigneeMemberId) {
        await assertAssignee(ctx, input.assigneeMemberId);
      }

      const { id, ...changes } = input;

      await ctx.db.transaction(async (tx) => {
        await tx
          .update(tickets)
          .set({
            ...changes,
            ...(changes.status
              ? {
                  resolvedAt: changes.status === "resolved" ? new Date() : null,
                }
              : {}),
            updatedAt: new Date(),
          })
          .where(eq(tickets.id, id));

        await ctx.audit.record(tx, {
          action: "ticket.updated",
          target: {
            id: ticket.id,
            label: `${ticketRef(ticket.number)} ${ticket.subject}`,
          },
        });
      });

      return { id: ticket.id };
    }),

  /** A reply to the requester, or an internal note. */
  reply: procedure("tickets.reply")
    .input(
      z.object({
        id: uuid,
        kind: z.enum(["reply", "note"]).default("reply"),
        body: z.string().trim().min(1, "Write something first.").max(20_000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const ticket = await findTicket(ctx, input.id);
      const memberId = await currentMemberId(ctx);

      await ctx.db.transaction(async (tx) => {
        await tx.insert(ticketMessages).values({
          ticketId: ticket.id,
          organizationId: ctx.activeOrganization.id,
          authorMemberId: memberId,
          kind: input.kind,
          body: input.body,
        });
        // Answering the requester parks the ticket until they respond.
        await tx
          .update(tickets)
          .set({
            updatedAt: new Date(),
            ...(input.kind === "reply" && ticket.status === "open"
              ? { status: "pending" }
              : {}),
          })
          .where(eq(tickets.id, ticket.id));
      });

      return { id: ticket.id };
    }),

  /** Links the ticket to the engineering task that fixes it, by task key. */
  linkTask: procedure("tickets.update", ["ticket.updated"])
    .input(
      z.object({
        id: uuid,
        taskKey: z.string().trim().max(40).nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const ticket = await findTicket(ctx, input.id);
      let taskId: string | null = null;

      if (input.taskKey) {
        const [task] = await ctx.db
          .select({ id: tasks.id })
          .from(tasks)
          .where(
            and(
              eq(tasks.organizationId, ctx.activeOrganization.id),
              sql`upper(${tasks.key}) = ${input.taskKey.toUpperCase()}`,
              isNull(tasks.deletedAt),
            ),
          )
          .limit(1);

        if (!task) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `No task with the key ${input.taskKey}.`,
          });
        }

        taskId = task.id;
      }

      await ctx.db.transaction(async (tx) => {
        await tx
          .update(tickets)
          .set({ linkedTaskId: taskId, updatedAt: new Date() })
          .where(eq(tickets.id, ticket.id));
        await ctx.audit.record(tx, {
          action: "ticket.updated",
          target: {
            id: ticket.id,
            label: `${ticketRef(ticket.number)} ${ticket.subject}`,
          },
        });
      });

      return { id: ticket.id };
    }),

  remove: procedure("tickets.delete", ["ticket.deleted"])
    .input(z.object({ id: uuid }))
    .mutation(async ({ ctx, input }) => {
      const ticket = await findTicket(ctx, input.id);

      await ctx.db.transaction(async (tx) => {
        await tx.delete(tickets).where(eq(tickets.id, ticket.id));
        await ctx.audit.record(tx, {
          action: "ticket.deleted",
          target: {
            id: ticket.id,
            label: `${ticketRef(ticket.number)} ${ticket.subject}`,
          },
        });
      });

      return { id: ticket.id };
    }),
});
