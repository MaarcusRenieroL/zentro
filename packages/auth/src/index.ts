import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { emailOTP, organization } from "better-auth/plugins";

import { db } from "@zentro/db";
import * as schema from "@zentro/db/schema";
import { sendForgotPasswordEmail, sendVerificationEmail } from "./lib/email";
import { validateProductionEnv } from "./lib/env";

validateProductionEnv();

const baseURL =
  process.env.BETTER_AUTH_URL ??
  process.env.NEXT_PUBLIC_BASE_URL ??
  "http://localhost:3000";
const secret = process.env.BETTER_AUTH_SECRET;

const trustedOrigins = Array.from(
  new Set([
    baseURL,
    process.env.NEXT_PUBLIC_BASE_URL,
    "http://localhost:3001",
    "http://*.localhost:3000",
  ]),
).filter((origin): origin is string => Boolean(origin));

const crossSubDomainCookies =
  process.env.NODE_ENV === "production"
    ? {
        enabled: true,
        domain: "zentro.com",
      }
    : undefined;

export const auth = betterAuth({
  baseURL,
  secret,
  trustedOrigins,
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      sendForgotPasswordEmail(user.email, url);
    },
    resetPasswordTokenExpiresIn: 60,
  },
  emailVerification: {
    afterEmailVerification: async ({ email, id, name, emailVerified }) => {
      console.log("id:", id);
      console.log("email:", email);
      console.log("name:", name);
      console.log("emailVerified:", emailVerified);
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
    crossSubDomainCookies,
  },

  plugins: [
    organization(),
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        if (type === "email-verification") {
          await sendVerificationEmail(email, otp);
        }
      },
    }),
  ],
});
