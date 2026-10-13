import { randomUUID } from "node:crypto";

import {
  insertActivityEvent,
  requestContextFromHeaders,
} from "@zentro/audit/server";
import { db } from "@zentro/db";
import { and, eq, sql } from "@zentro/db/drizzle";
import { members, users, verifications } from "@zentro/db/schema";

// The authentication events: sign-in, sign-out, password changes and so on.
// Better Auth owns these requests, so they are recorded from its hooks. They
// are audit-only, and they are written once for every organization the person
// belongs to, because every event belongs to an organization. A person who is
// not in any organization yet (a brand new sign-up) leaves no trace until they
// join or create one.

type HookContext = {
  path?: string;
  headers?: Headers;
  request?: Request;
  body?: unknown;
  context: {
    returned?: unknown;
    newSession?: { user: { id: string } } | null;
  };
};

/** The user a reset token belongs to, read before the token is consumed. */
const resetTokenUsers = new WeakMap<Request, string>();

function failed(returned: unknown) {
  return returned instanceof Error;
}

async function organizationsOf(userId: string) {
  const rows = await db
    .select({ organizationId: members.organizationId })
    .from(members)
    .where(eq(members.userId, userId));

  return rows.map((row) => row.organizationId);
}

async function userByEmail(email: unknown) {
  if (typeof email !== "string" || !email) {
    return null;
  }

  const [row] = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(sql`lower(${users.email}) = lower(${email})`)
    .limit(1);

  return row ?? null;
}

/** Writes one event into every organization the user belongs to. */
export async function recordForUser(
  ctx: Pick<HookContext, "headers">,
  userId: string,
  action: string,
  options: { label?: string | null; metadata?: Record<string, unknown> } = {},
) {
  try {
    const request = requestContextFromHeaders(ctx.headers, randomUUID());
    const [user] = await db
      .select({ name: users.name, email: users.email })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    for (const organizationId of await organizationsOf(userId)) {
      await insertActivityEvent(db, {
        organizationId,
        actorUserId: userId,
        action,
        target: {
          id: userId,
          label: options.label ?? (user ? user.name || user.email : null),
        },
        metadata: options.metadata,
        request,
      });
    }
  } catch (error) {
    // Auditing must never break signing in or out.
    console.error(`[audit] could not record ${action}`, error);
  }
}

/** Writes one event into a single organization (membership events). */
export async function recordInOrganization(
  ctx: Pick<HookContext, "headers">,
  input: {
    organizationId: string;
    actorUserId: string | null;
    action: string;
    targetId: string;
    label?: string | null;
    metadata?: Record<string, unknown>;
  },
) {
  try {
    await insertActivityEvent(db, {
      organizationId: input.organizationId,
      actorUserId: input.actorUserId,
      action: input.action,
      target: { id: input.targetId, label: input.label },
      metadata: input.metadata,
      request: requestContextFromHeaders(ctx.headers, randomUUID()),
    });
  } catch (error) {
    console.error(`[audit] could not record ${input.action}`, error);
  }
}

/** Before hook: facts that are gone once the request has been handled. */
export async function auditBefore(
  ctx: HookContext,
  sessionUserId: () => Promise<string | null>,
) {
  if (ctx.path === "/sign-out") {
    const userId = await sessionUserId();

    if (userId) {
      await recordForUser(ctx, userId, "auth.sign_out");
    }
  }

  if (ctx.path === "/reset-password" && ctx.request) {
    const token =
      (ctx.body as { token?: string } | undefined)?.token ??
      new URL(ctx.request.url).searchParams.get("token");

    if (token) {
      // The token is only used to find the person; it is never stored.
      const [row] = await db
        .select({ value: verifications.value })
        .from(verifications)
        .where(and(eq(verifications.identifier, `reset-password:${token}`)))
        .limit(1);

      if (row) {
        resetTokenUsers.set(ctx.request, row.value);
      }
    }
  }
}

