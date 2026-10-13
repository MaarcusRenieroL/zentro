import { betterAuth } from "better-auth";
import { createAuthMiddleware } from "better-auth/api";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { emailOTP, organization } from "better-auth/plugins";

import { db } from "@zentro/db";
import { desc, eq } from "@zentro/db/drizzle";
import * as schema from "@zentro/db/schema";
import {
  sendForgotPasswordEmail,
  sendVerificationEmail,
  sendOrgInviteEmail,
} from "./lib/email";
import { validateProductionEnv } from "./lib/env";
import { betterAuthAc, betterAuthRoles } from "./access-control";
import { ensureSystemRoles, removeMemberAccess } from "./seed";
import { userAdditionalFields } from "./additional-fields";

validateProductionEnv();

const baseURL = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
const secret = process.env.BETTER_AUTH_SECRET;

const trustedOrigins = Array.from(
  new Set([new URL(baseURL).origin, "http://localhost:3000"]),
);

// Endpoints that read or change organization data are only reachable through
// our tRPC procedures, which check permissions with @zentro/permissions. Better
// Auth's own role check is wide open (see access-control.ts), so leaving these
// reachable over HTTP would let any member call them directly.
const disabledOrganizationPaths = [
  "/organization/add-team-member",
  "/organization/cancel-invitation",
  "/organization/create-role",
  "/organization/create-team",
  "/organization/delete",
  "/organization/delete-role",
  "/organization/get-active-member",
  "/organization/get-active-member-role",
  "/organization/get-full-organization",
  "/organization/get-invitation",
  "/organization/get-role",
  "/organization/has-permission",
  "/organization/invite-member",
  "/organization/list-invitations",
  "/organization/list-members",
  "/organization/list-roles",
  "/organization/list-team-members",
  "/organization/list-teams",
  "/organization/list-user-invitations",
  "/organization/list-user-teams",
  "/organization/remove-member",
  "/organization/remove-team",
  "/organization/remove-team-member",
  "/organization/set-active-team",
  "/organization/update",
  "/organization/update-member-role",
  "/organization/update-role",
  "/organization/update-team",
  // Accepts any session field, including `activeOrganizationId`, so a session
  // could be pointed at an organization the user does not belong to.
  "/update-session",
];

export const auth = betterAuth({
  disabledPaths: disabledOrganizationPaths,
  hooks: {
    // Leaving an organization deletes the member row directly and skips the
    // organization hooks, so the access that came with it is cleared here.
    after: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/organization/leave") {
        return;
      }

      const left = ctx.context.returned as
        | { organizationId?: string; userId?: string }
        | undefined;

      if (left?.organizationId && left.userId) {
        await removeMemberAccess(db, left.organizationId, left.userId);
      }
    }),
  },
  baseURL,
  secret,
  trustedOrigins,
  user: {
    additionalFields: userAdditionalFields,
  },
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      sendForgotPasswordEmail(user.email, url);
    },
    resetPasswordTokenExpiresIn: 60 * 60,
  },
  databaseHooks: {
    session: {
      create: {
        // Open every new session in the user's most recently joined
        // organization. Users without one are sent to onboarding instead.
        before: async (session) => {
          const [latestMembership] = await db
            .select({ organizationId: schema.members.organizationId })
            .from(schema.members)
            .where(eq(schema.members.userId, session.userId))
            .orderBy(desc(schema.members.createdAt))
            .limit(1);

          if (!latestMembership) {
            return { data: session };
          }

          return {
            data: {
              ...session,
              activeOrganizationId: latestMembership.organizationId,
            },
          };
        },
      },
    },
  },

  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.users,
      account: schema.accounts,
      session: schema.sessions,
      verification: schema.verifications,
      organization: schema.organizations,
      member: schema.members,
      invitation: schema.invitations,
    },
  }),

  advanced: {
    database: {
      generateId: false,
    },
  },

  plugins: [
    organization({
      ac: betterAuthAc,
      roles: betterAuthRoles,
      requireEmailVerificationOnInvitation: true,
      sendInvitationEmail: async ({ invitation, organization, inviter }) => {
        await sendOrgInviteEmail(invitation, organization, inviter);
      },
      invitationExpiresIn: 60 * 60 * 24 * 7,
      organizationHooks: {
        // Every organization starts with its system roles in place.
        afterCreateOrganization: async ({ organization }) => {
          await ensureSystemRoles(db, organization.id);
        },
        // Whatever access a member had in the organization goes with them.
        afterRemoveMember: async ({ member, organization }) => {
          await removeMemberAccess(db, organization.id, member.userId);
        },
      },
    }),
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        if (type === "email-verification") {
          await sendVerificationEmail(email, otp);
        }
      },
    }),
  ],
});

export { ensureSystemRoles, removeMemberAccess } from "./seed";
export { disabledOrganizationPaths };
