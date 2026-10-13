import {
  buildCsv,
  getAuditEvent,
  describeEvent,
  actorName,
} from "@zentro/audit";
import {
  and,
  desc,
  eq,
  gte,
  ilike,
  like,
  lte,
  or,
  type SQL,
} from "@zentro/db/drizzle";
import { activityEvents, users } from "@zentro/db/schema";
import { z } from "zod";

import { cursorCondition, cursorSchema, encodeCursor } from "../activity";
import { permissionProcedure, router } from "../trpc";

const uuid = z.string().uuid();

export const maxExportRows = 50_000;

const filterSchema = z.object({
  actorUserId: uuid.optional(),
  /** A key or the start of one, such as `task.` or `auth.sign_in`. */
  actionPrefix: z.string().trim().max(60).optional(),
  targetType: z.string().trim().max(40).optional(),
  targetId: z.string().trim().max(100).optional(),
  projectId: uuid.optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  search: z.string().trim().max(100).optional(),
});

type Filter = z.infer<typeof filterSchema>;

function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, (character) => `\\${character}`);
}

function filterConditions(organizationId: string, filter: Filter) {
  const conditions: Array<SQL | undefined> = [
    eq(activityEvents.organizationId, organizationId),
  ];

  if (filter.actorUserId) {
    conditions.push(eq(activityEvents.actorUserId, filter.actorUserId));
  }

  if (filter.actionPrefix) {
    conditions.push(
      like(activityEvents.action, `${escapeLike(filter.actionPrefix)}%`),
    );
  }

  if (filter.targetType) {
    conditions.push(eq(activityEvents.targetType, filter.targetType));
  }

  if (filter.targetId) {
    conditions.push(eq(activityEvents.targetId, filter.targetId));
  }

  if (filter.projectId) {
    conditions.push(eq(activityEvents.projectId, filter.projectId));
  }

  if (filter.from) {
    conditions.push(gte(activityEvents.createdAt, filter.from));
  }

  if (filter.to) {
    conditions.push(lte(activityEvents.createdAt, filter.to));
  }

  if (filter.search) {
    const pattern = `%${escapeLike(filter.search)}%`;

    conditions.push(
      or(
        ilike(activityEvents.targetLabel, pattern),
        ilike(activityEvents.action, pattern),
      ),
    );
  }

  return conditions;
}

const columns = {
  id: activityEvents.id,
  action: activityEvents.action,
  targetType: activityEvents.targetType,
  targetId: activityEvents.targetId,
  targetLabel: activityEvents.targetLabel,
  projectId: activityEvents.projectId,
  teamId: activityEvents.teamId,
  auditOnly: activityEvents.auditOnly,
  metadata: activityEvents.metadata,
  ip: activityEvents.ip,
  userAgent: activityEvents.userAgent,
  requestId: activityEvents.requestId,
  createdAt: activityEvents.createdAt,
  actorUserId: activityEvents.actorUserId,
  actorName: users.name,
  actorEmail: users.email,
};

export const auditRouter = router({
  // Every event, including sign-ins and permission changes. Whoever holds
  // audit_logs.view sees the whole organization's log, private projects too.
  list: permissionProcedure("audit_logs.view")
    .input(
      filterSchema.extend({
        cursor: cursorSchema.optional(),
        limit: z.number().int().min(1).max(100).default(50),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { cursor, limit, ...filter } = input;
      const rows = await ctx.db
        .select(columns)
        .from(activityEvents)
        .leftJoin(users, eq(users.id, activityEvents.actorUserId))
        .where(
          and(
            ...filterConditions(ctx.activeOrganization.id, filter),
            cursorCondition(cursor),
          ),
        )
        .orderBy(desc(activityEvents.createdAt), desc(activityEvents.id))
        .limit(limit + 1);

      const hasMore = rows.length > limit;
      const items = hasMore ? rows.slice(0, limit) : rows;

      return {
        items,
        nextCursor: hasMore ? encodeCursor(items[items.length - 1]!) : null,
      };
    }),

  // CSV of the current filter, up to 50,000 rows. Recorded as an event.
  export: permissionProcedure("audit_logs.export", undefined, {
    audit: ["audit.exported"],
  })
    .input(filterSchema)
    .mutation(async ({ ctx, input }) => {
      const rows = await ctx.db
        .select(columns)
        .from(activityEvents)
        .leftJoin(users, eq(users.id, activityEvents.actorUserId))
        .where(and(...filterConditions(ctx.activeOrganization.id, input)))
        .orderBy(desc(activityEvents.createdAt), desc(activityEvents.id))
        .limit(maxExportRows + 1);

      const truncated = rows.length > maxExportRows;
      const exported = truncated ? rows.slice(0, maxExportRows) : rows;

      // Metadata is left out of the file on purpose: it can hold full
      // before and after values. The sentence and the changes are enough.
      const csv = buildCsv(
        [
          "time",
          "actor",
          "action",
          "event",
          "description",
          "target_type",
          "target_id",
          "target",
          "project_id",
          "team_id",
          "audit_only",
          "ip",
          "user_agent",
          "request_id",
        ],
        exported.map((row) => [
          row.createdAt,
          row.actorName ||
            row.actorEmail ||
            (row.actorUserId ? "Deleted user" : "System"),
          row.action,
          getAuditEvent(row.action)?.label ?? row.action,
          describeEvent(
            {
              action: row.action,
              targetType: row.targetType,
              targetLabel: row.targetLabel,
              metadata: row.metadata,
            },
            actorName(
              row.actorName || row.actorEmail
                ? { name: row.actorName, email: row.actorEmail }
                : null,
              row.actorUserId,
            ),
          ),
          row.targetType,
          row.targetId,
          row.targetLabel,
          row.projectId,
          row.teamId,
          row.auditOnly,
          row.ip,
          row.userAgent,
          row.requestId,
        ]),
      );

      await ctx.db.transaction(async (tx) => {
        await ctx.audit.record(tx, {
          action: "audit.exported",
          target: { id: ctx.activeOrganization.id, label: "Audit log" },
          metadata: {
            filter: input,
            rowCount: exported.length,
            truncated,
          },
        });
      });

      return {
        csv,
        rowCount: exported.length,
        truncated,
        filename: `audit-log-${new Date().toISOString().slice(0, 10)}.csv`,
      };
    }),
});