/** After hook: records what the finished request did. */
export async function auditAfter(
  ctx: HookContext,
  sessionUserId: () => Promise<string | null>,
) {
  const { returned } = ctx.context;
  const body = (ctx.body ?? {}) as Record<string, unknown>;

  switch (ctx.path) {
    case "/sign-in/email": {
      if (failed(returned)) {
        const user = await userByEmail(body.email);

        // Only attempts on a known account; the address and password the
        // person typed are not kept.
        if (user) {
          await recordForUser(ctx, user.id, "auth.sign_in_failed");
        }

        return;
      }

      const userId = ctx.context.newSession?.user.id;

      if (userId) {
        await recordForUser(ctx, userId, "auth.sign_in");
      }

      return;
    }

    case "/sign-up/email": {
      const userId = ctx.context.newSession?.user.id;

      if (!failed(returned) && userId) {
        await recordForUser(ctx, userId, "auth.sign_up");
      }

      return;
    }

    case "/email-otp/verify-email": {
      if (failed(returned)) {
        return;
      }

      const user = await userByEmail(body.email);

      if (user) {
        await recordForUser(ctx, user.id, "auth.email_verified");
      }

      return;
    }

    case "/request-password-reset": {
      if (failed(returned)) {
        return;
      }

      const user = await userByEmail(body.email);

      if (user) {
        await recordForUser(ctx, user.id, "auth.password_reset_requested");
      }

      return;
    }

    case "/reset-password": {
      const userId = ctx.request ? resetTokenUsers.get(ctx.request) : null;

      if (!failed(returned) && userId) {
        await recordForUser(ctx, userId, "auth.password_reset_completed");
      }

      return;
    }

    case "/change-password": {
      if (failed(returned)) {
        return;
      }

      const userId = await sessionUserId();

      if (userId) {
        await recordForUser(ctx, userId, "auth.password_changed");
      }

      return;
    }

    case "/organization/create": {
      const created = returned as { id?: string; name?: string } | Error;
      const userId = await sessionUserId();

      if (!failed(created) && "id" in created && created.id) {
        await recordInOrganization(ctx, {
          organizationId: created.id,
          actorUserId: userId,
          action: "org.created",
          targetId: created.id,
          label: created.name,
        });
      }

      return;
    }

    case "/organization/accept-invitation":
    case "/organization/reject-invitation": {
      if (failed(returned)) {
        return;
      }

      const result = returned as {
        invitation?: { id: string; email: string; organizationId: string };
        member?: { id: string; userId: string; organizationId: string };
      } | null;
      const userId = await sessionUserId();
      const invitation = result?.invitation;

      if (!invitation) {
        return;
      }

      const accepted = ctx.path === "/organization/accept-invitation";

      await recordInOrganization(ctx, {
        organizationId: invitation.organizationId,
        actorUserId: userId,
        action: accepted ? "invitation.accepted" : "invitation.rejected",
        targetId: invitation.id,
        label: invitation.email,
      });

      if (accepted && result?.member) {
        const [person] = await db
          .select({ name: users.name, email: users.email })
          .from(users)
          .where(eq(users.id, result.member.userId))
          .limit(1);

        await recordInOrganization(ctx, {
          organizationId: invitation.organizationId,
          actorUserId: userId,
          action: "member.joined",
          targetId: result.member.id,
          label: person ? person.name || person.email : null,
        });
      }

      return;
    }

    case "/organization/leave": {
      const left = returned as
        | { id?: string; organizationId?: string; userId?: string }
        | Error
        | undefined;

      if (
        left &&
        !failed(left) &&
        "organizationId" in left &&
        left.organizationId &&
        left.userId
      ) {
        const [person] = await db
          .select({ name: users.name, email: users.email })
          .from(users)
          .where(eq(users.id, left.userId))
          .limit(1);

        await recordInOrganization(ctx, {
          organizationId: left.organizationId,
          actorUserId: left.userId,
          action: "member.left",
          targetId: left.id ?? left.userId,
          label: person ? person.name || person.email : null,
        });
      }

      return;
    }

    default:
      return;
  }
}
