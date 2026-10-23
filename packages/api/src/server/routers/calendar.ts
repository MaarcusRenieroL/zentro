import { TRPCError } from "@trpc/server";
import { and, asc, eq, gt, lt } from "@zentro/db/drizzle";
import { calendarEvents, members, users } from "@zentro/db/schema";
import { z } from "zod";

import { currentMemberId } from "../chat";
import { permissionProcedure, router, type OrganizationContext } from "../trpc";

const uuid = z.string().uuid();
export const eventColors = [
  "blue",
  "green",
  "amber",
  "red",
  "violet",
  "gray",
] as const;

const procedure = (permission: string) =>
  permissionProcedure(permission, undefined, { module: "calendar" });

const eventInput = z
  .object({
    title: z.string().trim().min(1, "Give the event a title.").max(200),
    description: z.string().trim().max(5000).nullable().default(null),
    location: z.string().trim().max(300).nullable().default(null),
    color: z.enum(eventColors).default("blue"),
    allDay: z.boolean().default(false),
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
  })
  .refine((value) => value.endsAt >= value.startsAt, {
    message: "The event can't end before it starts.",
    path: ["endsAt"],
  });

async function manageable(ctx: OrganizationContext, id: string) {
  const memberId = await currentMemberId(ctx);
  const [event] = await ctx.db
    .select()
    .from(calendarEvents)
    .where(
      and(
        eq(calendarEvents.id, id),
        eq(calendarEvents.organizationId, ctx.activeOrganization.id),
      ),
    )
    .limit(1);

  if (!event) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Event not found." });
  }

  const mine = event.createdByMemberId === memberId;
  const allowed = mine
    ? (await ctx.permissions.can("calendar.manage_own")) ||
      (await ctx.permissions.can("calendar.manage_any"))
    : await ctx.permissions.can("calendar.manage_any");

  if (!allowed) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You can only change events you created.",
    });
  }

  return event;
}

export const calendarRouter = router({
  /** Events that overlap the given range. */
  list: procedure("calendar.view")
    .input(z.object({ from: z.coerce.date(), to: z.coerce.date() }))
    .query(async ({ ctx, input }) => {
      const memberId = await currentMemberId(ctx);
      const any = await ctx.permissions.can("calendar.manage_any");
      const own = await ctx.permissions.can("calendar.manage_own");

      const rows = await ctx.db
        .select({
          event: calendarEvents,
          creator: users.name,
        })
        .from(calendarEvents)
        .leftJoin(members, eq(members.id, calendarEvents.createdByMemberId))
        .leftJoin(users, eq(users.id, members.userId))
        .where(
          and(
            eq(calendarEvents.organizationId, ctx.activeOrganization.id),
            lt(calendarEvents.startsAt, input.to),
            gt(calendarEvents.endsAt, input.from),
          ),
        )
        .orderBy(asc(calendarEvents.startsAt))
        .limit(1000);

      return rows.map(({ event, creator }) => ({
        id: event.id,
        title: event.title,
        description: event.description,
        location: event.location,
        color: event.color,
        allDay: event.allDay,
        startsAt: event.startsAt.toISOString(),
        endsAt: event.endsAt.toISOString(),
        createdBy: creator ?? null,
        canManage: any || (own && event.createdByMemberId === memberId),
      }));
    }),

  create: procedure("calendar.create")
    .input(eventInput)
    .mutation(async ({ ctx, input }) => {
      const memberId = await currentMemberId(ctx);
      const [row] = await ctx.db
        .insert(calendarEvents)
        .values({
          ...input,
          organizationId: ctx.activeOrganization.id,
          createdByMemberId: memberId,
        })
        .returning({ id: calendarEvents.id });

      return { id: row!.id };
    }),

  update: procedure("calendar.view")
    .input(z.object({ id: uuid, data: eventInput }))
    .mutation(async ({ ctx, input }) => {
      const event = await manageable(ctx, input.id);

      await ctx.db
        .update(calendarEvents)
        .set({ ...input.data, updatedAt: new Date() })
        .where(eq(calendarEvents.id, event.id));

      return { id: event.id };
    }),

  remove: procedure("calendar.view")
    .input(z.object({ id: uuid }))
    .mutation(async ({ ctx, input }) => {
      const event = await manageable(ctx, input.id);

      await ctx.db
        .delete(calendarEvents)
        .where(eq(calendarEvents.id, event.id));

      return { id: event.id };
    }),
});
