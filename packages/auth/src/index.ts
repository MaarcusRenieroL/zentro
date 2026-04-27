import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { emailOTP } from "better-auth/plugins";

import { db } from "@zentro/db";
import * as schema from "@zentro/db/schema";

export const auth = betterAuth({
  emailAndPassword: {
    enabled: true,
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
      ...schema,
    },
  }),

  advanced: {
    crossSubDomainCookies: {
      enabled: true,
      domain: process.env.NODE_ENV === "production" ? "zentro.com" : undefined,
    },
  },

  plugins: [
    emailOTP({
      async sendVerificationOTP() {},
    }),
  ],
});
