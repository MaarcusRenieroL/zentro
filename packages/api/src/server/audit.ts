import { randomUUID } from "node:crypto";

import {
  insertActivityEvent,
  requestContextFromHeaders,
  type AuditHandle,
  type AuditRequestContext,
  type RecordEventInput,
} from "@zentro/audit/server";
import type { ActivityEvent } from "@zentro/db/schema";

export type AuditEventInput = Omit<
  RecordEventInput,
  "organizationId" | "actorUserId" | "request"
>;

/**
 * What a procedure uses to write activity events. It knows the actor, the
 * organization and the request (address, user agent, request id), and keeps
 * track of what a call recorded so the audit guard can verify it.
 */
export type AuditContext = {
  requestId: string;
  request: AuditRequestContext;
  /** Event keys recorded or knowingly skipped by this call. */
  readonly recorded: readonly string[];
  /** Writes an event; pass the transaction that makes the change. */
  record(handle: AuditHandle, input: AuditEventInput): Promise<ActivityEvent>;
  /** Marks an event as intentionally not written (for example debounced). */
  skipped(action: string): void;
  /** A tracker of its own for one procedure call, sharing the request. */
  forCall(): AuditContext;
};

export function createAuditContext(options: {
  organizationId: string | null;
  userId: string | null;
  headers?: Headers | null;
  requestId?: string;
}): AuditContext {
  const requestId = options.requestId ?? randomUUID();
  const request = requestContextFromHeaders(options.headers, requestId);

  const build = (): AuditContext => {
    const recorded: string[] = [];

    return {
      requestId,
      request,
      recorded,
      async record(handle, input) {
        if (!options.organizationId) {
          throw new Error("Cannot record an event without an organization.");
        }

        const event = await insertActivityEvent(handle, {
          ...input,
          organizationId: options.organizationId,
          actorUserId: options.userId,
          request,
        });

        recorded.push(event.action);

        return event;
      },
      skipped(action) {
        recorded.push(action);
      },
      forCall: build,
    };
  };

  return build();
}
