import type { db } from "@zentro/db";
import { activityEvents, type ActivityEvent } from "@zentro/db/schema";

import { getAuditEvent } from "./catalog";
import { maxChangeLength } from "./diff";
import { redactSecrets } from "./redact";
import type { AuditChange } from "./types";

/** A database or transaction handle: everything an event insert needs. */
export type AuditHandle = Pick<typeof db, "insert">;

export type AuditRequestContext = {
  ip?: string | null;
  userAgent?: string | null;
  requestId?: string | null;
};

export type RecordEventInput = {
  organizationId: string;
  /** Null when the system acted. */
  actorUserId: string | null;
  /** A key of the event catalog. */
  action: string;
  target: { id: string; label?: string | null };
  projectId?: string | null;
  teamId?: string | null;
  changes?: AuditChange[];
  /** Extra context. Secret-looking keys are removed before it is stored. */
  metadata?: Record<string, unknown>;
  request?: AuditRequestContext;
};

const maxLabelLength = 300;
const maxUserAgentLength = 500;

function shorten(value: string | null | undefined, max: number) {
  if (!value) {
    return null;
  }

  return value.length > max ? `${value.slice(0, max)}…` : value;
}

/**
 * Reads the client address and user agent from the request headers. The
 * address is the first `x-forwarded-for` entry, so it is only trustworthy
 * behind a proxy that overwrites that header.
 */
export function requestContextFromHeaders(
  headers: Headers | undefined | null,
  requestId?: string,
): AuditRequestContext {
  const forwarded = headers?.get("x-forwarded-for")?.split(",")[0]?.trim();

  return {
    ip: forwarded || headers?.get("x-real-ip") || null,
    userAgent: shorten(headers?.get("user-agent"), maxUserAgentLength),
    requestId: requestId ?? null,
  };
}

/**
 * Writes one event. Pass the transaction that makes the change, so the event
 * exists exactly when the change does.
 */
export async function insertActivityEvent(
  handle: AuditHandle,
  input: RecordEventInput,
): Promise<ActivityEvent> {
  const definition = getAuditEvent(input.action);

  if (!definition) {
    throw new Error(`Unknown audit event ${input.action}.`);
  }

  const changes = input.changes?.map((change) => ({
    field: change.field,
    from: shorten(change.from, maxChangeLength),
    to: shorten(change.to, maxChangeLength),
  }));
  const metadata = redactSecrets({
    ...input.metadata,
    ...(changes?.length ? { changes } : {}),
  });

  const [row] = await handle
    .insert(activityEvents)
    .values({
      organizationId: input.organizationId,
      actorUserId: input.actorUserId,
      action: definition.key,
      targetType: definition.targetType,
      targetId: input.target.id,
      targetLabel: shorten(input.target.label, maxLabelLength),
      projectId: input.projectId ?? null,
      teamId: input.teamId ?? null,
      auditOnly: definition.auditOnly,
      metadata,
      ip: input.request?.ip ?? null,
      userAgent: input.request?.userAgent ?? null,
      requestId: input.request?.requestId ?? null,
    })
    .returning();

  return row!;
}
